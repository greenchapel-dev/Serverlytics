import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  ChangePasswordRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  let body = JSON.parse(event.body);

  var changePwParams: ChangePasswordRequest = {
    PreviousPassword: body.password,
    ProposedPassword: body.newPassword,
    AccessToken: event.headers.Authorization,
  };
  console.log('paramsPW', JSON.stringify(changePwParams));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {
    const changePW = await cognitoidentityserviceprovider.changePassword(changePwParams).promise();
    console.log('changePW', changePW);
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

