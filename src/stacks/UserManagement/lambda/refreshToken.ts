import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  InitiateAuthRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {
  console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  var cID = process.env.clientId;

  const token = event.headers!.Authorization!;

  var paramsPW: InitiateAuthRequest = {
    AuthFlow: 'REFRESH_TOKEN_AUTH', /* required */
    ClientId: cID!, /* required */
    AuthParameters: {
      REFRESH_TOKEN: token,
    },
  };
  console.log('paramsPW', JSON.stringify(paramsPW));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    const auth = await cognitoidentityserviceprovider.initiateAuth(paramsPW).promise();
    console.log('auth.AuthenticationResult', auth.AuthenticationResult);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        token: auth.AuthenticationResult,
      }),
    };

  } catch (err) {
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

