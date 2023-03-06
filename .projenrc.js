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

  buildWorkflow: false,
  releaseWorkflow: false,
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


// Create our own build workflow
const prWorkflow = project.github.addWorkflow('build');
prWorkflow.on({
  push: {
    pull_request: {},
    workflow_dispatch: {},
  },
});
prWorkflow.addJobs({
  build: {
    runsOn: 'ubuntu-latest',
    permissions: { contents: 'write', contents: 'write' },
    steps: [
      {
        name: 'Checkout',
        uses: 'actions/checkout@v2',
        with: {
          ref: '${{ github.event.pull_request.head.ref }}',
          repository: '${{ github.event.pull_request.head.repo.full_name }}',
        },
      },
      {
        name: 'Install dependencies',
        run: 'yarn install --check-files --frozen-lockfile',
      },
      {
        name: 'Anti-tamper check',
        run: 'git diff --ignore-space-at-eol --exit-code',
      },
      {
        name: 'Set git identity',
        run: 'git config user.name "Automation"\ngit config user.email "github-actions@github.com"',
      },
      {
        name: 'build',
        run: 'npm run build',
      },
      // {
      //   name: 'Check for changes',
      //   id: 'git_diff',
      //   run: 'git diff --exit-code || echo "::set-output name=has_changes::true"',
      // },
      // {
      //   if: 'steps.git_diff.outputs.has_changes',
      //   name: 'Commit and push changes (if changed)',
      //   run: 'git add . && git commit -m "chore: self mutation" && git push origin HEAD:${{ github.event.pull_request.head.ref }}',
      // },
      // {
      //   if: 'steps.git_diff.outputs.has_changes',
      //   name: 'Update status check (if changed)',
      //   run: 'gh api -X POST /repos/${{ github.event.pull_request.head.repo.full_name}}/check-runs -F name="build" -F head_sha="$(git rev-parse HEAD)" -F status="completed" -F conclusion="success"',
      //   env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
      // },
    ],
    env: {
      CI: 'true',
      DOMAIN: '${{ secrets.DOMAIN }}',
      APP_NAME: '${{ secrets.APP_NAME }}',
      APP_NAME_SHORT: '${{ secrets.APP_NAME_SHORT }}',
      UM_API_KEY: '${{ secrets.UM_API_KEY }}',
      TOKEN_API_KEY: '${{ secrets.TOKEN_API_KEY }}',
      BASIC_APP_KEY: '${{ secrets.BASIC_APP_KEY }}',
      COGNITO_FROM_EMAIL: '${{ secrets.COGNITO_FROM_EMAIL }}',
      COGNITO_FROM_NAME: '${{ secrets.COGNITO_FROM_NAME }}',
      COGNITO_EMAIL_REPLY_TO: '${{ secrets.COGNITO_EMAIL_REPLY_TO }}',
      DELETE_USERS_ON_STACK_DESTROY: '${{ secrets.DELETE_USERS_ON_STACK_DESTROY }}',
    },
  },
});


//synthesize the project
project.synth();

