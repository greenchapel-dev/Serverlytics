// const AWS = require('aws-sdk');
import { Context, Callback } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import {
  GetUserRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });

  const action = process.env.action!;


  var paramsPW: GetUserRequest = {
    AccessToken: event.headers.Authorization,
  };
  console.log('paramsPW', JSON.stringify(paramsPW));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {

    // get User First
    const getUser = await cognitoidentityserviceprovider.getUser(paramsPW).promise();
    console.log('getUser.UserAttributes', getUser.UserAttributes);

    // find user actions
    let actions = getUser.UserAttributes.find((o: any) => o.Name === 'custom:userActions')?.Value;
    if (actions === undefined) {
      actions = '[]';
    }
    const userActions: string[] = JSON.parse(actions);
    console.log('userActions', userActions);

    if (userActions.includes(action)) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: `run ${action}`,
      };
    } else {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
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

