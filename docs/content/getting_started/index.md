# Getting started

This topic introduces you to important AWS PDK concepts and describes how to install and configure the AWS PDK. When you're done, you'll be ready to [create your first AWS PDK project](your_first_aws_pdk_project.md).

## Background

The AWS PDK lets you define your project strcuture as code in one of its supported programming languages. At its core, the AWS PDK is built on [Projen](https://github.com/projen/projen) and is a piece of software you should become familiar with if you want to become proficient with the PDK. In addition, alot of the constructs provided by the PDK generate CDK code which is used to deploy relevant infrastructure. The following expandable sections provide a quick primer on how these two key pieces of technology work.

??? "CDK Primer"
    
    AWS Construct Development Kit (AWS CDK) allows you to model AWS infrastructure as code (IaC) in a variety of supported languages. By allowing you to define Infastructure programatically, you can create higher level abstractions which can be re-used in a variety of applications. The deployment mechanism used at AWS is Cloudformation and as such all CDK code 'synthesizes' into Cloudformation. You can think of this like code that compiles to some native format (i.e: Java -> ByteCode).

    To ground this in an example, let's create an S3 Bucket using the CDK:

    === "TS"

        ```ts
        const bucket = new s3.Bucket(this, 'MyBucket', {
            bucketName: 'my-bucket',
            versioned: true,
            websiteRedirect: {hostName: 'aws.amazon.com'}});
        ```

    === "PYTHON"

        ```python
        bucket = s3.Bucket("MyBucket", bucket_name="my-bucket", versioned=True,
            website_redirect=s3.RedirectTarget(host_name="aws.amazon.com"))
        ```

    === "JAVA"

        ```java
        Bucket bucket = Bucket.Builder.create(self, "MyBucket")
            .bucketName("my-bucket")
            .versioned(true)
            .websiteRedirect(new RedirectTarget.Builder()
                .hostName("aws.amazon.com").build())
            .build();
        ```

    === "SYNTHESIZED CLOUDFORMATION"

        ```json
        {
            "MyBucketF68F3FF0": {
                "Type": "AWS::S3::Bucket",
                "Properties": {
                    "BucketName": "my-bucket",
                    "VersioningConfiguration": {
                    "Status": "Enabled"
                    },
                    "WebsiteConfiguration": {
                    "RedirectAllRequestsTo": {
                    "HostName": "aws.amazon.com"
                    }
                    }
                },
                "UpdateReplacePolicy": "Retain",
                "DeletionPolicy": "Retain",
                "Metadata": {
                    "aws:cdk:path": "infra-dev/MyBucket/Resource"
                }
            },
        }
        ```

    When `cdk synth` is executed, Cloudformation will be generated which can then be deployed in AWS.

    !!!info
        These code snippets are intended for illustration only. They are incomplete and won't run as they are.

    Whilst this example is trivial, imagine a construct which creates a secure S3 bucket with yoru organizations preferred settings. This construct could be re-used on all projects without having to think about which settings should or shouldn't be set. By abstracting your constructs, you can also gain significant time savings as you could have higher level constructs that create multiple resources from a single CDK construct configuration.

??? "Projen Primer"

    Projen provides the ability to model Projects as Code (PaC), allowing you to orchestrate and 'synthesize' them onto your filesystem.

    To ground this into an example, let's say we want to create a Typscript project that deploys some CDK code. Traditionally you would do this via running `cdk init app --language typescript` which would create a bunch of files and folders inside your working directory which sets up your app. The disadvantage of this approach is it is created from a template and as such if tomorrow this template changes, you will not receive any updates given you are completely detached from the original template.

    Let's assume `log4j` was a dependency for logging. If tomorrow a security patch came out which required bumping to `log4j2`, all applications created from this template would need to manually change their dependency and all code calling the old dependency to the new one. In a Projen based project, you could simply bump your version of the package containing the construct and `re-synth` your project which will automatically bump your dependency and all boilerplate code to use the new `log4j2` dependency.

    Here is an equivalent `.projenrc.ts` file which synthesizes an AWS CDK Typescript App:

    ```ts
    new AwsCdkTypeScriptApp({
    cdkVersion: "2.1.0",
    name: "infra",
    defaultReleaseBranch: "main",
    }).synth();
    ```

    !!!info
        This code snippet is intended for illustration only. It is incomplete and won't run as is shown.

    When you run `npx projen`, Projen will synthesize all files/folders in-place and hence remains attached to your project for the life of it. This is advantageous as you could imagine organizational specific constructs like an `API` which comes pre-configured with org specific lint rules, validations, sample code, etc.

    If you contrast Projen to CDK, they both use the same underlying technology ([JSII](https://aws.github.io/jsii/)) - **the key difference is CDK only synthesizes to Cloudformation, whilst Projen can synthesize to any conceivable file format**.

## Supported programming languages

The AWS PDK has first-class support for Typescript, Python, & Java.

To facilitate supporting so many languages, the AWS CDK is developed in one language (TypeScript). Language bindings are generated for the other languages through the use of a tool called [JSII](https://aws.github.io/jsii/).

## Prerequisites

Here's what you need to install and use the AWS PDK.

All AWS PDK developers, even those working in Python or Java, need Node.js 16 or later. All supported languages use the same backend, which runs on Node.js. We recommend a version in active long-term support. Your organization may have a different recommendation.

!!!tip
    We recommend installing [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating) and configuring it to use Node 18.

Other prerequisites depend on the language in which you develop AWS PDK projects and are as follows.

=== "TS"
    - Typescript >= 5

=== "PYTHON"
    - Python >= 3.9
    - Poetry >= 1.5.1

=== "JAVA"
    - JDK >= 11
    - Apache Maven >= 3.8

## Installation
### Install the AWS PDK

Install the AWS PDK Toolkit globally using the following Node Package Manager command:

`npm install -g aws-pdk`

Run the following command to verify correct installation and print the version number of the AWS PDK.

`pdk --version`

!!!warning
    The `pdk` command is a wrapper command which delegates to either a package manager or a projen command depending on the context. As such it may be possible that certain arguments may not operate as expected.

### Install the AWS CDK

You will need to install the AWS CDK in order to deploy your infrastructure to AWS. To install, run the following command:

`npm install -g aws-cdk`

Run the following command to verify correct installation and print the version number of the AWS CDK.

`cdk --version`

### Authentication with AWS

You must establish how the AWS CDK authenticates with AWS when deploying infrastructure. There are different ways in which you can configure programmatic access to AWS resources, depending on the environment and the AWS access available to you.

For an in depth guide, please refer to: https://docs.aws.amazon.com/sdkref/latest/guide/access.html

## Next steps

Where do you go now that you've had a taste for what the PDK has to offer?

- Take a crack at building [your first AWS PDK project](your_first_aws_pdk_project.md).
- See the [Developer Guide](../developer_guides/index.md) to begin exploring the provided constructs available in the PDK.
- See the [API reference](../api/index.md) to view [Js/Java/Py]Docs for each provided PDK construct.
- The AWS PDK is an [open-source project](https://github.com/aws/aws-pdk). Want to [contribute](../contributing/index.md)?