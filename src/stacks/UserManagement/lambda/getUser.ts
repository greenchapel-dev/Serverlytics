import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  GetUserRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  // console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });


  var paramsPW: GetUserRequest = {
    AccessToken: event.headers.Authorization,
  };
  // console.log('paramsPW', JSON.stringify(paramsPW));
  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {

    // get User from Cognito
    const getUser = await cognitoidentityserviceprovider.getUser(paramsPW).promise();

    // Get User from DynamoDB table
    const getItemParams = {
      TableName: process.env.userDataTableName!,
      Key: {
        id: getUser.Username,
      },
    };
    const getFromDB = await docClient.get(getItemParams).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        userId: getUser.Username,
        userAttributes: getUser.UserAttributes, //todo turn into objects
        additional: getFromDB,
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

