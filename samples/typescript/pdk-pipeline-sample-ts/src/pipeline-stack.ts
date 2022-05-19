import { PDKPipeline } from '@aws/aws-pdk-lib/aws-pdk-pipeline/lib/construct';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class PipelineStack extends Stack {
  readonly pipeline: PDKPipeline;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pipeline = new PDKPipeline(this, 'ApplicationPipeline', {
      primarySynthDirectory: 'packages/infra/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || 'monorepo',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      synth: {},
      sonarCodeScannerConfig: this.node.tryGetContext('sonarqubeScannerConfig'),
    });
  }
}