import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  ChangePasswordRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  // console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);

  // Validate the body
  if (!body.password || !body.newPassword) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Missing required fields',
    };
  }


  // create the params for the change password call
  var changePwParams: ChangePasswordRequest = {
    PreviousPassword: body.password,
    ProposedPassword: body.newPassword,
    AccessToken: event.headers.Authorization,
  };
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    // Try to change the password
    const changePW = await cognitoidentityserviceprovider.changePassword(changePwParams).promise();
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

