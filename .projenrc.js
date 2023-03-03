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
    'cdk-dia',
  ], /* Build dependencies for this module. */
  gitignore: [
    '.env',
    'diagram.dot',
  ], /* Exclude from git. */
});

const addDia = project.addTask('dia', {
  description: 'create a new diagram',
  exec: 'npx cdk-dia',
});

project.projectBuild.postCompileTask.spawn(addDia);

project.synth();

