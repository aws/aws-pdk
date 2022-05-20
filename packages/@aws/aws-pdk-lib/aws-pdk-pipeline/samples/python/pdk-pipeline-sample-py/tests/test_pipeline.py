import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from infra.pipeline_stack import PipelineStack

@pytest.fixture(scope='module')
def template():
  app = App()
  stack = PipelineStack(app, "pipeline-stack-test")
  template = Template.from_stack(stack)
  yield template

def test_pipeline_found(template):
  template.resource_count_is("AWS::CodePipeline::Pipeline", 1)
