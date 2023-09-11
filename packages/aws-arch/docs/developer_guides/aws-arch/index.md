# AWS Arch

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/aws-arch/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/aws-arch)

> Library to provide metadata for AWS Services and AWS Resources.

This package generates mappings between [@aws-cdk/cfnspec](https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/cfnspec) and [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), and resolves resource metadata between these systems to infer a normalized definition of an `AwsService` and `AwsResource`.

The primary aim of this package is to provide a consistent mechanism for other libraries to retrieve naming and assets associated with CloudFormation resources, and by extension CDK resources.

### Get Started

=== "TYPESCRIPT"

    ```ts
    import { AwsArchitecture } from "@aws/pdk/aws-arch";

    const s3Bucket = AwsArchitecture.getResource("AWS::S3::Bucket");
    const s3Service = AwsArchitecture.getService(s3Bucket.service.cfnService);

    console.log(s3Bucket);
    /*
    {
        "name": "Amazon Simple Storage Service Bucket",
        "cfnType": "AWS::S3::Bucket",
        "awsAssetName": "Amazon-Simple-Storage-Service_Bucket",
        "awsAssetIcon": "resources/Amazon-Simple-Storage-Service_Bucket.png",
        "service": "S3"
    }
    */
    console.log(s3Service);
    /*
    {
        "provider": "AWS",
        "name": "Amazon Simple Storage Service",
        "cfnName": "S3",
        "awsAssetIcon": "services/Amazon-Simple-Storage-Service.png",
        "awsAssetName": "Amazon-Simple-Storage-Service"
    }
    */
    ```

=== "PYTHON"


    ```python
    from aws_pdk.aws_arch import AwsArchitecture

    s3_bucket = AwsArchitecture.get_resource("AWS::S3::Bucket")
    s3_service = AwsArchitecture.get_service(s3_bucket.service.cfn_service)
    ```

=== "JAVA"

    ```java
    import software.aws.pdk.aws_arch.AwsArchitecture;
    import software.aws.pdk.aws_arch.AwsResource;
    import software.aws.pdk.aws_arch.AwsService;

    AwsResource s3Bucket = AwsArchitecture.getResource("AWS::S3::Bucket");
    AwsService s3Service = AwsArchitecture.getService(s3Bucket.getService().getCfnService());
    ```

### Aws Architecture Icons

Retrieve **category**, **service**, and **resource** [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/).

> Icon methods return relative asset key paths, as most frameworks have the concept of a base path (imagepaths). Use `AwsArchitecture.resolveAssetPath(...)` to get absolute path.

#### Retrieve icon based on CloudFormation Resource Type

**Resource Icon**

```ts
const s3Bucket = AwsArchitecture.getResource("AWS::S3::Bucket");

const s3BucketPng = s3Bucket.icon("png"); // => "storage/s3/bucket.png"
const s3BucketSvg = s3Bucket.icon("svg"); // => "storage/s3/bucket.svg"

// Resolve absolute path for icons
AwsArchitecture.resolveAssetPath(s3BucketPng); // => /User/example/.../node_modules/@aws/pdk/aws-arch/assets/storage/s3/bucket.png
```

**Service Icon**

```ts
const s3Service = AwsArchitecture.getResource("AWS::S3::Bucket").service;
// equivalent to: `AwsArchitecture.getService("S3")`

const s3ServicePng = s3Service.icon("png"); // => "storage/s3/service_icon.png"
const s3ServiceSvg = s3Service.icon("svg"); // => "storage/s3/service_icon.svg"

// Resolve absolute path for icons
AwsArchitecture.resolveAssetPath(s3ServicePng); // => /User/example/.../node_modules/@aws-pdk/aws-arch/assets/storage/s3/service_icon.png
```

**Category Icon**

```ts
const storageCategory =
  AwsArchitecture.getResource("AWS::S3::Bucket").service.category;
// equivalent to: `AwsArchitecture.getCategory("storage")`

const storageCategoryPng = storageCategory.icon("png"); // => "storage/category_icon.png"
const storageCategorySvg = storageCategory.icon("svg"); // => "storage/category_icon.svg"

// Resolve absolute path for icons
AwsArchitecture.resolveAssetPath(storageCategoryPng); // => /User/example/.../node_modules/@aws/pdk/aws-arch/assets/storage/category_icon.png
```
