
import { Auth } from 'aws-amplify';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import ReactPlayer from 'react-player';
import awsExports from './aws-exports';
import './App.css';
Auth.configure(awsExports);

const BehindTheScene = () => {
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

  return (
    <Authenticator loginMechanisms={['email']} formFields={formFields}>
      <h1 style={{color:'#37646f'}}>Behind the Scene</h1>
      <div className="iframe-container">
      <ReactPlayer
        className='react-player fixed-bottom'
        url= 'videos/chippy.mp4'
        width='100%'
        height='100%'
        controls = {true}
        loop={true}
        playing={true} 
        muted={true}
       />
      </div>
    </Authenticator>
  );
}
export default BehindTheScene;