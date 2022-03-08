import { Stack, StackProps } from 'aws-cdk-lib';
import { pdk_pipeline } from 'aws-prototyping-sdk';
import { Construct } from 'constructs';

export class PipelineStack extends Stack {
  readonly pipeline: pdk_pipeline.PDKPipeline;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pipeline = new pdk_pipeline.PDKPipeline(this, 'ApplicationPipeline', {
      primarySynthDirectory: 'packages/infra/cdk.out',
      repositoryName: 'monorepo',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      synth: {},
    });
  }
}