import { App } from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { ExampleFeaturesCdkStack } from './stacks/Example/example-feature-stack';
import { CognitoStack } from './stacks/UserManagement/cognito-stack';
import { TokenStack } from './stacks/UserManagement/token-stack';
import { UserManagementCdkStack } from './stacks/UserManagement/user-management-cdk-stack';
dotenv.config();

const stackEnvironments = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();


// USER MANAGEMENT STACKS
// Cognito Stack
const cognitoStack = new CognitoStack(app, `${process.env.APP_NAME_SHORT}-CognitoStack`, {
  env: stackEnvironments,
});

// Main User Management Stack
const umStack = new UserManagementCdkStack(app, `${process.env.APP_NAME_SHORT}-UserManagementStack`, {
  env: stackEnvironments,
  userPoolClientId: cognitoStack.userPoolClientId,
  userPoolId: cognitoStack.userPoolId,
  userDataTable: cognitoStack.userDataTable,
});
umStack.addDependency(cognitoStack);

const tokenStack = new TokenStack(app, `${process.env.APP_NAME_SHORT}-TokenCdkStack`, {
  env: stackEnvironments,
  userPoolClientId: cognitoStack.userPoolClientId,
  userPoolId: cognitoStack.userPoolId,
});
tokenStack.addDependency(cognitoStack);


// Example stack using the UM
const exampleStack = new ExampleFeaturesCdkStack(app, `${process.env.APP_NAME_SHORT}-ExampleFeaturesCdkStack`, {
  env: stackEnvironments,
  userPoolClientId: cognitoStack.userPoolClientId,
  userPoolId: cognitoStack.userPoolId,
  userDataTable: cognitoStack.userDataTable,
});
exampleStack.addDependency(cognitoStack);

app.synth();