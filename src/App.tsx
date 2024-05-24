import { useEffect, useState } from 'react'
import {
	BrowserRouter as Router,
	Routes,
	Route
} from "react-router-dom";
import {
	ContentLayout,
	SpaceBetween,
	Button,
	Container,
} from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import awsExports from './aws-exports';
import './App.css'
import { Transcript } from './types';
import LiveTranscriptions from './components/LiveTranscriptions';

import Typewriter from 'react-ts-typewriter';
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

async function signOut() {
	try {
		await Auth.signOut();
	} catch (error) {
		console.log('error signing out: ', error);
	}
}

const TyperwriterText = 'Once upon a time, there was a little girl. One day, Lily parents brought home a new robot puppy named Chippy. Chippy could do all sorts of cool tricks and games. However, Chippy would sometimes bark loudly and scare Lily. Lilys mom explained to her that Chippy was made using something called AI, which means it was really smart, but it didnt always know right from wrong. Mom said that the people who made Chippy needed to make sure they were being Responsible AI. This means they had to teach Chippy to be kind, fair, and safe, just like we teach real puppy.';

Auth.configure(awsExports)

function App() {
	const [currentCredentials, setCurrentCredentials] = useState<ICredentials>({
		accessKeyId: "",
		authenticated: false,
		expiration: undefined,
		identityId: "",
		secretAccessKey: "",
		sessionToken: ""
	});
	// const [currentSession, setCurrentSession] = useState<CognitoUserSession>();
	
	const [transcriptionClient, setTranscriptionClient] = useState<TranscribeStreamingClient | null>(null);
	const [transcribeStatus, setTranscribeStatus] = useState<boolean>(false);
	const [transcript, setTranscript] = useState<Transcript>();
	const [lines, setLines] = useState<Transcript[]>([]);
	const [currentLine, setCurrentLine] = useState<Transcript[]>([]);
	const [mediaRecorder, setMediaRecorder] = useState<AudioWorkletNode>();
	const [message, setMessage] = useState("");
	const [startRoundProp, setStartRoundProp] = useState<boolean>(false);

	useEffect(() => {
		async function getAuth() {
			const currCreds = await Auth.currentUserCredentials()
			return currCreds
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
	}, [transcript])
	
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
			console.log("Stopping transcription")
		} else {
			console.log("Starting transcription")
		}
		return transcribeStatus;
	};

	// Create function to convert text to speech to text
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

	//handles messages
	const updateMessage = async (newMessage: string) => {
		setMessage(newMessage);
		await textToSpeech(newMessage); // Optional: Call the textToSpeech function with the new message
	  };

	//Function to trigger Step Functions and Welcome Message
	const startStepFunction = async () => {
		try {
		  const stepFunctionsClient = new SFNClient({
			region: "us-east-1",
			credentials: currentCredentials,
		  });
	  
		  const startExecutionParams = {
			stateMachineArn: "arn:aws:states:us-east-1:989038966811:stateMachine:MyStateMachine-a2ruan05r",
			input: JSON.stringify({ /* optional input data */ }),
		  };
	  
		  const startExecutionCommand = new StartExecutionCommand(startExecutionParams);
		  await stepFunctionsClient.send(startExecutionCommand);
	  
		  const message = "Welcome to Chippy's Security Spectacular, how ya doin, get ready to have a fun time.";
		  updateMessage(message);
		} catch (error) {
		  console.error("Error starting Step Function:", error);
		  setMessage("Error starting Step Function.");
		}
	  };

	  //Function to trigger askQuestion Lambda Function
	  const invokeAskQuestion = async () => {
		try {
		  const lambdaClient = new LambdaClient({
			region: "us-east-1",
			credentials: currentCredentials,
		  });
	  
		  const invokeParams = {
			FunctionName: "askQuestion",
			Payload: JSON.stringify({ /* optional input data */ }),
		  };
	  
		  const invokeCommand = new InvokeCommand(invokeParams);
		  const response = await lambdaClient.send(invokeCommand);
		  const payload = JSON.parse(new TextDecoder().decode(response.Payload));
		  await updateMessage(payload.body);
		  setStartRoundProp(true); // Set the new prop value to true
		  handleTranscribe(); // Call handleTranscribe

		  console.log("Lambda function response:", response);
		  // Handle the response from the Lambda function as needed
		} catch (error) {
		  console.error("Error invoking Lambda function:", error);
		}
	  };

	
	return (
		<>				
		<div style={{width:'100%', height: '800px'}}>
			<div style={{width:'50%', float:'left', paddingTop: '10%'}}>
				<img src="./images/story-teller.png" style={{width:'100%', height:'100%'}} alt="Image" />
			</div>
			<div style={{width:'50%', float:'left', paddingTop: '10%', height: '80%'}} id='whitespace'>
				<Typewriter text='What is KMS?'/>
				<br/>
				<br/>
				<Typewriter text={TyperwriterText} loop= {true}/>
			</div>
			<div style={{width:'50%', float:'left', height: '20%'}} id='whitespace'>
				
			</div>
		</div>
		<div>
		</div>
		<div style={{width:'100%', height: '800px'}}>
			<div style={{width:'50%', float:'left', paddingTop: '10%', marginTop: '20%'}} >
				<p>What would you like to ask Chippy about Responsible AI? Chippy is happy to enable us how to use AI in a kind and helpful way.</p>
				<Button variant='primary' onClick={handleTranscribe} >
					Ask Chippy
				</Button>
			</div>
			<div style={{width:'50%', float:'left', paddingTop: '10%'}} >
				<img src="./images/story.gif" style={{width:'100%', height:'100%'}} alt="Image" />
			</div>
		</div>

		<div style={{width:'100%', height: '800px'}}>
			<div style={{width:'50%', float:'left', paddingTop: '10%'}} >
				<img src="./images/playgame.gif" style={{width:'100%', height:'100%'}} alt="Image" />
			</div>
			<div style={{width:'50%', float:'left', paddingTop: '10%', marginTop: '15%'}} >
				<p>Ahha, now that you learn, let's play a fun game with Chippy. Are you ready?</p>
				<Button variant='primary' onClick={startStepFunction}>
					Play with Chippy
				</Button>
			</div>	
		</div>
		<div>
        <p>{message}</p> {/* Display the message */}
  		<Button variant='primary' onClick={invokeAskQuestion}>
   				 Start Round
  		</Button>
		</div>

		<div>
			<Button variant='primary' onClick={handleTranscribe}>
				{ transcribeStatus ? "Stop Transcription" : "Start Transcription" } 
			</Button>
			<Button variant='primary'>
				Text to Speech																
			</Button>
			<Button variant='primary' onClick={signOut}>
				Sign out
			</Button>
			<Router>
			<Authenticator loginMechanisms={['email']} formFields={formFields}>
				{() => (
				<>
					<Routes>
						<Route path="/" element={<>
								<ContentLayout>
									<Container>
										<SpaceBetween size='xs'>
											<div style={{height: '663px'}} className={"transcriptionContainer"}>
												{lines.map((line, index) => {
														return (
															<div key={index}>
																<strong>Channel {line.channel}</strong>: {line.text}
																<br/>
															</div>
														)
													})
												}
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
						}/>
					</Routes>
				</>
				)}
			</Authenticator>
		</Router>
		</div>
		</>
		
	);
}

export default App
