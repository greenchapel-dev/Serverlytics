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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    // 👇 User Pool
    const userPool = new cognito.UserPool(this, 'cognito-user-pool', {
      userPoolName: `${process.env.APP_NAME}user-management-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        userActions: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      lambdaTriggers: {
        preTokenGeneration: preTokenFn,
        postConfirmation: postConfirmationFn,
        customMessage: customMessageFn,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      email: cognito.UserPoolEmail.withSES({
        sesRegion: Stack.of(this).region,
        fromEmail: process.env.COGNITO_FROM_EMAIL!,
        fromName: process.env.COGNITO_FROM_NAME!,
        replyTo: process.env.COGNITO_EMAIL_REPLY_TO!,
        sesVerifiedDomain: process.env.DOMAIN!,
      }),
    });

    const userPoolCfn = userPool.node.defaultChild as CfnUserPool;
    userPoolCfn.userPoolAddOns = { advancedSecurityMode: 'ENFORCED' };


    // optionally update Email sender
    // const cfnUserPool = userPool.node.defaultChild as cognito.CfnUserPool;
    // cfnUserPool.emailConfiguration = {
    //   emailSendingAccount: 'DEVELOPER',
    //   replyToEmailAddress: 'YOUR_EMAIL@example.com',
    //   sourceArn: `arn:aws:ses:cognito-ses-region:${
    //     cdk.Stack.of(this).account
    //   }:identity/YOUR_EMAIL@example.com`,
    // };

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

    const clientReadAttributes = new cognito.ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['userActions']);

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
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      preventUserExistenceErrors: true,
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    });


    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'cognito-identity-pool', {
      identityPoolName: `${process.env.APP_NAME}-user-management-identity-pool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });


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

    const authenticatedRolePolicy = new RoleHelper(this, 'authenticatedRolePolicy', isUserCognitoGroupRole.roleArn);
    authenticatedRolePolicy.addBasicLambda();

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


    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
    this.userDataTable = userDataTable;
  }
}
