import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export class RoleHelper {
  importedRole: iam.IRole;

  constructor(stack: Stack,
    name: string,
    roleId: string) {
    // 👇 import existing IAM Role
    this.importedRole = iam.Role.fromRoleArn(stack,
      'imported-role-' + name,
      roleId,
      { mutable: false },
    );
  }


  addPolicy(policy: iam.PolicyStatement) {
    this.importedRole.addToPrincipalPolicy(policy);
  }
  addManagedPolicy(policy: iam.IManagedPolicy) {
    this.importedRole.addManagedPolicy(policy);
  }

  addBasicLambda() {
    const basicLambda = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    });
    this.addPolicy(basicLambda);
  }


}