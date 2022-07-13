import os
from aws_cdk import App, Environment
from pipeline_stack import PipelineStack
from application_stage import ApplicationStage
from aws_prototyping_sdk.pdk_nag import PDKNag

app = PDKNag.app()

pipelineStack = PipelineStack(app, "PipelineStack", env=Environment(
    account=os.environ["CDK_DEFAULT_ACCOUNT"],
    region=os.environ["CDK_DEFAULT_REGION"]
))

devStage = ApplicationStage(app, "Dev", env=Environment(
    account=os.environ["CDK_DEFAULT_ACCOUNT"],
    region=os.environ["CDK_DEFAULT_REGION"]
))

pipelineStack.pipeline.add_stage(devStage)

# Add additional stages here i.e. Prod

pipelineStack.pipeline.build_pipeline()  # Needed for CDK Nag
app.synth()
