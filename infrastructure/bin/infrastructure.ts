#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import * as path from "path";
import { ApiGatewayStack } from "../lib/api-gateway-stack";

// Cargar variables de entorno según el ambiente
const environment = process.env.CDK_ENVIRONMENT || "dev";
const envFile = path.resolve(__dirname, `../.env.${environment}`);

console.log(`🚀 Loading environment: ${environment}`);
console.log(`📄 Environment file: ${envFile}`);

// Intentar cargar archivo específico del ambiente
dotenv.config({ path: envFile });

// Fallback a .env de la raíz si no existe el archivo específico
if (!process.env.AWS_ACCOUNT) {
  console.log(`⚠️  No .env.${environment} found, trying root .env...`);
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

// Verificar variables críticas
if (!process.env.AWS_ACCOUNT || !process.env.AWS_REGION) {
  console.error("❌ Error: AWS_ACCOUNT and AWS_REGION must be set in environment variables");
  console.log("\n📝 Create a .env file with:");
  console.log("AWS_ACCOUNT=your-account-id");
  console.log("AWS_REGION=your-region");
  console.log("ENVIRONMENT=dev");
  process.exit(1);
}

const app = new cdk.App();

console.log(`🔧 Configuration for ${environment}:`);
console.log(`   Account: ${process.env.AWS_ACCOUNT}`);
console.log(`   Region: ${process.env.AWS_REGION}`);

// Simplemente deployamos el ApiGatewayStack que ya tiene todo integrado
// No necesitamos LambdaFunctionsStack por separado si solo vamos a actualizar API Gateway
const apiStack = new ApiGatewayStack(app, `ApiGatewayStack-${environment}`, {
  environment,
  // Los imports de UserPool se harán dentro del stack
  userPool: undefined as any, // Será importado dentro del stack
  userPoolClient: undefined as any, // Será importado dentro del stack
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
  description: `Full Vision Óptica - API Gateway Stack for ${environment} environment (Consolidated Lambda)`,
  tags: {
    Project: "Full Vision",
    Environment: environment,
    Owner: "Full Vision Team",
    CreatedBy: "AWS CDK",
  },
});

console.log(`✅ API Gateway stack created for ${environment} environment`);
console.log(`🌍 Target: Account ${process.env.AWS_ACCOUNT} in ${process.env.AWS_REGION}`);
