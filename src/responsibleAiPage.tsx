import { useEffect, useState } from 'react';
import { Routes, Route, Link} from 'react-router-dom';
import { Button } from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import awsExports from './aws-exports';
import './App.css';
import LiveTranscriptions from './components/LiveTranscriptions';
import ChallengePage from './challenge';
Auth.configure(awsExports);



const ResponsibleAIPage = () => {
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
  const [progressbar, setProgressbar] = useState("hidden");
  //const [transcript, setTranscript] = useState<Transcript>();
  //const [lines, setLines] = useState<Transcript[]>([]);
  //const [currentLine, setCurrentLine] = useState<Transcript[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<AudioWorkletNode>();
  const [message, setMessage] = useState("");
  const [startRoundProp] = useState<boolean>(false);

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

  /* useEffect(() => {
    if (transcript) {
      setTranscript(transcript);
      if (transcript.partial) {
        setCurrentLine([transcript]);
      } else {
        setLines([...lines, transcript]);
        setCurrentLine([]);
      }
    }ß
  }, [transcript]); */

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
//Handletranscribe is part of the magic, sends transcript text to
  const handleTranscribe = async () => {
    setProgressbar("")
    setTranscribeStatus(!transcribeStatus);
    if (transcribeStatus) {
      console.log("Stopping transcription");
    } else {
      console.log("Starting transcription");
    }
    return transcribeStatus;
  };
  //text to speech
  //new text to speech
  const textToSpeech = (text: string): Promise<void> => {
    if (text) {
      text =  text.split('.').join('!.')
    }
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
        const joelleVoice = voices.find(voice => voice.voiceURI === 'Evan');
  
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
    setProgressbar("hidden")
    await textToSpeech(newMessage);
  };

  const fetchIntroAPI = async () => {
    //code to invoke evaluate response api
    const apiUrl = 'https://6gh412g0c7.execute-api.us-east-1.amazonaws.com/test/intro';
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
      })
      .catch(error => {
        // Handle any errors
        console.error('Error:', error);
      });
  };

  return (
    <Authenticator loginMechanisms={['email']} formFields={formFields}>
      {() => (
          <Routes>
            <Route path="/" element={<div>
              <h1 style={{color:'#37646f'}}>Chippy's Security Spectacular</h1>
					    <h3 style={{color:'black'}}>Powered by Generative AI on AWS</h3>
              <div style={{width:'100%', height: '800px'}}>
                <div style={{width:'50%', float:'left', paddingTop: '8%'}} id="top left">
                  <img src="./images/story.gif" style={{width:'100%', height:'100%'}} alt="Image" />
                </div>
                <div style={{width:'50%', float:'right', paddingTop: '12%', paddingLeft: '10%', height: '65%', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
                  <p>What would you like to ask Chippy about Responsible AI or AWS security in general?</p>
                  <p>{message}</p> 
                      <>
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
                      </>
                      {progressbar == 'hidden' ? null : <img src="./images/playgame.gif" style={{width:'60%', height:'60%'}} alt="Image" />}
                  </div>
                  <div style={{width:'50%', float:'left', height: '35%'}} id='whitespace1'>                  
                      <div style={{width: '44%', float: 'left', textAlign: 'right'}}>
                          <Button variant='primary' onClick={handleTranscribe}>Ask Chippy</Button>
                      </div>
                      <div style={{width: '28%', float: 'left', textAlign: 'right'}}>
                        <Link to="/security-challenge" onClick={fetchIntroAPI}>
                          <Button variant="primary">Play with Chippy</Button>
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
              <Route path="/security-challenge" element={<ChallengePage />} />
          </Routes>
           )}
    </Authenticator>
  );
};

export default ResponsibleAIPage;