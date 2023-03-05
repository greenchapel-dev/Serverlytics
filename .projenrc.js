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

// add .env and diagram.dot to package ignore
project.addPackageIgnore('.env');
project.addPackageIgnore('diagram.dot');

// add a new task to create a new stack diagram
const addDia = project.addTask('dia', {
  description: 'create a new diagram',
  exec: 'npx cdk-dia',
});
project.projectBuild.postCompileTask.spawn(addDia);

// add a new task to deploy all stacks
project.addTask('deploy-all', {
  exec: 'cdk deploy --all',
});

//synthesize the project
project.synth();

