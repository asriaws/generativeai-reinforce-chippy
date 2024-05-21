
import { useEffect, useState } from "react";

import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  LanguageCode
} from '@aws-sdk/client-transcribe-streaming';
import { ICredentials } from "@aws-amplify/core";
import pEvent from 'p-event';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import {
  RecordingProperties,
  MessageDataType,
  LiveTranscriptionProps
} from "../types";


const sampleRate = import.meta.env.VITE_TRANSCRIBE_SAMPLING_RATE;
const language = import.meta.env.VITE_TRANSCRIBE_LANGUAGE_CODE as LanguageCode;
const audiosource = import.meta.env.VITE_TRANSCRIBE_AUDIO_SOURCE;


const startStreaming = async (
  handleTranscribeOutput: (data: string, partial: boolean, transcriptionClient: TranscribeStreamingClient, mediaRecorder: AudioWorkletNode) => void,
  currentCredentials: ICredentials,
  setInputText: (text: string) => void //new
) => {

  const audioContext = new window.AudioContext();
  let stream: MediaStream;
  
  if (audiosource === 'ScreenCapture') {
    stream = await window.navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  } else {
    stream = await window.navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
  }

  const source1 = audioContext.createMediaStreamSource(stream);

  const recordingprops: RecordingProperties = {
    numberOfChannels: 1,
    sampleRate: audioContext.sampleRate,
    maxFrameCount: audioContext.sampleRate * 1 / 10
  };

  try {
    await audioContext.audioWorklet.addModule('./worklets/recording-processor.js');
  } catch (error) {
    console.log(`Add module error ${error}`);
  }
  const mediaRecorder = new AudioWorkletNode(
    audioContext,
    'recording-processor',
    {
      processorOptions: recordingprops,
    },
  );

  const destination = audioContext.createMediaStreamDestination();

  mediaRecorder.port.postMessage({
    message: 'UPDATE_RECORDING_STATE',
    setRecording: true,
  });

  source1.connect(mediaRecorder).connect(destination);
  mediaRecorder.port.onmessageerror = (error) => {
    console.log(`Error receving message from worklet ${error}`);
  };

  const audioDataIterator = pEvent.iterator<'message', MessageEvent<MessageDataType>>(mediaRecorder.port, 'message');

  const getAudioStream = async function* () {
    for await (const chunk of audioDataIterator) {
      if (chunk.data.message === 'SHARE_RECORDING_BUFFER') {
        const abuffer = pcmEncode(chunk.data.buffer[0]);
        const audiodata = new Uint8Array(abuffer);
        // console.log(`processing chunk of size ${audiodata.length}`);
        yield {
          AudioEvent: {
            AudioChunk: audiodata,
          },
        };
      }
    }
  };
  const transcribeClient = new TranscribeStreamingClient({
    region: 'us-east-1',
    credentials: currentCredentials,
  });

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: language,
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: sampleRate,
    AudioStream: getAudioStream(),
  });
  const data = await transcribeClient.send(command);
  console.log('Transcribe sesssion established ', data.SessionId);

  let inputText = ''; // Initialize an empty string to store the input text NEW
  const startTime = Date.now(); // Get the start time of the transcription NEW

  if (data.TranscriptResultStream) {
    for await (const event of data.TranscriptResultStream) {      //new
      const currentTime = Date.now();               //new
      const elapsedTime = currentTime - startTime; //new
      if (elapsedTime > 5000) {                   // Stop processing after 5 seconds NEW
        break;                                    //new
      }                                           //new
      if (event?.TranscriptEvent?.Transcript) {
        for (const result of event?.TranscriptEvent?.Transcript.Results || []) {
          if (result?.Alternatives && result?.Alternatives[0].Items) {
            let completeSentence = ``;
            for (let i = 0; i < result?.Alternatives[0].Items?.length; i++) {
              completeSentence += ` ${result?.Alternatives[0].Items[i].Content}`;
            }
            inputText += completeSentence; // Append each complete sentence to the input text NEW
            // console.log(`Transcription: ${completeSentence}`);
            handleTranscribeOutput(
              completeSentence,
              result.IsPartial || false,
              transcribeClient,
              mediaRecorder,
            );
          }
        }
      }
    }  
  }
  setInputText(inputText.trim()); // Set the input text after the transcription is complete or 5 seconds have elapsed

  // Call lambda Function for getting the response 
  const lambdaClient = new LambdaClient({
    region: 'us-east-1',
    credentials: currentCredentials,
  });

  // use lambdaClient to InvokeCommand with input JSON
  const input = { "question": inputText }; //new
  const inputJSON = JSON.stringify(input);

  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: "askChippy",
      InvocationType: "RequestResponse",
      Payload: inputJSON,
    })
  );

  const payload = JSON.parse(new TextDecoder().decode(response.Payload));

  // Text to Speech Conversion
  const text = payload.body;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  synth.speak(utterance);
};


const stopStreaming = async (
  mediaRecorder: AudioWorkletNode,
  transcribeClient: { destroy: () => void; }
) => {
  if (mediaRecorder) {
    mediaRecorder.port.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: false,
    });
    mediaRecorder.port.close();
    mediaRecorder.disconnect();
  } else {
    console.log('no media recorder available to stop');
  }

  if (transcribeClient) {
    transcribeClient.destroy();
  }
};

const pcmEncode = (input: Float32Array) => {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
};

const LiveTranscriptions = (props: LiveTranscriptionProps) => {
  const {
    transcribeStatus,
    mediaRecorder,
    transcriptionClient,
    currentCredentials,
    setMediaRecorder,
    setTranscriptionClient,
    setTranscript,
  } = props;

  const [inputText, setInputText] = useState(''); // Add a state variable for the input text NEW

  const onTranscriptionDataReceived = (
    data: string,
    partial: boolean,
    transcriptionClient: TranscribeStreamingClient,
    mediaRecorder: AudioWorkletNode,
  ) => {
    setTranscript({
      channel: '0',
      partial: partial,
      text: data,
    });
    setMediaRecorder(mediaRecorder);
    setTranscriptionClient(transcriptionClient);
  };

  const startRecording = async () => {
    if (!currentCredentials) {
      console.error('credentials not found');
      return;
    }
    try {
      await startStreaming(
        onTranscriptionDataReceived,
        currentCredentials,
        setInputText
      );
    } catch (error) {
      alert(`An error occurred while recording: ${error}`);
      await stopRecording();
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && transcriptionClient) {
      await stopStreaming(mediaRecorder, transcriptionClient);
    } else {
      console.log('no media recorder');
    }
  };

  async function toggleTranscribe() {

    if (transcribeStatus) {
      console.log('startRecording');
      console.log('Input Text:', inputText); // Use inputText here NEW
      await startRecording();
    } else {
      console.log('stopRecording');
      await stopRecording();
    }
  }

  useEffect(() => {
    toggleTranscribe();
  }, [transcribeStatus]);

  return (
    <></>
  );
}

export default LiveTranscriptions;

