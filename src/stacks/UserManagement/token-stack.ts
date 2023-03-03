import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  Stack,
  Duration,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { ApiGatewayHelper } from 'cdk-api-gateway-helper-lib';
import { ApiGatewayCustomDomain } from 'cdk-custom-domain-lib';
import { Construct } from 'constructs';

export interface TokenStackProps extends cdk.StackProps {
  userPoolClientId: string;
  userPoolId: string;
}


export class TokenStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TokenStackProps) {
    super(scope, id, props);


    const domainNamePart = 'auth';

    const gatewayHelper = new ApiGatewayHelper(this, 'AUTH-Endpoint');

    /// GetToken ///
    // Create Lambda
    const getTokenFn = new lambdaNode.NodejsFunction(this, 'AUTH-GetTokenHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/getToken.ts',
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
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'get-token',
      methodType: 'POST',
      lambdaFunction: getTokenFn,
      useAuthorizer: false,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    /// RefreshToken ///
    // Create Lambda
    const refreshTokenFn = new lambdaNode.NodejsFunction(this, 'AUTH-RefreshTokenHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/UserManagement/lambda/refreshToken.ts',
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
        clientId: props?.userPoolClientId!,
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'refresh-token',
      methodType: 'GET',
      lambdaFunction: refreshTokenFn,
      useAuthorizer: false,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });


    const cognitoPoolARN = `arn:aws:cognito-idp:${Stack.of(this).region}:${Stack.of(this).account}:userpool/${props?.userPoolId!}`;
    // 👇 create a policy statement
    const initAuthPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:InitiateAuth'],
      resources: [cognitoPoolARN],
    });


    getTokenFn.role?.attachInlinePolicy(new iam.Policy(this, 'AUTH-InitAuth-Policy-getToken', {
      statements: [initAuthPolicy],
    }));
    refreshTokenFn.role?.attachInlinePolicy(new iam.Policy(this, 'AUTH-InitAuth-Policy-refreshToken', {
      statements: [initAuthPolicy],
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
    const tokenApiKey = process.env.TOKEN_API_KEY;
    if (tokenApiKey === undefined) {
      throw new Error(( 'TOKEN_API_KEY undefined'));
    }
    const apiKey = new apigw.ApiKey(this, 'TokenApiKey', {
      apiKeyName: `${(process.env.APP_NAME)?.toUpperCase()}_TOKEN_API_KEY`,
      value: tokenApiKey,
    });
    this.exportValue(apiKey.keyId, {
      name: `${process.env.APP_NAME}TokenApiKey`,
    });


    // add the throttle per method
    gatewayHelper.addUsagePlan('AUTH-UsagePlan', defaultPlan, undefined, { key: apiKey, overrideLogicalId: 'webappserverkey' });

    // Add default error handling for auth failure
    gatewayHelper.addDefaultAuthErrorResponse('AUTH-response');

    // Add to custom domain
    new ApiGatewayCustomDomain(this, gatewayHelper.returnGateway(), process.env.DOMAIN!, domainNamePart);

  }
}
