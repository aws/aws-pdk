/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { ApplicationStage } from './application-stage';
import { PipelineStack } from './pipeline-stack';

const app = PDKNag.app();

const pipelineStack = new PipelineStack(app, 'PipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});

const devStage = new ApplicationStage(app, 'Dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!, // Replace with Dev account
    region: process.env.CDK_DEFAULT_REGION!, // Replace with Dev region
  },
});

pipelineStack.pipeline.addStage(devStage);

// Add additional stages here i.e. Prod

pipelineStack.pipeline.buildPipeline(); // Needed for CDK Nag
app.synth();
