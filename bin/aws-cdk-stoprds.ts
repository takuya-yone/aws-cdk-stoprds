#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {
  AwsCdkStoprdsStack,
  AwsCdkStoprdsEventStack,
} from '../lib/aws-cdk-stoprds-stack';

import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
const sfnStack = new AwsCdkStoprdsStack(app, 'AwsCdkStopRdsStack');
const eventStack = new AwsCdkStoprdsEventStack(app, 'AwsCdkStoprdsEventStack', {
  stopRdsStateMachine: sfnStack.stopRdsStateMachine,
});

cdk.Tags.of(app).add('Project', 'StopRds');
// Aspects.of(app).add(new AwsSolutionsChecks());
