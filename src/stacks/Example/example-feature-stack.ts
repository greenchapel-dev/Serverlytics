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

export interface ExampleFeaturesProps extends cdk.StackProps {
  userPoolClientId: string;
  userPoolId: string;
  userDataTable: dynamodb.Table;
}

export class ExampleFeaturesCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ExampleFeaturesProps) {
    super(scope, id, props);


    const domainNamePart = 'example';

    //get dynamo db table so we can delete the user entry
    // const userDynamoTable = dynamodb.Table.fromTableArn(this, 'UM-ImportUserTable', props?.userDataTable.tableArn!);


    const gatewayHelper = new ApiGatewayHelper(this, 'EX-Endpoint');

    // Feature A
    const featureAfn = new lambdaNode.NodejsFunction(this, 'EX-FeatureA', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/Example/lambda/feature.ts',
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
        action: 'feature:a',
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'feature-a',
      methodType: 'GET',
      lambdaFunction: featureAfn,
      useAuthorizer: true,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });
    // Feature B
    const featureBfn = new lambdaNode.NodejsFunction(this, 'EX-FeatureB', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: 'src/stacks/Example/lambda/feature.ts',
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
        action: 'feature:b',
      },
    });
    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'feature-b',
      methodType: 'GET',
      lambdaFunction: featureBfn,
      useAuthorizer: true,
      useApiKey: true,
      userPoolID: props?.userPoolId!,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });


    const cognitoPoolARN = `arn:aws:cognito-idp:${Stack.of(this).region}:${Stack.of(this).account}:userpool/${props?.userPoolId!}`;
    // 👇 create a policy statement

    const getUserPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:GetUser'],
      resources: [cognitoPoolARN],
    });

    // attach policy to functions
    featureAfn.role?.attachInlinePolicy(new iam.Policy(this, 'EX-featureA-Policy', {
      statements: [getUserPolicy],
    }));
    featureBfn.role?.attachInlinePolicy(new iam.Policy(this, 'EX-featureB-Policy', {
      statements: [getUserPolicy],
    }));


    // Add the default plan
    const defaultPlan: apigw.UsagePlanProps = {
      name: 'EX-HandlerPlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    };


    //create Basic APP key
    const basicApiKey = process.env.BASIC_APP_KEY;
    if (basicApiKey === undefined) {
      throw new Error(( 'BASIC_APP_KEY undefined'));
    }
    const apiKey = new apigw.ApiKey(this, 'EXApiKey', {
      apiKeyName: `${(process.env.APP_NAME)?.toUpperCase()}_BASIC_APP_KEY`,
      value: basicApiKey,
    });
    this.exportValue(apiKey.keyId, {
      name: `${process.env.APP_NAME}BasicAppKey`,
    });


    // add the throttle per method
    gatewayHelper.addUsagePlan('EX-UsagePlan', defaultPlan, undefined, { key: apiKey, overrideLogicalId: 'webappserverkey' });

    // Add default error handling for auth failure
    gatewayHelper.addDefaultAuthErrorResponse('EX-response');

    // Create custom domain
    new ApiGatewayCustomDomain(this, gatewayHelper.returnGateway(), process.env.DOMAIN!, domainNamePart);

  }
}
