import { useEffect, useState } from 'react';
import { Button } from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import awsExports from './aws-exports';
import './App.css';
import LiveTranscriptions from './components/LiveTranscriptions';
//import Typewriter from 'react-ts-typewriter';

Auth.configure(awsExports);

const ChallengePage = () => {
  const [currentCredentials, setCurrentCredentials] = useState<ICredentials>({
    accessKeyId: "",
    authenticated: false,
    expiration: undefined,
    identityId: "",
    secretAccessKey: "",
    sessionToken: ""
  });

  const [transcriptionClient, setTranscriptionClient] = useState<TranscribeStreamingClient | null>(null);
  const [transcribeStatus, setTranscribeStatus] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<AudioWorkletNode>();
  const [message, setMessage] = useState("");
  const [startRoundProp, setStartRoundProp] = useState<boolean>(false);

  useEffect(() => {
    async function getAuth() {
      const currCreds = await Auth.currentUserCredentials();
      return currCreds;
    }

    getAuth().then((res) => {
      const currCreds = res;
      setCurrentCredentials(currCreds);
    });
  }, []);

  const formFields = {
    signUp: {
      email: {
        order: 1,
        isRequired: true,
      },
      name: {
        order: 2,
        isRequired: true,
      },
      password: {
        order: 3,
      },
      confirm_password: {
        order: 4,
      },
    },
  };

  const handleTranscribe = async () => {
    setTranscribeStatus(!transcribeStatus);
    if (transcribeStatus) {
      console.log("Stopping transcription");
    } else {
      console.log("Starting transcription");
    }
    return transcribeStatus;
  };

  //new text to speech
  const textToSpeech = (text: string): Promise<void> => {
    const synth = window.speechSynthesis;
    let utterance: SpeechSynthesisUtterance;
    let resolvePromise: () => void;
  
    // Replace "AWS" with "A // W // S" and periods with a pause
    const processedText = text.replace(/AWS/g, 'A // W // S').replace(/\./g, ' // ');
  
    return new Promise((resolve, reject) => {
      resolvePromise = resolve;
      let voices: SpeechSynthesisVoice[] = [];
  
      const handleVoicesChanged = () => {
        voices = synth.getVoices();
        const joelleVoice = voices.find(voice => voice.voiceURI === 'Joelle');
  
        if (joelleVoice) {
          utterance = new SpeechSynthesisUtterance(processedText);
          utterance.voice = joelleVoice;
          utterance.onend = resolvePromise;
          utterance.onerror = (event) => {
            reject(`An error occurred during speech synthesis: ${event.error}`);
          };
          synth.speak(utterance);
        } else {
          reject('Voice "Joelle" not found');
        }
      };
  
      synth.addEventListener('voiceschanged', handleVoicesChanged);
  
      if (synth.getVoices().length > 0) {
        handleVoicesChanged();
      }
    });
  };

  const updateMessage = async (newMessage: string) => {
    setMessage(newMessage);
    await textToSpeech(newMessage);
  };


  const fetchAskQuestionAPI = async () => {
    const apiUrl = 'https://6gh412g0c7.execute-api.us-east-1.amazonaws.com/test/askQuestion';
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        console.log('Response headers:', response.headers);
        const data = await response.json();
        console.log('API Response:', data);
  
        const responseString = JSON.stringify(data);
  
        // Check if the response contains 'question' key
        const questionRegex = /'question':\s*'([^']+)'/;
        const match = responseString.match(questionRegex);
  
        let question;
        if (match && match.length > 1) {
          question = match[1];
        } else {
          // If 'question' key is not found, assume the response is just the question string
          question = responseString.replace(/"/g, '');
        }
  
        console.log('Question:', question);
  
        await updateMessage(question);
        setStartRoundProp(true);
        handleTranscribe();
      } else {
        throw new Error('Request failed with status code: ' + response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Authenticator loginMechanisms={['email']} formFields={formFields}>
      <h1 style={{color:'#ec4b31'}}>Chippy's Security Spectacular</h1>
			<h3 style={{color:'#37646f'}}>Learn Responsible AI on AWS</h3>
      <div style={{width:'100%', height: '800px'}}>
        <div style={{width:'50%', float:'left', paddingTop: '8%'}} id="top left">
        <img src="./images/playgame.gif" style={{width:'100%', height:'100%'}} alt="Image" id="securityChallenge" />
        </div>
        <div style={{width:'50%', float:'right', paddingTop: '12%', paddingLeft: '10%', height: '85%', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
          <p>Are you ready with Generative AI and Security Concept on AWS? Help Chippy find his home</p>
          <p>{message}</p> 
          <Button variant='primary' onClick={fetchAskQuestionAPI}>Start the Game</Button>

      <LiveTranscriptions
        currentCredentials={currentCredentials}
        mediaRecorder={mediaRecorder}
        setMediaRecorder={setMediaRecorder}
        setTranscriptionClient={setTranscriptionClient}
        transcriptionClient={transcriptionClient}
        transcribeStatus={transcribeStatus}
        setTranscribeStatus={setTranscribeStatus}
        startRoundProp={startRoundProp}
        updateMessage={updateMessage}
      />
   </div>
          <div style={{width:'50%', float:'left', height: '15%'}} id='whitespace1'>
          <div style={{width:'50%', float:'right', paddingTop: '10%', marginTop: '20%'}} >
            
          </div>
        </div>
      </div>
    </Authenticator>
  );
}
export default ChallengePage;