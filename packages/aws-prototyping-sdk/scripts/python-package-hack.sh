#!/bin/bash

# This is need until https://github.com/aws/jsii/issues/3408 is resolved
cd dist/python
FILE=`ls *.whl`
mkdir .tmp
cd .tmp
unzip ../$FILE
cd aws_prototyping_sdk
awk '{sub("from . import pdk_projen","")}1' __init__.py > temp.txt && mv temp.txt __init__.py
cd ..
zip -r $FILE *
cd ..
rm $FILE
mv .tmp/$FILE $FILE
rm -rf .tmp