import { useEffect, useState } from 'react';
import { Button } from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import awsExports from './aws-exports';
import './App.css';
import { Transcript } from './types';
import LiveTranscriptions from './components/LiveTranscriptions';

//import Typewriter from 'react-ts-typewriter';
//import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { ContentLayout, SpaceBetween, Container } from '@cloudscape-design/components';


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
  const [transcript, setTranscript] = useState<Transcript>();
  const [lines, setLines] = useState<Transcript[]>([]);
  const [currentLine, setCurrentLine] = useState<Transcript[]>([]);
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

  useEffect(() => {
    if (transcript) {
      setTranscript(transcript);
      if (transcript.partial) {
        setCurrentLine([transcript]);
      } else {
        setLines([...lines, transcript]);
        setCurrentLine([]);
      }
    }
  }, [transcript]);

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

  const textToSpeech = (text: string): Promise<void> => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        reject(`An error occurred during speech synthesis: ${event.error}`);
      };

      synth.speak(utterance);
    });
  };

  const updateMessage = async (newMessage: string) => {
    setMessage(newMessage);
    await textToSpeech(newMessage);
  };

  

  return (
    <Authenticator loginMechanisms={['email']} formFields={formFields}>
      <h1 style={{color:'#ec4b31'}}>Chippy's Security Spectacular</h1>
			<h3 style={{color:'#37646f'}}>Learn Responsible AI on AWS</h3>
      <div style={{width:'100%', height: '800px'}}>
        <div style={{width:'50%', float:'left', paddingTop: '8%'}} id="top left">
          <img src="./images/story.gif" style={{width:'100%', height:'100%'}} alt="Image" />
        </div>
        <div style={{width:'50%', float:'right', paddingTop: '12%', paddingLeft: '10%', height: '85%', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
          <p>What would you like to ask Chippy about Responsible AI or AWS security in general?</p>
          <p>{message}</p> 
          <Button variant='primary' onClick={handleTranscribe}>Ask Chippy</Button>
              <>
                <ContentLayout>
                  <Container>
                    <SpaceBetween size='xs'>
                    <div style={{height: '200px'}} className={"transcriptionContainer"}>
                      {lines.map((line, index) => {
                      return (
                        <div key={index}>{line.text}<br/></div>
                      )
                      })}
                      {currentLine.length > 0 && 
                      currentLine.map((line, index) => {
                        return (
                        <div key={index}>
                          <strong>Channel {line.channel}</strong>: {line.text}
                          <br/>
                        </div>
                        )
                      })
                      }
                    </div>
                    </SpaceBetween>
                  </Container>
                </ContentLayout>
                <LiveTranscriptions
                  currentCredentials={currentCredentials}
                  mediaRecorder={mediaRecorder}
                  setMediaRecorder={setMediaRecorder}
                  setTranscriptionClient={setTranscriptionClient}
                  transcriptionClient={transcriptionClient}
                  transcribeStatus={transcribeStatus}
                  setTranscript={setTranscript}
                  startRoundProp={startRoundProp}
                  updateMessage={updateMessage}
                />
              </>
          </div>
          <div style={{width:'50%', float:'left', height: '15%'}} id='whitespace1'>
          <div style={{width:'50%', float:'right', paddingTop: '10%', marginTop: '20%'}} >
            
          </div>
        </div>
      </div>
    </Authenticator>
  );
};

export default ResponsibleAIPage;