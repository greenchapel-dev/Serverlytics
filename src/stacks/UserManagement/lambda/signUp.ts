import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  SignUpRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);
  var cID = process.env.clientId;

  var paramsPW: SignUpRequest = {
    ClientId: cID!, /* required */
    Username: body.email,
    Password: body.password,
    UserAttributes: [
      {
        Name: 'given_name',
        Value: body.attributes.firstName,
      },
      {
        Name: 'family_name',
        Value: body.attributes.lastName,
      },
    ],
  };
  console.log('paramsPW', JSON.stringify(paramsPW));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    const signUp = await cognitoidentityserviceprovider.signUp(paramsPW).promise();
    console.log('signUp', signUp);
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

