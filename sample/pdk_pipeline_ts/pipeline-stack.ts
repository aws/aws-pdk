import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { pdk_pipeline } from "aws-prototyping-sdk";

export class PipelineStack extends Stack {
  readonly pipeline: pdk_pipeline.PDKPipeline;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pipeline = new pdk_pipeline.PDKPipeline(this, "ApplicationPipeline", {
      primarySynthDirectory: "packages/infra/cdk.out",
      repositoryName: "monorepo",
      publishAssetsInParallel: false,
      prBuildChecker: true,
      crossAccountKeys: true,
      synth: {},
    });
  }
}