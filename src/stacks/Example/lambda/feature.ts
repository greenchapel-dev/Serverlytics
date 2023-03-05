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

  // get the action name needed when created
  const action = process.env.action!;


  // create the params for Get User
  var getUserParams: GetUserRequest = {
    AccessToken: event.headers.Authorization,
  };
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {

    // get User First
    const getUser = await cognitoidentityserviceprovider.getUser(getUserParams).promise();
    // console.log('getUser.UserAttributes', getUser.UserAttributes);

    // find user actions
    let actions = getUser.UserAttributes.find((o: any) => o.Name === 'custom:userActions')?.Value;
    if (actions === undefined) {
      // if no actions, set to empty array
      actions = '[]';
    }
    // parse the actions into json string array
    const userActions: string[] = JSON.parse(actions);
    // console.log('userActions', userActions);

    // if the action matches the action set for this api, return 200
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
      // return forbidden 403
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
  } catch (err) {
    // if error, return 400
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

