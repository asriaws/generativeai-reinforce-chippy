import { useEffect, useState } from 'react';
import { Button } from '@cloudscape-design/components';
import { Routes, Route, Link} from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import awsExports from './aws-exports';
import './App.css';
import LiveTranscriptions from './components/LiveTranscriptions';
import ResponsibleAIPage from './responsibleAiPage';
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
  const [progressbar, setProgressbar] = useState("hidden");
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
    setProgressbar("")
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
        setProgressbar("hidden")
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
      {() => (
          <Routes>
            <Route path="/" element={<div>
              <h1 style={{color:'#0972d3'}}>Chippy's Security Spectacular</h1>
              <div style={{width:'100%', height: '600px'}}>
                <div style={{width:'50%', float:'left', paddingTop: '8%'}} id="top left">
                  <img src="./images/challenge.gif" style={{width:'100%', height:'100%'}} alt="Image" id="securityChallenge" />
                </div>
                <div style={{width:'50%', float:'right', paddingTop: '12%', paddingLeft: '10%', height: '85%', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
                  <p>Get ready to play security trivia with Chippy? Have fun and make Chippy move.</p>
                  <p>{message}</p> 
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
                  {progressbar == 'hidden' ? null : <img src="./images/playgame.gif" style={{width:'60%', height:'60%'}} alt="Image" />}
                </div>
                <div style={{width:'50%', float:'left', height: '15%'}} id='whitespace1'>
                    <div style={{width: '36%', float: 'left', textAlign: 'right'}}>
                      <Button variant='primary' onClick={fetchAskQuestionAPI}>Start the Game</Button>
                    </div>
                    <div style={{width: '34%', float: 'left', textAlign: 'right'}}>
                      <Link to="/responsible-ai">
                        <Button variant="primary">Storytime with Chippy</Button>
                      </Link>
                    </div>
                    <div style={{width: '28%', float: 'left'}}>
                      <Link to="/behindthescene">
                        <Button variant="primary">Behind the Scene</Button>
                      </Link>
                    </div>       
                </div>
              </div>
              </div>} />
           <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
      </Routes>
      )}
    </Authenticator>
  );
}
export default ChallengePage;