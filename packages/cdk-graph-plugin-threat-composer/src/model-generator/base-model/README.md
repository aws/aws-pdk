## Modifying the Base Threat Model

This folder contains a base threat model (`.tc.json` file) with example threats mapped to CDK Nag rules, and the plugin filters to only the applicable threats to the CDK project.

The easiest way to modify the threat model is to import the json file into the [Threat Composer](https://awslabs.github.io/threat-composer/) tool, modify it using the UI, and then export it as json and replace the contents in this repository.

Note that CDK Nag rules are treated as "Mitigations" in Threat Composer, and the content for the mitigation must be of the format `cdk-nag rule: <CDK Nag Rule Name>`.

The CDK Nag rules can be found [here](https://github.com/cdklabs/cdk-nag/tree/main/src/rules), where the rule name is the file name of a given rule file without the extension, eg `IAMNoManagedPolicies` for [iam/IAMNoManagedPolicies.ts](https://github.com/cdklabs/cdk-nag/blob/main/src/rules/iam/IAMNoManagedPolicies.ts).
