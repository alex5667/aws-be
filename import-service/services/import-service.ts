import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as path from "path";

import { config as dotenvConfig } from "dotenv";

dotenvConfig();

class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceBucket",
      process.env.IMPORT_S3_BUCKET_NAME!
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    bucket.grantReadWrite(lambdaRole);

    const importProducts = new NodejsFunction(this, "importProducts", {
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.AWS_REGION!,
        IMPORT_S3_BUCKET_NAME: process.env.IMPORT_S3_BUCKET_NAME!,
      },
      entry: path.join(__dirname, "../handlers/importProducts.ts"),
      functionName: "importProducts",
      handler: "handler",
      role: lambdaRole,
    });

    const queue = sqs.Queue.fromQueueArn(
      this,
      "catalogItemsQueue",
      `arn:aws:sqs:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:catalogItemsQueue`
    );

    const importParser = new NodejsFunction(this, "importParser", {
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.AWS_REGION!,
        IMPORT_S3_BUCKET_NAME: process.env.IMPORT_S3_BUCKET_NAME!,
        QUEUE_URL: queue.queueUrl,
      },
      entry: path.join(__dirname, "../handlers/importParser.ts"),
      functionName: "importParser",
      handler: "handler",
      role: lambdaRole,
    });

    queue.grantSendMessages(importParser);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3_notifications.LambdaDestination(importParser),
      { prefix: "uploaded/" }
    );

    new logs.LogGroup(this, "importParserLogGroup", {
      logGroupName: `/aws/handlers/${importParser.functionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const httpApiGateway = new apiGateway.HttpApi(
      this,
      "ImportServiceHttpApiGateway",
      {
        apiName: "Import Service ApiGateway",
        corsPreflight: {
          allowHeaders: ["*"],
          allowOrigins: ["*"],
          allowMethods: [apiGateway.CorsHttpMethod.ANY],
        },
      }
    );

    const importProductsIntegration = new HttpLambdaIntegration(
      "importProductsIntegration",
      importProducts
    );
    httpApiGateway.addRoutes({
      path: "/import",
      methods: [apiGateway.HttpMethod.GET],
      integration: importProductsIntegration,
    });
  }
}

const app = new cdk.App();
new ProductServiceStack(app, "ProductServiceStack", {});
