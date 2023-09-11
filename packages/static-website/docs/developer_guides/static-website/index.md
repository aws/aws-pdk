# Static Website

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/static-website/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/static-website)

The `static-website` submodule is able to deploy your pre-packaged static website content into an S3 Bucket, fronted by Cloudfront. This module uses an Origin Access Identity to ensure your Bucket can only be accessed via Cloudfront and is configured to only allow HTTPS requests by default. Custom runtime configurations can also be specified which will emit a `runtime-config.json` file along with your website content. Typically this includes resource Arns, Id's etc which may need to be referenced from your website. This package uses sane defaults and at a minimum only requires the path to your website assets.

Below is a conceptual view of the default architecture this module creates:

```
Cloudfront Distribution (HTTPS only) -> S3 Bucket (Private via OAI)
|_ WAF V2 ACL                                |_ index.html (+ other website files and assets)
                                             |_ runtime-config.json
```

A typical use case is to create a static website with AuthN. To accomplish this, we can leverage the `UserIdentity` construct to create the User Pool (Cognito by default) and Identity Pool. We can then pipe the respective pool id's as runtimeOptions into the `StaticWebsite`. After the website is deployed, these values can be interrogated from the `runtime-config.json` deployed alongside the website in order to perform authentication within the app.

```ts
const userIdentity = new UserIdentity(this, "UserIdentity");
new StaticWebsite(this, "StaticWebsite", {
  websiteContentPath: "<relative>/<path>/<to>/<built>/<website>",
  runtimeOptions: {
    jsonPayload: {
      region: Stack.of(this).region,
      identityPoolId: userIdentity.identityPool.identityPoolId,
      userPoolId: userIdentity.userPool?.userPoolId,
      userPoolWebClientId: userIdentity.userPoolClient?.userPoolClientId,
      apiUrl: tsApi.api.urlForPath(),
    },
  },
});
```

For an end to end walkthrough, refer to the [Create Your First PDK Project](../../getting_started/your_first_aws_pdk_project.md).