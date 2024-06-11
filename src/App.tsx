import { Routes, Route, Link} from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import './App.css';
import { Button } from '@cloudscape-design/components';
import ResponsibleAIPage from './responsibleAiPage';
import ChallengePage from './challenge';
import BehindTheScene from './behindthescene';
import { Auth } from 'aws-amplify';
import Typewriter from 'react-ts-typewriter';

Auth.configure(awsExports);

function App() {

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
  const TyperwriterText = "Hello, I’m Chipper the robot dog, but call me Chippy for short. Welcome to Chipper’s Security Spectacular! Get ready to learn about AWS security while competing in exciting challenges. Teams will face off, answering AWS security questions to claim victory. If you don’t want to compete right away or want to brush up your knowledge first, you can play “Ask Chippy” to ask me AWS security questions. Let the fun and learning begin! Woof!";
  //
  // Code for calling Intro API for Challenge button
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
                <div style={{width:'100%', height: '100%'}} id="top level div">
					<h1 style={{color:'#0972d3'}}>Chippy's Security Spectacular</h1>
					<h3 style={{color:'#37646f'}}>Powered by Generative AI on AWS</h3>
					<div style={{width:'50%', float:'left', paddingTop: '5%'}} id="top left">
						<img src="./images/story-teller.png" style={{width:'100%', height:'100%'}} alt="Image" />
					</div>
					<div style={{width:'50%', float:'right', paddingTop: '15%', paddingLeft: '10%', height: '600px', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
						<br/>
						<br/>
						<Typewriter text={TyperwriterText}  loop= {true} delay= {10000}/>
					</div>
					<div style={{width:'50%', float:'left', height: '20%'}} id='whitespace1'>
						<div style={{width: '44%', float: 'left', textAlign: 'right'}}>
							<Link to="/responsible-ai">
								<Button variant="primary">Ask Chippy</Button>
							</Link>
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
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
            <Route path="/security-challenge" element={<ChallengePage />} />
			<Route path="/behindthescene" element={<BehindTheScene />} />
          </Routes>
     
      )}
    </Authenticator>
  );
}

export default App;