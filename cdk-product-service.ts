import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";

import dotenv from "dotenv";

dotenv.config();

const app = new cdk.App();

const stack = new cdk.Stack(app, "ProductServiceStack", {
  env: { region: "eu-west-1" },
});

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION || "default-region",
    TABLENAME: process.env.TABLENAME || "default-table-name",
    STOCKTABLENAME: process.env.STOCKTABLENAME || "default-stock-table-name",
  },
};

const dynamoDBPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ["dynamodb:*"],
  resources: ["*"],
});

const getProductsListLambda = new NodejsFunction(
  stack,
  "getProductsListLambda",
  {
    ...sharedLambdaProps,
    functionName: "getProductsList",
    entry: "src/product-service/handlers/getProductsList.ts",
  }
);

getProductsListLambda.addToRolePolicy(dynamoDBPolicy);

const getProductsByIdLambda = new NodejsFunction(
  stack,
  "getProductsByIdLambda",
  {
    ...sharedLambdaProps,
    functionName: "getProductsById",
    entry: "src/product-service/handlers/getProductsById.ts",
  }
);

getProductsByIdLambda.addToRolePolicy(dynamoDBPolicy);

const createProductLambda = new NodejsFunction(stack, "createProductLambda", {
  ...sharedLambdaProps,
  functionName: "createProduct",
  entry: "src/product-service/handlers/createProduct.ts",
});

createProductLambda.addToRolePolicy(dynamoDBPolicy);

const addProductsToDatabaseLambda = new NodejsFunction(
  stack,
  "addProductsToDatabaseLambda",
  {
    ...sharedLambdaProps,
    functionName: "addProductsToDatabaseLambda",
    entry: "src/product-service/handlers/addProductsToDatabase.ts",
  }
);

addProductsToDatabaseLambda.addToRolePolicy(dynamoDBPolicy);

const api = new apiGateway.HttpApi(stack, "ProductApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
    allowOrigins: ["*"],
  },
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "getProductsListIntegration",
    getProductsListLambda
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "getProductsByIdIntegration",
    getProductsByIdLambda
  ),
  path: "/products/{productId}",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "createProductIntegration",
    createProductLambda
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.POST],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "addProductsToDatabaseIntegrationDb",
    addProductsToDatabaseLambda
  ),
  path: "/addproducts",
  methods: [apiGateway.HttpMethod.POST],
});
