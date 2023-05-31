# AWS Arch

Library to provide metadata for AWS Services and AWS Resources.

This package generates mappings between [@aws-cdk/cfnspec](https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/cfnspec) and [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), and resolves resource metadata between these systems to infer a normalized definition of an `AwsService` and `AwsResource`.

The primary aim of this package is to provide a consistent mechanism for other libraries to retrieve naming and assets associated with CloudFormation resources, and by extension CDK resources.

### Get Started

```sh
yarn add '@aws-prototyping-sdk/aws-arch'
```

```ts
import { AwsArchitecture } from "@aws-prototyping-sdk/aws-arch";

const s3Bucket = AwsArchitecture.getResource("AWS::S3::Bucket");
const s3Service = AwsArchitecture.getService(s3Bucket.service);

console.log(s3Bucket);
console.log(s3Service);
```

```js
// => console.log(s3Bucket);
{
	"name": "Amazon Simple Storage Service Bucket",
	"cfnType": "AWS::S3::Bucket",
	"awsAssetName": "Amazon-Simple-Storage-Service_Bucket",
	"awsAssetIcon": "resources/Amazon-Simple-Storage-Service_Bucket.png",
	"service": "S3"
}

// => console.log(s3Service);
{
	"provider": "AWS",
	"name": "Amazon Simple Storage Service",
	"cfnName": "S3",
	"awsAssetIcon": "services/Amazon-Simple-Storage-Service.png",
	"awsAssetName": "Amazon-Simple-Storage-Service"
}
```

### Aws Achritecture Icons

Retrieve **category**, **service**, and **resource** [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/).

> Icon methods return relative asset key paths, as most frameworks have the concept of a base path (imagepaths). Use `AwsArchitecture.resolveAssetPath(...)` to get absolute path.

#### Retrieve icon based on CloudFormation Resource Type

**Resource Icon**

```ts
const s3Bucket = AwsArchitecture.getResource("AWS::S3::Bucket");

const s3BucketPng = s3Bucket.icon("png"); // => "storage/s3/bucket.png"
const s3BucketSvg = s3Bucket.icon("svg"); // => "storage/s3/bucket.svg"

// Resolve absolute path for icons
AwsArchitecture.resolveAssetPath(s3BucketPng); // => /User/example/.../node_modules/@aws-prototyping-sdk/aws-arc/assets/storage/s3/bucket.png
```

**Service Icon**

```ts
const s3Service = AwsArchitecture.getResource("AWS::S3::Bucket").service;
// equivalent to: `AwsArchitecture.getService("S3")`

const s3ServicePng = s3Service.icon("png"); // => "storage/s3/service_icon.png"
const s3ServiceSvg = s3Service.icon("svg"); // => "storage/s3/service_icon.svg"

// Resolve absolute path for icons
AwsArchitecture.resolveAssetPath(s3ServicePng); // => /User/example/.../node_modules/@aws-prototyping-sdk/aws-arc/assets/storage/s3/service_icon.png
```

**Category Icon**

```ts
const storageCategory =
  AwsArchitecture.getResource("AWS::S3::Bucket").service.category;
// equivalent to: `AwsArchitecture.getCategory("storage")`

const storageCategoryPng = storageCategory.icon("png"); // => "storage/category_icon.png"
const storageCategorySvg = storageCategory.icon("svg"); // => "storage/category_icon.svg"

// Resolve absolute path for icons
AwsArchitecture.resolveAssetPath(storageCategoryPng); // => /User/example/.../node_modules/@aws-prototyping-sdk/aws-arc/assets/storage/category_icon.png
```

### Development

This package auto-generates many types and asset files from external sources,
which are then auto mapped based on common patterns and explict mappings for edge-cases.

The auto-generation is handled by `/scripts` files which can be run via corresponding
package scripts (eg: `npx projen generate:assets` => `/scripts/generate-assets.ts`).

There is an implicit sequential order the scripts must be called in due to dependencies,
which is handled by `npx projen generate` script. The `generate` script is also invoked
prior to `npx projen build` if generated asset directory does not exist.

For local development of packages that depend on `aws-arch` package, you will need to
call `npx projen generate && npx projen compile` (or `npx projen build`) prior to locally
importing this package.

To update [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), change the url in `ASSET_PACKAGE_ZIP_URL` contained in `packages/aws-arch/scripts/generate-assets.ts`.
