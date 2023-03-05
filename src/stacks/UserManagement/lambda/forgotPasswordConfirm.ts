import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  ConfirmForgotPasswordRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  // console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);
  var cID = process.env.clientId;

  // Validate the body
  if (!body.email || !body.code || !body.password) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing required fields',
    };
  }

  // create the params for the forgot password confirm call
  var confirmForgotPwParams: ConfirmForgotPasswordRequest = {
    ClientId: cID!, /* required */
    Username: body.email,
    ConfirmationCode: body.code,
    Password: body.password,
  };
  // console.log('paramsPW', JSON.stringify(confirmForgotPwParams));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    // try to run the forgot password confirm workflow
    const confirmForgot = await cognitoidentityserviceprovider.confirmForgotPassword(confirmForgotPwParams).promise();
    // console.log('confirmForgot', confirmForgot);
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

