import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import './App.css';
import { Button } from '@cloudscape-design/components';
import ResponsibleAIPage from './responsibleAiPage';
import ChallengePage from './challenge';
import { Auth } from 'aws-amplify';
import Typewriter from 'react-ts-typewriter';


Auth.configure(awsExports);

async function signOut() {

	try {
		await Auth.signOut();
	} catch (error) {
		console.log('error signing out: ', error);
	}
}
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

  return (
    <Authenticator loginMechanisms={['email']} formFields={formFields}>
      {() => (
        <Router>
          <Routes>
            <Route path="/" element={<div>
                <div style={{width:'100%', height: '800px'}} id="top level div">
				<h1 style={{color:'#ec4b31'}}>Chippy's Security Spectacular</h1>
					<h3 style={{color:'#37646f'}}>Learn Responsible AI on AWS</h3>
					<div style={{width:'50%', float:'left', paddingTop: '8%'}} id="top left">
						<img src="./images/story-teller.png" style={{width:'100%', height:'100%'}} alt="Image" />
					</div>
					<div style={{width:'50%', float:'right', paddingTop: '20%', paddingLeft: '10%', height: '80%', fontFamily: 'Geneva', fontWeight: 800}} id='top right'>
						<Typewriter text='What is AWS Key Management Service?'/>
						<br/>
						<br/>
						<Typewriter text={TyperwriterText}  loop= {true} delay= {1000}/>
					</div>
					<div style={{width:'50%', float:'left', height: '20%'}} id='whitespace1'>
						<div style={{width: '45%', float: 'left', textAlign: 'right'}}>
							<Link to="/responsible-ai">
								<Button variant="primary">Learn with Story</Button>
							</Link>
						</div>
						<div style={{width: '30%', float: 'left', textAlign: 'right'}}>
							<Link to="/security-challenge">
								<Button variant="primary">Play with Chippy</Button>
							</Link>
						</div>
						<div style={{width: '20%', float: 'left'}}>
							<Button variant='primary' onClick={signOut}>
								Sign out
							</Button>
						</div>
					</div>
				</div>                 
              </div>} />
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
            <Route path="/security-challenge" element={<ChallengePage />} />
          </Routes>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;