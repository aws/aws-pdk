import os
from aws_cdk import App, Environment
from pipeline_stack import PipelineStack
from application_stage import ApplicationStage
from aws_prototyping_sdk.pdk_nag import PDKNag
from aws_prototyping_sdk.pipeline import PDKPipeline



app = PDKNag.app()

branch_prefix = PDKPipeline.get_branch_prefix(node=app.node)

pipelineStack = PipelineStack(app, branch_prefix + "PipelineStack", env=Environment(
    account=os.environ["CDK_DEFAULT_ACCOUNT"],
    region=os.environ["CDK_DEFAULT_REGION"]
))

devStage = ApplicationStage(app, branch_prefix + "Dev", env=Environment(
    account=os.environ["CDK_DEFAULT_ACCOUNT"],
    region=os.environ["CDK_DEFAULT_REGION"]
))

pipelineStack.pipeline.add_stage(devStage)

# Add additional stages here i.e. Prod
# if PDKPipeline.is_default_branch(node=app.node): ...

pipelineStack.pipeline.build_pipeline()  # Needed for CDK Nag
app.synth()
