## Getting started

To create a new [AWS UI](https://github.com/aws/awsui-documentation) React Typescript Project, there are a couple of options:

### Via Projen CLI

```
npx projen --from @aws-prototyping-sdk/awsui-react-ts-website awsui-react-ts-website [--application-name <your-app>]
```

### Programmatically

```ts
new AwsUiReactTsWebsiteProject({
    defaultReleaseBranch: "mainline",
    name: "<name-of-package>",
    applicationName: "<name-of-app>",
});
```

### Running your synthesized Application

To run your synthesized application locally, run `npx projen dev`.

## Developer Notes

To enable Cognito auth, ensure you have a runtime-config.json file in the root of your deployed project which at least contains the following:

```json
{
    "region": "<aws-region>",
    "identityPoolId":"<identity-pool-id>",
    "userPoolId":"<user-pool-id>",
    "userPoolWebClientId":"<user-pool-web-client-id>"
}
```

The easiest way to get this set up is to use the static-website + identity packages to deploy your website.

An example of how to do this is as follows:

```ts
const userIdentity = new UserIdentity(this, 'UserIdentity');
new StaticWebsite(this, 'StaticWebsite', {
    websiteContentPath: '<relative>/<path>/<to>/<built>/<website>',
    runtimeOptions: {
        jsonPayload: {
            region: Stack.of(this).region,
            identityPoolId: userIdentity.identityPool.identityPoolId,
            userPoolId: userIdentity.userPool?.userPoolId,
            userPoolWebClientId: userIdentity.userPoolClient?.userPoolClientId,
        },
    },
});
```

For local development, you will need to copy the generated runtime-config.json file into your /public directory. An example
on how to do this is as follows:

```
curl https://dxxxxxxxxxx.cloudfront.net/runtime-config.json > public/runtime-config.json
```