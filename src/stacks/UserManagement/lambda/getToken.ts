import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  InitiateAuthRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  // console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);
  var cID = process.env.clientId;

  // Validate the body
  if (!body.email || !body.password) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing required fields',
    };
  }

  // create the params for getting the token
  var paramsPW: InitiateAuthRequest = {
    AuthFlow: 'USER_PASSWORD_AUTH', /* required */
    ClientId: cID!, /* required */

    AuthParameters: {
      USERNAME: body.email,
      PASSWORD: body.password,
    },
  };
  // console.log('paramsPW', JSON.stringify(paramsPW));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  // Try to run the authentication workflow
  try {
    const auth = await cognitoidentityserviceprovider.initiateAuth(paramsPW).promise();
    // console.log('auth.AuthenticationResult', auth.AuthenticationResult);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        // token: auth.AuthenticationResult?.AccessToken
        token: auth.AuthenticationResult,
      }),
    };

  } catch (err) {
    // If there is an error, return the error
    const error: any = err;
    console.log('error', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: error.message,
    };
  }


}

