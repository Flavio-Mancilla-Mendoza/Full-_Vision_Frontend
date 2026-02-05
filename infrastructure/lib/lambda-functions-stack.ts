import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export interface LambdaFunctionsStackProps extends cdk.StackProps {
  environment: string;
}

export class LambdaFunctionsStack extends cdk.Stack {
  public readonly appointmentsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionsStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // ================================================================
    // Environment Variables
    // ================================================================
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // ================================================================
    // Lambda: Appointments Handler
    // ================================================================
    this.appointmentsFunction = new lambda.Function(this, "AppointmentsFunction", {
      functionName: `full-vision-appointments-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/appointments")),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: environment,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: "Handles appointments and locations API endpoints",
    });

    // ================================================================
    // Outputs
    // ================================================================
    new cdk.CfnOutput(this, "AppointmentsFunctionArn", {
      value: this.appointmentsFunction.functionArn,
      description: "Appointments Lambda Function ARN",
      exportName: `AppointmentsFunctionArn-${environment}`,
    });

    new cdk.CfnOutput(this, "AppointmentsFunctionName", {
      value: this.appointmentsFunction.functionName,
      description: "Appointments Lambda Function Name",
    });
  }
}
