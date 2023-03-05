import * as cdk from 'aws-cdk-lib';
import {
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  Stack,
  Duration,
  aws_iam as iam,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
} from 'aws-cdk-lib';
import { CfnUserPool } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { RoleHelper } from '../../helpers/role-helper';

export class CognitoStack extends cdk.Stack {

  readonly userPoolId: string;
  readonly userPoolClientId: string;
  readonly userDataTable: dynamodb.Table;


  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // dynamo table that is used for storing non PII about a user
    const userDataTable = new dynamodb.Table(this, 'User-Data', {
      tableName: `${process.env.APP_NAME}-User-Data-Table`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create postConfirmation Lambda
    const postConfirmationFn = new lambdaNode.NodejsFunction(this, 'PostConfirmationHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/postConfirmation.ts',
      handler: 'main',
      timeout: Duration.seconds(5),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        userTableName: userDataTable.tableName,
      },
    });
    // give the postConfirmation lambda permissions to read and write to the table
    userDataTable.grantReadWriteData(postConfirmationFn);

    // Create PreToken Lambda
    const preTokenFn = new lambdaNode.NodejsFunction(this, 'PreTokenHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/preToken.ts',
      handler: 'main',
      timeout: Duration.seconds(5),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
      },
    });
    // give the pre token lambda permissions to read from the table
    userDataTable.grantReadData(preTokenFn);


    // Create PreToken Lambda
    const customMessageFn = new lambdaNode.NodejsFunction(this, 'CustomMessageHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/customMessage.ts',
      handler: 'main',
      timeout: Duration.seconds(5),
      bundling: {
        externalModules: [
        ],
        nodeModules: [
        ],
        minify: true,
      },
      environment: {
        region: Stack.of(this).region,
        COGNITO_FROM_NAME: process.env.COGNITO_FROM_NAME!,
      },
    });

    // User Pool
    const userPool = new cognito.UserPool(this, 'cognito-user-pool', {
      userPoolName: `${process.env.APP_NAME}user-management-user-pool`,
      selfSignUpEnabled: true, // allow users to sign up themselves
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: { // standard attributes that are required by cognito
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: { // custom attributes that are required by the app
        userActions: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: { // password policy
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      lambdaTriggers: { // lambda triggers for cognito
        preTokenGeneration: preTokenFn, // runs before a token is generated
        postConfirmation: postConfirmationFn, // runs after a user is confirmed
        customMessage: customMessageFn, // runs when any email is sent
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // retain the user pool on deletion
      email: cognito.UserPoolEmail.withSES({ // use custom email sender with SES verified Domain (this needs setting up prior to building)
        sesRegion: Stack.of(this).region,
        fromEmail: process.env.COGNITO_FROM_EMAIL!,
        fromName: process.env.COGNITO_FROM_NAME!,
        replyTo: process.env.COGNITO_EMAIL_REPLY_TO!,
        sesVerifiedDomain: process.env.DOMAIN!,
      }),
    });

    const userPoolCfn = userPool.node.defaultChild as CfnUserPool;
    userPoolCfn.userPoolAddOns = { advancedSecurityMode: 'ENFORCED' };


    // User Pool Client attributes
    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      // set all others as not needed attributes
      address: false,
      birthdate: false,
      gender: false,
      locale: false,
      middleName: false,
      fullname: false,
      nickname: false,
      phoneNumber: false,
      phoneNumberVerified: false,
      profilePicture: false,
      preferredUsername: false,
      profilePage: false,
      timezone: false,
      lastUpdateTime: false,
      website: false,
    };

    // update the attributes that are needed by the client that can be read
    const clientReadAttributes = new cognito.ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['userActions']);

    // update the attributes that are needed by the client that can be written
    const clientWriteAttributes = new cognito.ClientAttributes()
      .withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
      });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'user-pool-client', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO, // currently only supporting cognito IDP
        // TODO: add support for other IDPs
      ],
      preventUserExistenceErrors: true,
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    });


    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'cognito-identity-pool', {
      identityPoolName: `${process.env.APP_NAME}-user-management-identity-pool`,
      allowUnauthenticatedIdentities: false, // only allow authenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // Create a role for authenticated users
    const isUserCognitoGroupRole = new iam.Role(this, 'cognito-users-group-role', {
      description: 'Default role for authenticated user-management users',
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          'StringEquals': {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    // Create Policy for authenticated users
    const authenticatedRolePolicy = new RoleHelper(this, 'authenticatedRolePolicy', isUserCognitoGroupRole.roleArn);
    authenticatedRolePolicy.addBasicLambda(); // Add basic lambda permissions

    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      'user-management-identity-pool-role-attachment',
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: isUserCognitoGroupRole.roleArn,
          // unauthenticated: isAnonymousCognitoGroupRole.roleArn,
        },
        roleMappings: {
          mapping: {
            type: 'Token',
            ambiguousRoleResolution: 'AuthenticatedRole',
            identityProvider: `cognito-idp.${
              cdk.Stack.of(this).region
            }.amazonaws.com/${userPool.userPoolId}:${
              userPoolClient.userPoolClientId
            }`,
          },
        },
      },
    );

    // Set global variables for other stacks to use
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
    this.userDataTable = userDataTable;
  }
}
