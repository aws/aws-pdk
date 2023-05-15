# Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

"""
Lambda function code used to create a CodeBuild project which deploys the CDK pipeline stack for the branch.
"""
import logging
import os
import json

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

client = boto3.client("codebuild")
region = os.environ["AWS_REGION"]
codebuild_project = os.environ["CODEBUILD_PROJECT"]
main_branch = os.environ["MAIN_BRANCH"]


def handler(event, context):
    """Lambda function handler"""
    logger.info(event)

    reference_type = event["detail"]["referenceType"]

    try:
        if reference_type == "branch":
            branch = event["detail"]["referenceName"]
            repo_name = event["detail"]["repositoryName"]
            if branch == main_branch:
                logger.info(f"Skipping creation of {branch} branch")
                return

            res = client.start_build(
                projectName=codebuild_project,
                sourceVersion=f"refs/heads/{branch}",
                environmentVariablesOverride=[{"name": "BRANCH", "value": branch}],
            )
            logger.info(res["build"])
    except Exception as e:
        logger.error(e)
