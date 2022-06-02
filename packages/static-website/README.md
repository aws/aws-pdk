The static-website module is able to deploy your pre-packaged static website content into an S3 Bucket, fronted by Cloudfront. This module uses an Origin Access Identity to ensure your Bucket can only be accessed via Cloudfront and is configured to only allow HTTPS requests by default. Custom runtime configurations can also be specified which will emit a runtime-config.json file along with your website content. Typically this includes resource Arns, Id's etc which may need to be referenced from your website. This package uses sane defaults and at a minimum only requires the path to your website assets.

Below is a conceptual view of the default architecture this module creates:

```
Cloudfront Distribution (HTTPS only) -> S3 Bucket (Private via OAI)
|_ WAF V2 ACL                                |_ index.html (+ other website files and assets)
                                             |_ runtime-config.json
```
