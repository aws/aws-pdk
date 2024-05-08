#!/bin/bash

aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/p9i6h6j0
docker buildx build . -t aws-pdk --platform linux/amd64
docker tag aws-pdk:latest public.ecr.aws/p9i6h6j0/aws-pdk:latest
docker push public.ecr.aws/p9i6h6j0/aws-pdk:latest