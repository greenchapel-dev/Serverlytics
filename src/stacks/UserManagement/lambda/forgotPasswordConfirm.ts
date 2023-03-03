import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  ConfirmForgotPasswordRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);
  var cID = process.env.clientId;

  var confirmForgotPwParams: ConfirmForgotPasswordRequest = {
    ClientId: cID!, /* required */
    Username: body.email,
    ConfirmationCode: body.code,
    Password: body.password,
  };
  console.log('paramsPW', JSON.stringify(confirmForgotPwParams));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    const confirmForgot = await cognitoidentityserviceprovider.confirmForgotPassword(confirmForgotPwParams).promise();
    console.log('confirmForgot', confirmForgot);
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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

