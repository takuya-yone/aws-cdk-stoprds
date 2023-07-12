import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {
  AwsCdkStopRdsSfnStack,
  AwsCdkStopRdsEventStack,
} from '../lib/aws-cdk-stoprds-stack';
import { Template } from 'aws-cdk-lib/assertions';

test('Unit Test', () => {
  const app = new cdk.App();
  const sfnStack = new AwsCdkStopRdsSfnStack(app, 'AwsCdkStopRdsSfnStack');
  const eventStack = new AwsCdkStopRdsEventStack(
    app,
    'AwsCdkStopRdsEventStack',
    {
      stopRdsStateMachine: sfnStack.stopRdsStateMachine,
    }
  );

  const template = Template.fromStack(sfnStack);
  expect(template.toJSON()).toMatchSnapshot();

  // template.hasResourceProperties("AWS::Lambda::Function", {
  //   Runtime: "nodejs18.x",
  // });
});
