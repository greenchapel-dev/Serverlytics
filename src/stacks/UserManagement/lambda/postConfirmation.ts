import { Context, Callback } from 'aws-lambda';
import * as AWS from 'aws-sdk';


export async function main( event: any, _context: Context, callback: Callback ) {
  AWS.config.update({ region: process.env.region });
  var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

  var params = {
    TableName: process.env.userTableName!,
    Item: {
      id: event.request.userAttributes.sub,
    },
  };

  try {
    console.log('params', params);
    const addUserToTable = await docClient.put(params).promise();
    console.log('addUserToTable', addUserToTable);
  } catch {
    console.error('Error Adding user to dynamo', event);
  }
  // Call DynamoDB to add the item to the table

  return event;

}

