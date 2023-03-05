import { Context, Callback } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as AWS from 'aws-sdk';
import {
  GetUserRequest,
  DeleteUserRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';


export async function main( event: any, _context: Context, callback: Callback ) {

  // console.log(event);
  // Set the region
  AWS.config.update({ region: process.env.region });
  var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });


  // create the params for Delete User
  var paramsPW: DeleteUserRequest | GetUserRequest = {
    AccessToken: event.headers.Authorization,
  };

  var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();

  try {

    // get User First
    const getUser = await cognitoidentityserviceprovider.getUser(paramsPW).promise();

    // Delete User from DynamoDB table
    const deleteItemParams = {
      TableName: process.env.userDataTableName!,
      Key: {
        id: getUser.Username,
      },
    };
    await docClient.delete(deleteItemParams).promise();

    // Delete User from Cognito
    const deleteUser = await cognitoidentityserviceprovider.deleteUser(paramsPW).promise();
    // console.log('deleteUser', deleteUser);
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

