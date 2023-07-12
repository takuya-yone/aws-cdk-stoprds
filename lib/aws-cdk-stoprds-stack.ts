import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Stack, StackProps } from 'aws-cdk-lib';

import { ScopedAws } from 'aws-cdk-lib';

interface SubStackProps extends StackProps {
  stopRdsStateMachine: sfn.StateMachine;
}
export class AwsCdkStopRdsEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, props);
    const { accountId, region } = new ScopedAws(this);

    const eventbridge_rule = new events.Rule(this, 'RdsStartEvent', {
      targets: [new events_targets.SfnStateMachine(props.stopRdsStateMachine)],
      eventPattern: {
        source: ['aws.rds'],
        detailType: ['RDS DB Cluster Event'],
        detail: {
          EventID: [
            {
              'equals-ignore-case': 'RDS-EVENT-0151',
            },
          ],
        },
      },
    });
  }
}

export class AwsCdkStopRdsSfnStack extends cdk.Stack {
  public readonly stopRdsStateMachine: sfn.StateMachine;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { accountId, region } = new ScopedAws(this);

    const clusterNames: string[] = [
      'nextjs-docker-aurora',
      'portal-request-db-test-v2-cluster',
    ];
    const clusterArns: string[] = clusterNames.map(
      (x) => `arn:aws:rds:${region}:${accountId}:cluster:${x}`
    );

    const duration = cdk.Duration.minutes(5);
    const wait = new sfn.Wait(this, 'Wait 5min', {
      time: sfn.WaitTime.duration(duration),
    });

    const parallel = new sfn.Parallel(this, 'Stop Clusters');

    for (const [index, clusterName] of clusterNames.entries()) {
      const stoprds_task = new tasks.CallAwsService(
        this,
        `StopRdsTask_${index}`,
        {
          service: 'rds',
          action: 'stopDBCluster',
          parameters: {
            DbClusterIdentifier: clusterName,
          },
          iamResources: clusterArns,
          iamAction: 'rds:StopDBCluster',
        }
      );
      stoprds_task.addRetry({ maxAttempts: 4, backoffRate: 5 });

      parallel.branch(stoprds_task);
    }

    const stopRdsStateMachineLogGroup = new logs.LogGroup(
      this,
      'stopRdsStateMachineLogGroup',
      {
        retention: logs.RetentionDays.ONE_YEAR,
      }
    );

    this.stopRdsStateMachine = new sfn.StateMachine(
      this,
      'StopRdsStateMachine',
      {
        definitionBody: sfn.DefinitionBody.fromChainable(wait.next(parallel)),
        stateMachineName: 'StopRdsStateMachine',
        tracingEnabled: true,
        logs: {
          destination: stopRdsStateMachineLogGroup,
          level: sfn.LogLevel.ALL,
        },
      }
    );
  }
}
