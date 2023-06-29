# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

### DB commands

* `npm run rds:create`  create tables
* `npm run rds:drop`    drop created tables
* `npm run rds:fill`    seed tables with json data from `./data/`

## Deplyment links

FE app repository: [https://github.com/Yana-Bashtyk/nodejs-aws-shop-react/](https://github.com/Yana-Bashtyk/nodejs-aws-shop-react/)
Cloudfront public link: [https://dh512t9i782ya.cloudfront.net/](https://dh512t9i782ya.cloudfront.net/)

API Gateway endpoints:

* https://870nyoxs79.execute-api.eu-west-1.amazonaws.com/products
* https://870nyoxs79.execute-api.eu-west-1.amazonaws.com/products/7567ec4b-b10c-48c5-9345-fc73c48a80aa

OpenAPI Docs: https://app.swaggerhub.com/apis-docs/YANKABASHTYK16/products_service/1.0.0
