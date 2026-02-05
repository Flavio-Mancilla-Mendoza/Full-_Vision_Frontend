import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export interface ApiGatewayStackProps extends cdk.StackProps {
  environment: string;
  userPool?: cognito.IUserPool;
  userPoolClient?: cognito.IUserPoolClient;
  adminUserManagementFunctionArn?: string;
}

/**
 * Stack para API Gateway de Full Vision Óptica
 * 
 * Este stack maneja TODOS los recursos del API Gateway incluyendo:
 * - 3 Lambdas originales (Public, Products, Uploads)
 * - 1 Lambda nuevo (Appointments)
 * - Todas las rutas del API
 * - Cognito Authorizer
 */
export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly supabasePublicFunction: lambda.Function;
  public readonly supabaseProductsFunction: lambda.Function;
  public readonly supabaseUploadsFunction: lambda.Function;
  public readonly appointmentsFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // ================================================================
    // Environment Variables
    // ================================================================
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // ================================================================
    // Import Cognito User Pool
    // ================================================================
    const userPoolId = process.env.COGNITO_USER_POOL_ID || "sa-east-1_A4YLB61FR";
    const userPool = cognito.UserPool.fromUserPoolId(this, "ImportedUserPool", userPoolId);

    // ================================================================
    // Lambda: Supabase Public (Public endpoints)
    // ================================================================
    this.supabasePublicFunction = new lambda.Function(this, "SupabasePublicFunction", {
      functionName: `full-vision-supabase-public-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/supabase-public")),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: environment,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        LOG_LEVEL: "debug",
        MERCADOPAGO_ACCESS_TOKEN: mercadoPagoToken,
        FRONTEND_URL: frontendUrl,
        API_GATEWAY_URL: "",
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: "Public endpoints for site content and public listings",
    });

    // ================================================================
    // Lambda: Supabase Products (Products CRUD)
    // ================================================================
    this.supabaseProductsFunction = new lambda.Function(this, "SupabaseProductsFunction", {
      functionName: `full-vision-supabase-products-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/supabase-products")),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: environment,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        LOG_LEVEL: "debug",
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: "Products CRUD operations",
    });

    // ================================================================
    // Lambda: Supabase Uploads (S3 presigned URLs)
    // ================================================================
    this.supabaseUploadsFunction = new lambda.Function(this, "SupabaseUploadsFunction", {
      functionName: `full-vision-supabase-uploads-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/supabase-uploads")),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: environment,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        S3_BUCKET: process.env.S3_BUCKET || "",
        S3_REGION: process.env.S3_REGION || "sa-east-1",
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: "S3 upload URL generation",
    });

    // ================================================================
    // Lambda: Appointments (NEW)
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
      description: "Appointments and locations management",
    });

    // ================================================================
    // API Gateway
    // ================================================================
    this.api = new apigateway.RestApi(this, "FullVisionAPI", {
      restApiName: `full-vision-api-${environment}`,
      description: `API Gateway para Full Vision - Cognito + Supabase`,
      deployOptions: {
        stageName: environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        allowCredentials: true,
      },
    });

    // ================================================================
    // Cognito Authorizer
    // ================================================================
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
        authorizerName: `full-vision-authorizer-${environment}`,
        identitySource: "method.request.header.Authorization",
      }
    );

    // ================================================================
    // Lambda Integrations
    // ================================================================
    const publicIntegration = new apigateway.LambdaIntegration(this.supabasePublicFunction, { proxy: true });
    const productsIntegration = new apigateway.LambdaIntegration(this.supabaseProductsFunction, { proxy: true });
    const uploadsIntegration = new apigateway.LambdaIntegration(this.supabaseUploadsFunction, { proxy: true });
    const appointmentsIntegration = new apigateway.LambdaIntegration(this.appointmentsFunction, { proxy: true });

    // Helper for authorized methods
    const authOptions = {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ================================================================
    // PUBLIC ROUTES (/public/*)
    // ================================================================
    const publicResource = this.api.root.addResource("public");

    // /public/products
    const publicProducts = publicResource.addResource("products");
    publicProducts.addMethod("GET", publicIntegration);

    // /public/bestsellers
    const publicBestsellers = publicResource.addResource("bestsellers");
    publicBestsellers.addMethod("GET", publicIntegration);

    // /public/liquidacion
    const publicLiquidacion = publicResource.addResource("liquidacion");
    publicLiquidacion.addMethod("GET", publicIntegration);

    // /public/brands
    const publicBrands = publicResource.addResource("brands");
    publicBrands.addMethod("GET", publicIntegration);
    const brandCheckExists = publicBrands.addResource("check-exists");
    brandCheckExists.addMethod("POST", publicIntegration);

    // /public/filters/{gender}
    const publicFilters = publicResource.addResource("filters");
    const publicFiltersByGender = publicFilters.addResource("{gender}");
    publicFiltersByGender.addMethod("GET", publicIntegration);

    // /public/products-by-gender/{gender}
    const publicProductsByGender = publicResource.addResource("products-by-gender");
    const publicProductsByGenderParam = publicProductsByGender.addResource("{gender}");
    publicProductsByGenderParam.addMethod("GET", publicIntegration);

    // /public/site-content
    const publicSiteContent = publicResource.addResource("site-content");
    publicSiteContent.addMethod("GET", publicIntegration);
    const publicSiteContentSection = publicSiteContent.addResource("{section}");
    publicSiteContentSection.addMethod("GET", publicIntegration);

    // /public/locations (NEW - for appointments)
    const publicLocations = publicResource.addResource("locations");
    publicLocations.addMethod("GET", appointmentsIntegration);

    // ================================================================
    // PRODUCTS ROUTES (/products/*)
    // ================================================================
    const productsResource = this.api.root.addResource("products");
    productsResource.addMethod("GET", productsIntegration, authOptions);
    productsResource.addMethod("POST", productsIntegration, authOptions);

    // /products/{id}
    const productById = productsResource.addResource("{id}");
    productById.addMethod("GET", productsIntegration, authOptions);
    productById.addMethod("PUT", productsIntegration, authOptions);
    productById.addMethod("DELETE", productsIntegration, authOptions);

    // /products/upload-url
    const uploadUrl = productsResource.addResource("upload-url");
    uploadUrl.addMethod("POST", uploadsIntegration, authOptions);

    // ================================================================
    // ORDERS ROUTES (/orders/*)
    // ================================================================
    const ordersResource = this.api.root.addResource("orders");
    ordersResource.addMethod("GET", productsIntegration, authOptions);
    ordersResource.addMethod("POST", productsIntegration, authOptions);

    // /orders/{id}
    const orderById = ordersResource.addResource("{id}");
    orderById.addMethod("GET", productsIntegration, authOptions);
    orderById.addMethod("PUT", productsIntegration, authOptions);

    // ================================================================
    // PROFILE ROUTE (/profile)
    // ================================================================
    const profileResource = this.api.root.addResource("profile");
    profileResource.addMethod("GET", productsIntegration, authOptions);
    profileResource.addMethod("PUT", productsIntegration, authOptions);

    // ================================================================
    // BRANDS ROUTES (/brands)
    // ================================================================
    const brandsResource = this.api.root.addResource("brands");
    brandsResource.addMethod("GET", productsIntegration, authOptions);
    brandsResource.addMethod("POST", productsIntegration, authOptions);

    // ================================================================
    // MERCADOPAGO ROUTES (/mercadopago/*)
    // ================================================================
    const mercadoPagoResource = this.api.root.addResource("mercadopago");
    const mercadoPagoAction = mercadoPagoResource.addResource("{action}");
    mercadoPagoAction.addMethod("POST", publicIntegration);

    // ================================================================
    // LOCATIONS ROUTES (/locations/*) - NEW
    // ================================================================
    const locationsResource = this.api.root.addResource("locations");
    locationsResource.addMethod("GET", appointmentsIntegration, authOptions);
    locationsResource.addMethod("POST", appointmentsIntegration, authOptions);

    // /locations/{id}
    const locationById = locationsResource.addResource("{locationId}");
    locationById.addMethod("GET", appointmentsIntegration, authOptions);
    locationById.addMethod("PUT", appointmentsIntegration, authOptions);
    locationById.addMethod("DELETE", appointmentsIntegration, authOptions);

    // ================================================================
    // APPOINTMENTS ROUTES (/appointments/*) - NEW
    // ================================================================
    const appointmentsResource = this.api.root.addResource("appointments");
    appointmentsResource.addMethod("GET", appointmentsIntegration, authOptions);
    appointmentsResource.addMethod("POST", appointmentsIntegration, authOptions);

    // /appointments/user
    const userAppointments = appointmentsResource.addResource("user");
    userAppointments.addMethod("GET", appointmentsIntegration, authOptions);

    // /appointments/{id}
    const appointmentById = appointmentsResource.addResource("{appointmentId}");
    appointmentById.addMethod("GET", appointmentsIntegration, authOptions);
    appointmentById.addMethod("PUT", appointmentsIntegration, authOptions);

    // ================================================================
    // Outputs
    // ================================================================
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      description: "API Gateway URL",
      exportName: `FullVision-${environment}-API-URL`,
    });

    new cdk.CfnOutput(this, "ApiId", {
      value: this.api.restApiId,
      description: "API Gateway ID",
      exportName: `FullVision-${environment}-API-ID`,
    });

    new cdk.CfnOutput(this, "SupabasePublicFunctionArn", {
      value: this.supabasePublicFunction.functionArn,
      description: "Supabase Public Lambda ARN",
      exportName: `FullVision-${environment}-SupabasePublic-ARN`,
    });

    new cdk.CfnOutput(this, "SupabaseProductsFunctionArn", {
      value: this.supabaseProductsFunction.functionArn,
      description: "Supabase Products Lambda ARN",
      exportName: `FullVision-${environment}-SupabaseProducts-ARN`,
    });

    new cdk.CfnOutput(this, "SupabaseUploadsFunctionArn", {
      value: this.supabaseUploadsFunction.functionArn,
      description: "Supabase Uploads Lambda ARN",
      exportName: `FullVision-${environment}-SupabaseUploads-ARN`,
    });

    new cdk.CfnOutput(this, "AppointmentsFunctionArn", {
      value: this.appointmentsFunction.functionArn,
      description: "Appointments Lambda ARN",
      exportName: `FullVision-${environment}-Appointments-ARN`,
    });
  }
}
