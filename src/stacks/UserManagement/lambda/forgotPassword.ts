import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  ForgotPasswordRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  // console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);
  var cID = process.env.clientId;

  // Validate the body
  if (!body.email) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing required fields',
    };
  }

  // create the params for the forgot password call
  var forgotPwParams: ForgotPasswordRequest = {
    ClientId: cID!, /* required */
    Username: body.email,
  };
  // console.log('paramsPW', JSON.stringify(forgotPwParams));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    // Try to run the forgot the password workflow
    const forgot = await cognitoidentityserviceprovider.forgotPassword(forgotPwParams).promise();
    // console.log('forgot', forgot);
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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

