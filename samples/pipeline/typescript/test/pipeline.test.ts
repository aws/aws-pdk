/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../src/pipeline-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'pipeline-test', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT!,
      region: process.env.CDK_DEFAULT_REGION!,
    },
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});