import * as cdk from "aws-cdk-lib";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

import * as path from "path";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nodeJsFunctionShared = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
        RDS_HOST: process.env.RDS_HOST!,
        RDS_PORT: process.env.RDS_PORT!,
        RDS_USER: process.env.RDS_USER!,
        RDS_PASSWORD: process.env.RDS_PASSWORD!,
        RDS_DATABASE: process.env.RDS_DATABASE!,
      },
      bundling: {
        externalModules: [
          "better-sqlite3",
          "mysql2",
          "mysql",
          "tedious",
          "sqlite3",
          "pg-query-stream",
          "oracledb",
        ],
      },
    };

    const getProductListFunction = new NodejsFunction(this, "GetProductListFunction", {
      ...nodeJsFunctionShared,
      entry: path.join(__dirname, "../handlers/getProductsList.ts"),
      functionName: "GetProductListFunction",
      handler: "getProductsList",
    });

    const getProductByIdFunction = new NodejsFunction(this, "GetProductByIdFunction", {
      ...nodeJsFunctionShared,
      entry: path.join(__dirname, "../handlers/getProductsById.ts"),
      functionName: "GetProductByIdFunction",
      handler: "getProductById",
    });

    const createProductFunction = new NodejsFunction(this, "CreateProductFunction", {
      ...nodeJsFunctionShared,
      entry: path.join(__dirname, "../handlers/createProduct.ts"),
      functionName: "CreateProductFunction",
      handler: "createProduct",
    });

    const httpApi = new apiGateway.HttpApi(this, "ProductsHttpApi", {
      apiName: "Products Http Api",
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });

    const getProductListIntegration = new HttpLambdaIntegration(
      "GetProductListIntegration",
      getProductListFunction
    );
    httpApi.addRoutes({
      path: "/products",
      methods: [apiGateway.HttpMethod.GET],
      integration: getProductListIntegration,
    });

    const getProductByIdIntegration = new HttpLambdaIntegration(
      "GetProductByIdIntegration",
      getProductByIdFunction
    );
    httpApi.addRoutes({
      path: "/products/{productId}",
      methods: [apiGateway.HttpMethod.GET],
      integration: getProductByIdIntegration,
    });

    const createProductIntegration = new HttpLambdaIntegration(
      "CreateProductIntegration",
      createProductFunction
    );
    httpApi.addRoutes({
      path: "/products",
      methods: [apiGateway.HttpMethod.POST],
      integration: createProductIntegration,
    });

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "CreateProductTopic",
    });

    const mainFilterPolicy = {
      count: sns.SubscriptionFilter.numericFilter({
        lessThanOrEqualTo: 10,
      }),
    };

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(process.env.EMAIL_ADDRESS!, {
        filterPolicy: mainFilterPolicy,
      })
    );

    const secondFilterPolicy = {
      count: sns.SubscriptionFilter.numericFilter({
        greaterThan: 10,
      }),
    };

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(
        process.env.ADDITIONAL_EMAIL_ADDRESS!,
        {
          filterPolicy: secondFilterPolicy,
        }
      )
    );

    const catalogBatchProcessFunction = new NodejsFunction(
      this,
      "CatalogBatchProcessFunction",
      {
        ...nodeJsFunctionShared,
        entry: path.join(__dirname, "../handlers/catalogBatchProcess.ts"),
        functionName: "CatalogBatchProcessFunction",
        handler: "catalogBatchProcessHandler",
        timeout: cdk.Duration.seconds(30),
        environment: {
          ...nodeJsFunctionShared.environment,
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

    createProductTopic.grantPublish(catalogBatchProcessFunction);

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "CatalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    catalogBatchProcessFunction.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );
  }
}