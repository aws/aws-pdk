# Frequently Asked Questions - Cloudscape React TS Website

### My `react-router-dom` router doesn’t work when reloading the page or loading with a non-root URL

Reference link: <https://github.com/aws/aws-prototyping-sdk/issues/69>

Add distributionProps to your `StaticWebsite`:

```ts
import {
  StaticWebsite,
  StaticWebsiteOrigin,
} from "@aws-prototyping-sdk/static-website";

...

const adminWebsite = new StaticWebsite(this, "Website", {
  websiteContentPath: path.join(appsDir, "website", "build"),
  runtimeOptions: {
    jsonPayload: {
      region: Stack.of(this).region,
      identityPoolId: identityPoolIdParam.stringValue,
      userPoolId: userPoolIdParam.stringValue,
      userPoolWebClientId: userPoolClientIdParam.stringValue,
      apiUrl: webApiUrlParam.stringValue,
    },
  },
  distributionProps: {
    defaultBehavior: {
      origin: StaticWebsiteOrigin,
    },
    errorResponses: [
      {
        httpStatus: 404,
        responseHttpStatus: 404,
        responsePagePath: "/",
      },
    ],
  },
});
```
