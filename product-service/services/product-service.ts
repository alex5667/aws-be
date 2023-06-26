#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from './stack';

const app = new cdk.App();
new ProductServiceStack(app, 'ProductServiceStack', {
  env: { region: process.env.PRODUCT_AWS_REGION },
});