import { useEffect, useState } from 'react'
import {
	BrowserRouter as Router,
	Routes,
	Route
} from "react-router-dom";
import {
	ContentLayout,
	Header,
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


async function signOut() {
	try {
		await Auth.signOut();
	} catch (error) {
		console.log('error signing out: ', error);
	}
}

const TypewriterText = 'Once upon a time, there was a little girl. One day, Lily parents brought home a new robot puppy named Chippy. Chippy could do all sorts of cool tricks and games. However, Chippy would sometimes bark loudly and scare Lily. Lilys mom explained to her that Chippy was made using something called AI, which means it was really smart, but it didnt always know right from wrong. Mom said that the people who made Chippy needed to make sure they were being "Responsible AI." This means they had to teach Chippy to be kind, fair, and safe, just like we teach real puppy.'

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
	const textToSpeech = async () => {
		const text = "This is a test of text to speech";
		const synth = window.speechSynthesis;
		const utterance = new SpeechSynthesisUtterance(text);
		synth.speak(utterance);
	};

	
	return (
		<>
			<div style={{width:'100%'}}>
				<div style={{width:'50%', float:'left', paddingTop: '10%'}}>
								<img src="./images/story-teller.png" style={{width:'100%', height:'100%'}} alt="Image" />
				</div>
				<div style={{width:'50%', float:'left', paddingTop: '10%'}} id='whitespace'>
					<Typewriter text='What is KMS?'/>
					<br/>
					<br/>
					<Typewriter text={TypewriterText} loop='true'/>
				</div>
			</div>
			<div>
			<Button variant='primary' onClick={handleTranscribe}>
																{ transcribeStatus ? "Stop Transcription" : "Start Transcription" } 
			</Button>
			<Button variant='primary' onClick={textToSpeech}>
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
									<ContentLayout
										header={
											<SpaceBetween size="m">
												<Header
													variant="h1"
													description="Demo of live transcriptions"
													actions={
														<SpaceBetween direction="horizontal" size="m">															
															
														</SpaceBetween>
													}
												>
												
												</Header>
											</SpaceBetween>
										}
									>
										<Container
													header={
														<Header
															variant="h2"
														>
															Transcriptions
														</Header>
													}
											>
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
