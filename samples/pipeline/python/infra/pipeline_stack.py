from aws_prototyping_sdk.pipeline import PDKPipeline, SonarCodeScannerConfig
from aws_cdk import Stack, pipelines
import json
import humps

class PipelineStack(Stack):
    def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)

        context = self.node.try_get_context("sonarqubeScannerConfig")
        repo_name = self.node.try_get_context("repositoryName")
        default_branch_name = self.node.try_get_context("defaultBranchName")
        sonar_config = None

        if repo_name is None:
            repo_name = "monorepo"
        
        if default_branch_name is None:
            default_branch_name = PDKPipeline.DEFAULT_BRANCH_NAME

        if context is not None:
            sonar_config = SonarCodeScannerConfig(**json.loads(json.dumps(humps.decamelize(context))))

        self.pipeline = PDKPipeline(self, "Pipeline",
                                                 primary_synth_directory="packages/infra/cdk.out",
                                                 repository_name=repo_name,
                                                 default_branch_name=default_branch_name,
                                                 publish_assets_in_parallel=False,
                                                 cross_account_keys=True,
                                                 sonar_code_scanner_config=sonar_config,
                                                 synth=pipelines.ShellStep("Unused", commands=[]))
