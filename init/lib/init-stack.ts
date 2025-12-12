import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';

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
      //Security Group for the Public Subnet(s) to allow SSH and to allow HTTP inbound traffic though ports 22 and 80 respectively
    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSG', {
      vpc,
      description: 'Allow SSH access',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(22), 'Allow SSH'); //Ingress rule only for specific IP address
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP inbound traffic"); //Ingress rule to allow HTTP access from the internet.


        // IAM Role for EC2 Instance
    const ec2Role = new iam.Role(this, 'EC2IAMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    ec2Role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    
    const publicSubnetsIDs = vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC});  //Variable to hold the publicSubnet IDs
      
        //Creating the EC2 instances within the public subnet(s)
    const instance = new ec2.Instance(this, 'MyInstance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(), // Latest Amazon Linux 2023
      securityGroup: securityGroup, // With the ingress rules above, these ec2 instances can be SSH'ed into via any instance in the VPC, and anyone can send an HTTP request to these instances
       vpcSubnets: {
        subnets: publicSubnetsIDs.subnets, //calls the IDs of each subnet in each AZ and says (put an ec2 in these subnets)
      },
      role: ec2Role
    });

        // Security Group for RDS (Allows traffic from EC2)
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for RDS instance',
    });
    rdsSecurityGroup.addIngressRule(securityGroup, ec2.Port.tcp(3306), 'Allow MySQL from EC2');
      
      //RDS Database in each private subnet
    const database = new rds.DatabaseInstance(this, 'MigrationRDS', {
      engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_8_0}),
      instanceType: new ec2.InstanceType('t3.micro'),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        onePerAz: true, // Selects one private subnet per AZ
      },
      multiAz: true, //Multi-AZ for high availability if more than 1 AZ created
      securityGroups: [rdsSecurityGroup],
      allocatedStorage: 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: Deletes DB on stack removal
    });
  }
}
