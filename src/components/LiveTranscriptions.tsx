
import { useEffect, useState } from "react";

import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  LanguageCode
} from '@aws-sdk/client-transcribe-streaming';
import { ICredentials } from "@aws-amplify/core";
import pEvent from 'p-event';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import {
  RecordingProperties,
  MessageDataType,
  LiveTranscriptionProps
} from "../types";


const sampleRate = import.meta.env.VITE_TRANSCRIBE_SAMPLING_RATE;
const language = import.meta.env.VITE_TRANSCRIBE_LANGUAGE_CODE as LanguageCode;
const audiosource = import.meta.env.VITE_TRANSCRIBE_AUDIO_SOURCE;


const startStreaming = async (
  currentCredentials: ICredentials,
  setInputText: (text: string) => void, //new
  startRoundProp: boolean,
  updateMessage: (newMessage: string) => void,
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
        yield {
          AudioEvent: {
            AudioChunk: audiodata,
          },
        };
      }
    }
  };
  //Sends audio stream to AWS Transcribe
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
          }
        }
      }
    }  
  }
  setInputText(inputText.trim()); // Set the input text after the transcription is complete or 5 seconds have elapsed
  

  console.log("After Lambda Invoke01")
  //Don't touch
  const lambdaClient = new LambdaClient({
    region: 'us-east-1',
    credentials: currentCredentials,
  });
  //Game Flow Starts Here
  //Execute Intro


  //Transcribe transcription message (stream response)
  const input = { "question": inputText }; //new
  const inputJSON = JSON.stringify(input);

  //triggers the Start Round Button
  if (startRoundProp == true) {
    //this is the code that will send the input (inputJSON) to the streamResponse task/evaluateresponse lambda
    const sendDataToKinesisStream = async (inputText: string) => {
      const input = { question: inputText };
      const inputJSON = JSON.stringify(input);
    
      const kinesisClient = new KinesisClient({
        region: 'us-east-1', // Replace with your AWS region
        credentials: currentCredentials,
      });
      //input data from transcribe encoding for Kinesis
      const encoder = new TextEncoder();
      const data = encoder.encode(inputJSON);

      const putRecordCommand = new PutRecordCommand({
        StreamName: 'evaluateResponse',
        Data: data,
        PartitionKey: 'shardId-000000000000',
      });
 
    try {
      const response = await kinesisClient.send(putRecordCommand);
      console.log('Record sent to Kinesis:', response);
    } catch (error) {
      console.error('Error sending record to Kinesis:', error);
    }
    };
    await sendDataToKinesisStream(inputText);
    await updateMessage("Sniffing out the right answer is no easy task, let’s paws and see if your answer will earn you a treat!");

    //code to invoke evaluate response api
    const apiUrl = 'https://6gh412g0c7.execute-api.us-east-1.amazonaws.com/test/evaluateResponse';
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          console.log('Response headers:', response.headers);
          return response.json(); // Parse the response as JSON
        } else {
          throw new Error('Request failed with status code: ' + response.status);
        }
      })
      .then(data => {
        // Handle the response data
        console.log('Response data:', data);
        // Use regular expressions to check if the response includes "Correct" or "Incorrect"
        const incorrectRegex = /Incorrect/i;
        
        if (incorrectRegex.test(data)) {
          // Call the API for correct answer
          console.log("Incorrect Answer");
        } else  {
          // Call the API for incorrect answer
          console.log("Correct Answer");
        }

        updateMessage(data);
      })
      .catch(error => {
        // Handle any errors
        console.error('Error:', error);
      });
     
    // Perform any additional actions or logic when startRoundProp is true
    console.log("Start Round prop is true");
  }
  else ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  {
    // Calls AskChippy lambda Function
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: "askChippy",
      InvocationType: "RequestResponse",
      Payload: inputJSON,
    })
  );
  //gets payload back from function
  const payload = JSON.parse(new TextDecoder().decode(response.Payload));

  // Text to Speech Conversion
  const text = payload.body;
  updateMessage(text);
  }
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
    setTranscribeStatus
  } = props;

  const [inputText, setInputText] = useState(''); // Add a state variable for the input text NEW

  const startRecording = async () => {
    if (!currentCredentials) {
      console.error('credentials not found');
      return;
    }
    try {
      await startStreaming(
        //onTranscriptionDataReceived,
        currentCredentials,
        setInputText,
        props.startRoundProp,
        props.updateMessage,
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
      // Set a timeout to update the transcribeStatus state after 5 seconds
    const timeout = setTimeout(() => {
      setTranscribeStatus(false);
    }, 5000);
    // Clean up the timeout when the component unmounts or transcribeStatus changes
    return () => clearTimeout(timeout);

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

