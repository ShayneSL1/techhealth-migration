import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from '@aws-cdk/aws-ec2'
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, 'healthTechVpc', {
      maxAzs: 2,
      subnetConfiguration: [{
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24
      },
      {
        name: 'Private',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 24
      }],

    })
    // example resource
    // const queue = new sqs.Queue(this, 'InitQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
