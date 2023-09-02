# PDK Nag

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/pdk-nag/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/pdk-nag)

PDKNag ships with a helper utility that automatically configures CDK Nag within your application.

```ts
const app = PDKNag.app();
const stack = new Stack(app, 'MyStack');
...
```

As shown above, this will configure your application to have CDK Nag run on synthesis.

By default, CDK will trigger a failure on `synth` if any errors are encountered. To relax these, run the following:

```shell
cdk synth --ignore-errors
```

Conversely, CDK will not fail on synth if warnings are detected. To enforce that all warnings are resolved, run the following command:

```shell
cdk synth --strict
```

### Instrumenting custom Nag Packs

By default, when creating a PDKNag application the [AwsSolutions](https://github.com/cdklabs/cdk-nag/blob/main/RULES.md) NagPack is instrumented. In order to specify custom NagPacks to instrument, you can configure the PDKApp as follows:

```ts
import { PDKNag, AwsPrototypingChecks } from "@aws/pdk/pdk-nag";

const app = PDKNag.app({
  nagPacks: [new AwsPrototypingChecks()],
});
```

In this example, the [AwsPrototypingChecks](https://github.com/aws/aws-pdk/blob/mainline/packages/pdk-nag/src/packs/README.md) Nag Pack has been configured to run instead of the default. Multiple NagPacks can also be instrumented by adding `NagPack` instances to the `nagPacks` array.
