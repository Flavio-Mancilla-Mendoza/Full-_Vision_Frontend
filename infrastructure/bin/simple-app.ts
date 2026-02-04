#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SimpleStack } from "../lib/simple-stack";

const app = new cdk.App();

// Obtener configuración de entorno
const environment = app.node.tryGetContext("environment") || process.env.CDK_ENVIRONMENT || "dev";

console.log(`🚀 Deploying simple stack for environment: ${environment}`);

// Crear stack simple
new SimpleStack(app, `SimpleStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "sa-east-1",
  },
  environment,
  description: `Simple Stack for ${environment} environment`,
});

app.synth();
