const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'Serverlytics',
  license: 'Apache-2.0',

  deps: [
    'cdk-custom-domain-lib',
    'cdk-api-gateway-helper-lib',
    'aws-lambda',
    'aws-sdk',
    'dotenv',
  ], /* Runtime dependencies of this module. */
  devDeps: [
    '@types/aws-lambda',
  ], /* Build dependencies for this module. */
  gitignore: [
    '.env',
  ], /* Exclude from git. */
});
project.synth();

project.tasks.addEnvironment('APP_NAME', 'Serverlytics');
