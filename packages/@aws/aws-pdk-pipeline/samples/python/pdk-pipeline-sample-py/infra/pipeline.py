import os
from aws_cdk import App, Environment
from pipeline_stack import PipelineStack
from application_stage import ApplicationStage

app = App()

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

app.synth()
