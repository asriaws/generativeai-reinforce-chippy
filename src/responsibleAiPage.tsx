import { useEffect, useState } from 'react';
import { Button } from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import awsExports from './aws-exports';
import './App.css';
//import { Transcript } from './types';
import LiveTranscriptions from './components/LiveTranscriptions';
//import ChallengePage from './challenge';
//import { ContentLayout, SpaceBetween, Container } from '@cloudscape-design/components';
import { QuestionAnswer } from './types';


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
  //const [message, setMessage] = useState("");
  const [startRoundProp] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<QuestionAnswer[]>([]);

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
  const textToSpeech = (text: string): Promise<void> => {
    const synth = window.speechSynthesis;
  
    return new Promise((resolve, reject) => {
      let resolvePromise: () => void;
      resolvePromise = resolve;
      let voices: SpeechSynthesisVoice[] = [];
  
      const handleVoicesChanged = () => {
        voices = synth.getVoices();
        const evanVoice = voices.find(voice => voice.voiceURI === 'Evan');
  
        if (evanVoice) {
          const utterance = new SpeechSynthesisUtterance(text); // Create a new instance here
          utterance.voice = evanVoice;
          utterance.onend = resolvePromise;
          utterance.onerror = (event) => {
            reject(`An error occurred during speech synthesis: ${event.error}`);
          };
          synth.speak(utterance);
        } else {
          reject('Voice "Evan" not found');
        }
      };
  
      if (voices.length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      } else {
        handleVoicesChanged();
      }
    });
  };

  const updateMessage = async (newMessage: string) => {
    //setMessage(newMessage);
    setProgressbar("hidden")
    await textToSpeech(newMessage);
  };

  const handleUserQuestion = (inputText: string) => {
    setConversationHistory((prevHistory) => [
      ...prevHistory,
      { question: inputText, answer: '' },
    ]);
  };
  
  const handleAnswer = (answer: string) => {
    setConversationHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      newHistory[newHistory.length - 1].answer = answer;
      return newHistory;
    });
  };

  return (
    <Authenticator loginMechanisms={['email']} formFields={formFields}>
    <div>
    </div>
    <h1>Responsible AI With Chippy</h1>
    <div style={{width:'100%', height: '800px'}}>
    <div style={{width:'50%', float:'right', paddingTop: '10%', marginTop: '20%'}} >
      <p>What would you like to ask Chippy about Responsible AI? Chippy is happy to enable us how to use AI in a kind and helpful way.</p>
      
      <Button onClick={handleTranscribe}>
        Submit
      </Button>
      <div style={{ marginTop: '20px' }}>
  <h3>Conversation History</h3>
  <ul>
    {conversationHistory.map((item, index) => (
      <li key={index}>
        <p>
          <strong>Question:</strong> {item.question}
        </p>
        <p>
          <strong>Answer:</strong> {item.answer}
        </p>
      </li>
    ))}
  </ul>
</div>
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
            userQuestion={handleUserQuestion}
            handleAnswer={handleAnswer}
					  />
					</>
          {progressbar == 'hidden' ? null : <img src="./images/playgame.gif" style={{width:'60%', height:'60%'}} alt="Image" />}
    </div>
    <div style={{width:'50%', float:'left', paddingTop: '10%'}} >
      <img src="./images/story.gif" style={{width:'100%', height:'100%'}} alt="Image" />
    </div>
    </div>
    </Authenticator>
  );
};

export default ResponsibleAIPage;