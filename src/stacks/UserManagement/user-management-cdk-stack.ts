import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  Stack,
  Duration,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
} from 'aws-cdk-lib';
import { ApiGatewayHelper } from 'cdk-api-gateway-helper-lib';
import { ApiGatewayCustomDomain } from 'cdk-custom-domain-lib';
import { Construct } from 'constructs';

export interface UserManagementCdkProps extends cdk.StackProps {
  userPoolClientId: string;
  userPoolId: string;
  userDataTable: dynamodb.Table;
}

export class UserManagementCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: UserManagementCdkProps) {
    super(scope, id, props);


    const domainNamePart = 'um'; // domain name part is a subdomain of the domain name eg. um.serverlytics.dev

    //get dynamo db table so we can delete the user entry
    const userDynamoTable = dynamodb.Table.fromTableArn(this, 'UM-ImportUserTable', props?.userDataTable.tableArn!);


    const gatewayHelper = new ApiGatewayHelper(this, 'UM-Endpoint'); // create the gateway helper

    // Sign Up
    const signUpFn = new lambdaNode.NodejsFunction(this, 'UM-SignUpHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/signUp.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'sign-up',
      methodType: 'POST',
      lambdaFunction: signUpFn,
      useAuthorizer: false,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    // Confirm Sign Up
    const confirmSignUpFn = new lambdaNode.NodejsFunction(this, 'UM-ConfirmSignUpHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/confirmSignUp.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'confirm-sign-up',
      methodType: 'POST',
      lambdaFunction: confirmSignUpFn,
      useAuthorizer: false,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    // Delete User
    const deleteUserFn = new lambdaNode.NodejsFunction(this, 'UM-DeleteUserHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/deleteUser.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
        userDataTableName: userDynamoTable.tableName,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'delete-user',
      methodType: 'DELETE',
      lambdaFunction: deleteUserFn,
      useAuthorizer: true,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });
    userDynamoTable.grantReadWriteData(deleteUserFn);


    // Get User
    const getUserFn = new lambdaNode.NodejsFunction(this, 'UM-GetUserHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/getUser.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
        userDataTableName: userDynamoTable.tableName,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'get-user',
      methodType: 'GET',
      lambdaFunction: getUserFn,
      useAuthorizer: true,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });
    userDynamoTable.grantReadData(getUserFn);


    // Forgot Password
    const forgotPasswordFn = new lambdaNode.NodejsFunction(this, 'UM-ForgotPasswordHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/forgotPassword.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'forgot-password',
      methodType: 'POST',
      lambdaFunction: forgotPasswordFn,
      useAuthorizer: false,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });


    // Forgot Password Confirm
    const forgotPasswordConfirmFn = new lambdaNode.NodejsFunction(this, 'UM-ForgotPasswordConfirmHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/forgotPasswordConfirm.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'confirm-forgot-password',
      methodType: 'POST',
      lambdaFunction: forgotPasswordConfirmFn,
      useAuthorizer: false,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });


    // Change Password
    const changePasswordFn = new lambdaNode.NodejsFunction(this, 'UM-ChangePasswordHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/changePassword.ts',
      handler: 'main',
      timeout: Duration.seconds(6),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'change-password',
      methodType: 'POST',
      lambdaFunction: changePasswordFn,
      useAuthorizer: true,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });


    const cognitoPoolARN = `arn:aws:cognito-idp:${Stack.of(this).region}:${Stack.of(this).account}:userpool/${props?.userPoolId!}`;
    // create the policy statements
    const signUpPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:SignUp'],
      resources: [cognitoPoolARN],
    });
    const userConfirmPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:ConfirmSignUp'],
      resources: [cognitoPoolARN],
    });
    const deleteUserPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:DeleteUser'],
      resources: [cognitoPoolARN],
    });
    const getUserPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:GetUser'],
      resources: [cognitoPoolARN],
    });
    const forgotPasswordPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:ForgotPassword'],
      resources: [cognitoPoolARN],
    });
    const forgotPasswordConfirmPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:ConfirmForgotPassword'],
      resources: [cognitoPoolARN],
    });
    const changePasswordPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:ChangePassword'],
      resources: [cognitoPoolARN],
    });

    // attach policy to functions
    signUpFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-signUp-Policy-signUp', {
      statements: [signUpPolicy],
    }));
    confirmSignUpFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-confirmSignUp-Policy-confirmSignUp', {
      statements: [userConfirmPolicy],
    }));
    deleteUserFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-deleteUser-Policy-get-deleteUser', {
      statements: [deleteUserPolicy, getUserPolicy],
    }));
    getUserFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-getUser-Policy-getUser', {
      statements: [getUserPolicy],
    }));
    forgotPasswordFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-forgotPassword-Policy-forgotPassword', {
      statements: [forgotPasswordPolicy],
    }));
    forgotPasswordConfirmFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-forgotPasswordConfirm-Policy-forgotPasswordConfirm', {
      statements: [forgotPasswordConfirmPolicy],
    }));
    changePasswordFn.role?.attachInlinePolicy(new iam.Policy(this, 'UM-changePassword-Policy-changePassword', {
      statements: [changePasswordPolicy],
    }));


    // Add the default plan
    const defaultPlan: apigw.UsagePlanProps = {
      name: 'UM-HandlerPlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    };


    //create UM api key
    const umApiKey = process.env.UM_API_KEY;
    if (umApiKey === undefined) {
      throw new Error(( 'UM_API_KEY undefined'));
    }
    const apiKey = new apigw.ApiKey(this, 'UMApiKey', {
      apiKeyName: `${(process.env.APP_NAME)?.toUpperCase()}_UM_API_KEY`,
      value: umApiKey,
    });
    this.exportValue(apiKey.keyId, {
      name: `${process.env.APP_NAME}UmApiKey`,
    });


    // add the throttle per method and add the api key
    gatewayHelper.addUsagePlan('AUTH-UsagePlan', defaultPlan, undefined, { key: apiKey, overrideLogicalId: 'webappserverkey' });

    // Add default error handling for auth failure
    gatewayHelper.addDefaultAuthErrorResponse('AUTH-response');

    // Create custom domain
    new ApiGatewayCustomDomain(this, gatewayHelper.returnGateway(), process.env.DOMAIN!, domainNamePart);

  }
}
