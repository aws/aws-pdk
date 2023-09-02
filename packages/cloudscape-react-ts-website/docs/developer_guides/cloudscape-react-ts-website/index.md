# Cloudscape React TS Website

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/cloudscape-react-ts-website/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/cloudscape-react-ts-website)

> Simplified setup of a React Typescript website using the Cloudscape UX design system.

## Getting started

Instantiate your `CloudscapeReactTsWebsiteProject` from within your `.projenrc` file and then run `pdk` from the root of your momorepo.

```ts
new CloudscapeReactTsWebsiteProject({
  parent: monorepo,
  outdir: "<synth-dir>",
  name: "<name-of-package>",
  applicationName: "<name-of-app>",
  typeSafeApi: api // pass in to generate API stubs
});
```

This will synthesize your new React website into the `outdir`. If a `type-safe-api` instance is passed in, the website code will be configured to integrate with your API.


### Running your synthesized Application

To run your synthesized application locally, run `pdk dev` from within your website directory.

## Developer Notes

To enable Cognito auth and API integration, ensure you have a `runtime-config.json` file in the `public` folder of your deployed website project which at least contains the following:

```json
{
  "region": "<aws-region>",
  "identityPoolId": "<identity-pool-id>",
  "userPoolId": "<user-pool-id>",
  "userPoolWebClientId": "<user-pool-web-client-id>",
  "apiUrl": "<url-of-your-api>" // optional if not passing in a type-safe-api
}
```

The easiest way to get this set up is to use the `infrastructure` submodule to deploy your website. Please refer to the [`infrastructure` Developer Guide](../infrastructure/index.md) or the [Create your first AWS PDK project](../../getting_started/your_first_aws_pdk_project.md#creating-our-aws-infrastructure) for steps on how to accomplish this.

For local development, you will need to copy the generated `runtime-config.json` file into your `/public` directory. Ensure you have deployed your `infrastructure` and then execute the following command from the root of your website directory:

```bash
curl https://`aws cloudformation describe-stacks --query "Stacks[?StackName=='infra-dev'][].Outputs[?contains(OutputKey, 'WebsiteDistributionDomainName')].OutputValue" --output text`/runtime-config.json > public/runtime-config.json
```
