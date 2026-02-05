import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface SimpleStackProps extends cdk.StackProps {
  environment: string;
}

export class SimpleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SimpleStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Stack placeholder - usar ApiGatewayStack para funcionalidad completa
    new cdk.CfnOutput(this, "Environment", {
      value: environment,
      description: "Deployment environment",
    });
  }
}
