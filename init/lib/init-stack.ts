import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, 'healthTechVpc', {
      cidr: '10.0.0.0/16',
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

    });

    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSG', {
      vpc,
      description: 'Allow SSH access',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.ipv4(''), ec2.Port.tcp(22), 'Allow SSH'); //Ingress rule only for specific IP address

    const publicSubnets = vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC});

    const instance = new ec2.Instance(this, 'MyInstance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(), // Latest Amazon Linux 2023
      securityGroup: securityGroup,
       vpcSubnets: {
        subnets: publicSubnets.subnets,
      },
    });
  }
}
