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
  const TyperwriterText = 'Once upon a time, there was a little girl. One day, Lily parents brought home a new robot puppy named Chippy. Chippy could do all sorts of cool tricks and games. However, Chippy would sometimes bark loudly and scare Lily. Lilys mom explained to her that Chippy was made using something called AI, which means it was really smart, but it didnt always know right from wrong. Mom said that the people who made Chippy needed to make sure they were being Responsible AI. This means they had to teach Chippy to be kind, fair, and safe, just like we teach real puppy.';
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
					<h1 style={{color:'#37646f'}}>Chippy's Security Spectacular</h1>
					<h3 style={{color:'black'}}>Powered by Generative AI on AWS</h3>
					<div style={{width:'50%', float:'left', paddingTop: '5%'}} id="top left">
						<img src="./images/story-teller.png" style={{width:'100%', height:'100%'}} alt="Image" />
					</div>
					<div style={{width:'50%', float:'right', paddingTop: '15%', paddingLeft: '10%', height: '600px', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
						<Typewriter text='What is AWS Key Management Service?'/>
						<br/>
						<br/>
						<Typewriter text={TyperwriterText}  loop= {true} delay= {10000}/>
					</div>
					<div style={{width:'50%', float:'left', height: '20%'}} id='whitespace1'>
						<div style={{width: '44%', float: 'left', textAlign: 'right'}}>
							<Link to="/responsible-ai">
								<Button variant="primary">Storytime with Chippy</Button>
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