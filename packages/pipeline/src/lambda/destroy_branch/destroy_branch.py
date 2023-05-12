# Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import logging
import os

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cfn = boto3.client("cloudformation")
tags = boto3.client("resourcegroupstaggingapi")
region = os.environ["AWS_REGION"]
repo_name = os.environ["REPO_NAME"]
main_branch = os.environ["MAIN_BRANCH"]


def handler(event, context):
    logger.info(event)
    reference_type = event["detail"]["referenceType"]

    try:
        if reference_type == "branch":
            branch = event["detail"]["referenceName"]
            if branch == main_branch:
                logger.info("Main branch cannot be deleted")
                return

            stack_page = tags.get_paginator("get_resources").paginate(
                TagFilters=[
                    {"Key": "FeatureBranch", "Values": [branch]},
                    {"Key": "RepoName", "Values": [repo_name]},
                ],
                ResourceTypeFilters=["cloudformation:stack"],
            )
            for page in stack_page:
                stacks = page["ResourceTagMappingList"]
                for stack in stacks:
                    logger.info(f"Deleting stack {stack['ResourceARN']}")
                    cfn.delete_stack(StackName=stack["ResourceARN"])

    except Exception as e:
        logger.error(e)
