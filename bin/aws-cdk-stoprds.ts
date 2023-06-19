#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkStoprdsStack } from '../lib/aws-cdk-stoprds-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
new AwsCdkStoprdsStack(app, 'AwsCdkStoprdsStack', {
});

Aspects.of(app).add(new AwsSolutionsChecks());
