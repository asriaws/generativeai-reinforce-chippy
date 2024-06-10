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
import { DynamoDBClient, ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import React from 'react';


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
  const [teamTurn, setTeamTurn] = useState(0);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [Round, setRound] = useState(0);
  let congratsMessageDisplayed = false; // Add this line
  const [isTTSRunning, setIsTTSRunning] = useState(false);



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
    setIsTTSRunning(true); // Set isTTSRunning to true before starting text-to-speech
    setTimeout(fetchGameInfo, 3000);
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
          utterance.onend = () => {
            resolvePromise();
            setTimeout(() => {
              setIsTTSRunning(false); //turns off button loading state
            }, 500);
          };
          utterance.onerror = (event) => {
            reject(`An error occurred during speech synthesis: ${event.error}`);
            setIsTTSRunning(false); // Set isTTSRunning to false if an error occurs
          };
          synth.speak(utterance);
        } else {
          reject('Voice "Joelle" not found');
          setIsTTSRunning(false); // Set isTTSRunning to false if an error occurs
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
  
        const responseString = data; //JSON.stringify(data);
  
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
  //dynamodb
 

  //fetches turn and points from Dynamodb
  const fetchGameInfo = async () => {
    console.log('hasDisplayedWinMessage value:', congratsMessageDisplayed);
    // Check if the congratulatory message has already been displayed
    if (congratsMessageDisplayed == true) {
      console.log('Congratulatory message already displayed, skipping fetchGameInfo');
      return; // Exit the function early if the message has been displayed
    }
    
    try {
      const dynamoDBClient = new DynamoDBClient({
        region: awsExports.aws_project_region,
        credentials: currentCredentials,
      });

      //fetch GameID from ActiveGame
      const params2 = {
        TableName: "ActiveGame",
        // Add any additional parameters or conditions if needed
      };
  
      const scanCommand2 = new ScanCommand(params2);
      const response2 = await dynamoDBClient.send(scanCommand2);
  
      // Process the fetched data
      const data2 = response2.Items;
      console.log("Fetched data from ActiveGame table:", data2);
      
      let gameId: string | undefined;

      if (data2 && data2.length > 0) {
        const activeGameData = data2[0]; // Assume there is only one active game
        gameId = activeGameData.gameId.S;
      } else {
        console.log("No active game found in ActiveGame table.");
      }


      //const gameId = "fcf3f4af-3294-40cb-a608-fc518542ec1d";
  if (gameId) {

      const params = {
        TableName: "ChippyGameState",
        KeyConditionExpression: "gameId = :gameId",
        ExpressionAttributeValues: {
          ":gameId": { S: gameId },
        },
        ProjectionExpression: "hasWon, turn, team_1_score, team_2_score, round",
        ScanIndexForward: false, // Sort in descending order
        Limit: 1, // Retrieve only the record with the highest Round value
      };
  
      const queryCommand = new QueryCommand(params);
      const response = await dynamoDBClient.send(queryCommand);

    // Process the fetched data
    const data = response.Items;
    console.log("Fetched data:", data);

    if (data && data.length > 0) {
      const gameData = data[0];

        setTeamTurn(gameData.turn && gameData.turn.N ? parseInt(gameData.turn.N, 10) : 0);
        setTeamAScore(gameData.team_1_score && gameData.team_1_score.N ? parseInt(gameData.team_1_score.N, 10) : 0);
        setTeamBScore(gameData.team_2_score && gameData.team_2_score.N ? parseInt(gameData.team_2_score.N, 10) : 0);
        setRound(gameData.round && gameData.round.N ? parseInt(gameData.round.N, 10) : 0);

         // Check if hasWon is true
         if (gameData.hasWon && gameData.hasWon.BOOL === true) {
          congratsMessageDisplayed = true; // Set the flag to true after displaying the message
          console.log('hasDisplayedWinMessage value after first setting it:', congratsMessageDisplayed);
          // Trigger the congratulatory message
          updateMessage('Congratulations! Thank you for playing, have a wonderful day!');
        }
     }
  }
 } 
    catch (error) {
      console.error('Error fetching game info from DynamoDB:', error);
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
      
                <div style={{ position: "absolute", top: 10, right: 10, padding: 8, backgroundColor: "#f0f0f0" }}>
                  <strong>Current Team's Turn:</strong> {teamTurn}
                  <br />
                  <strong>Team 1 Score:</strong> {teamAScore}
                  <br />
                  <strong>Team 2 Score:</strong> {teamBScore}
                  <br />
                  <strong>Round:</strong> {Round}
                </div>

                <div style={{width:'50%', float:'right', paddingTop: '12%', height: '85%', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
                  <div style={{ marginLeft: '20px' }}>
                    <p>Enjoy playing a game with Chippy!</p>
                    <div>
                    {
                      message.split("\n").map(function(item, idx) {
                          return (
                              <label key={idx}>
                                  {item}
                                  <br/>
                              </label>
                          )
                      })
                    }
                  </div>
                  </div>
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
                    userQuestion={() => {}} // Pass an empty arrow function for userQuestion
                    handleAnswer={() => {}} 
                  />
                  {progressbar == 'hidden' ? null : <img src="./images/playgame.gif" style={{width:'60%', height:'60%'}} alt="Image" />}
                </div>
                <div style={{width:'50%', float:'left', height: '15%', display: 'flex', flexDirection: 'column'}} id='whitespace1'>
                    <div style={{width: '100%', textAlign: 'center', marginBottom: '50px'}}>
                    <Button variant='primary' onClick={fetchAskQuestionAPI} fullWidth loading={isTTSRunning}>Play</Button>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                  <div style={{marginRight: '10px'}}>
                   <Link to="/responsible-ai">
                 <Button variant="primary">Ask Chippy</Button>
                  </Link>
                   </div>
                  <div>
                  <Link to="/behindthescene">
               <Button variant="primary">Behind the Scene</Button>
                 </Link>
                </div>
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