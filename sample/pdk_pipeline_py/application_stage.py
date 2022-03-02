from aws_cdk import Stage

from application_stack import ApplicationStack

class ApplicationStage(Stage):
    def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)

        ApplicationStack(self, 'MyApplication')
