from aws_prototyping_sdk import pdk_pipeline
from aws_cdk import Stack, pipelines
import json
import humps

class PipelineStack(Stack):
    def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)

        context = self.node.try_get_context("sonarqubeScannerConfig")
        repo_name = self.node.try_get_context("repositoryName")
        sonar_config = None

        if repo_name is None:
            repo_name = "monorepo"

        if context is not None:
            sonar_config = pdk_pipeline.SonarCodeScannerConfig(**json.loads(json.dumps(humps.decamelize(context))))

        self.pipeline = pdk_pipeline.PDKPipeline(self, "Pipeline",
                                                 primary_synth_directory="packages/infra/cdk.out",
                                                 repository_name=repo_name,
                                                 publish_assets_in_parallel=False,
                                                 cross_account_keys=True,
                                                 sonar_code_scanner_config=sonar_config,
                                                 synth=pipelines.ShellStep("Unused", commands=[]))
