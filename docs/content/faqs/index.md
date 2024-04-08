# Frequently Asked Questions

## What's the difference between PDK and Projen?

[Projen](https://projen.io/) is a framework which allows you to define and maintain complex project configuration through code. PDK uses this framework, and vends several Projen projects. PDK is not a replacement or alternative to Projen, but rather builds on Projen to define opinionated projects which work synergistically with one another.

## What's the difference between PDK and CDK?

[CDK](https://aws.amazon.com/cdk/) is a framework for defining AWS infrastructure as code. PDK vends several CDK constructs which can be used in traditional CDK projects, but are more powerful when used within the context of a PDK project. For example, the `StaticWebsite` CDK construct vended by PDK can be used in any CDK project to deploy the infrastructure to host a static website on AWS, however when the Infrastructure and CloudscapeReactTsWebsite PDK projects are used, the `StaticWebsite` CDK construct is automatically configured to deploy your Cloudscape website, and deploy the necessary runtime configuration to set up Cognito login for your website.

While many of the PDK projects generate CDK code, PDK is not considered an abstraction over CDK. You still work with CDK to define your AWS infrastructure, but you may use these generated CDK constructs to supplement your CDK code.

## I want to change a “pre-defined” task (e.g.: add --verbose to a tsc compile task)

Use the `reset` function:

```ts
myPackage.compileTask.reset("tsc --build --verbose");
```

## Passing parameters between CDK stacks will cause `Unresolved resource dependencies` error while trying to deploy

### Links

- [Cross stack values do not work with Source.data/jsonData [CDK github]](https://github.com/aws/aws-cdk/issues/19257)
- [Nested stack runtime-config.json properties [PDK github]](https://github.com/aws/aws-pdk/issues/84)

### TLDR;

1. Create SSM Parameters in the stack where you create e.g.: a `userPool`

   ```ts
   // in UserIdentityStack
   this.userIdentity = new UserIdentity(this, "UserIdentity");

   new StringParameter(this, "userPoolIdSsmParam", {
     parameterName: ssmParamNames.userPoolId,
     stringValue: this.userIdentity.userPool.userPoolId,
   });
   ```

2. Setup explicit dependencies between stacks/constructs

   ```ts
   // in ApplicationStack
   websiteStack.node.addDependency(userIdentityStack);
   ```

3. Use already created SSM Parameters in the dependent stack

   ```ts
   // in WebsiteStack
   const userPoolIdParam = StringParameter.fromStringParameterName(this, "userPoolIdSsmParam", ssmParamNames.userPoolId);

   const website = new StaticWebsite(this, "Website", {
     websiteContentPath: ...,
     runtimeOptions: {
       jsonPayload: {
         ...,
         userPoolId: userPoolIdParam.stringValue,
         ...,
       }
     }
   })
   ```

## How do I include `js` files in my project?

### Option #1 - via `tsconfig`

```ts
const myPackage = new TypeScriptProject({
  // ...
  tsconfig: {
    compilerOptions: {
      allowJs: true, // <--------
    },
  },
  tsconfigDev: {
    compilerOptions: {
      allowJs: true, // <---------
    },
  },
});

myPackage.tsconfig?.addInclude("src/**/*.js");

// OR more specific path:
// myPackage.tsconfig?.addInclude("src/**/@lambda/**/*.js");
```

### Option #2 - with `rsync` ([example](https://github.com/aws/aws-pdk/blob/392fb8c483a99123d4e8a8b6b95b5aa7ecb014b8/private/projects/monorepo-project.ts#L39))

```ts
this.compileTask.exec(
  'rsync -a ./src/** ./lib --include="*/" --include="**/*.js" --exclude="*" --prune-empty-dirs'
);
```

## I don’t want `projen` to generate sample code and tests

```ts
const myPackage = new TypeScriptProject({
  parent: this.monorepoProject,
  outdir: "packages/my-package",
  defaultReleaseBranch: this.defaultReleaseBranch,
  name: "my-package",
  sampleCode: false, // <-------- turn off sampleCode
});
```

## I get `react`-related duplicate identifier error

### The error

```bash
myPackage: ../../../../node_modules/@types/react/index.d.ts(3131,14): error TS2300: Duplicate identifier 'LibraryManagedAttributes'.
myPackage: ../../../../node_modules/@types/react-dom/node_modules/@types/react/index.d.ts(3131,14): error TS2300: Duplicate identifier 'LibraryManagedAttributes'.
myPackage: 👾 Task "build » compile" failed when executing "tsc --build" (cwd: /Users/<user>/projects/myProject/packages/myPackage/generated/typescript)
```

### Solution

`react-dom` depends on `@types/react@*` while `react` may have another version in your project, meaning multiple versions are present.

```ts
// fix react version example
monorepoProject.package.addPackageResolutions("@types/react@^18.0.21");
```

## Fine-tune `typedoc` configuration inside packages

```ts
myProject.addFields({
  typedoc: {
    entryPoint: "src/index.ts",
    readmeFile: "./README.md",
    displayName: "My Project",
    tsConfig: "./tsconfig.json",
  },
});
```

Check the typedoc docs for setting up for monorepo: <https://typedoc.org/guides/monorepo/>

## `typedoc` fails while generating docs with `Javascript heap out of memory error`

Set `max_old_space_size` in `NODE_OPTIONS`:

```ts
myMonoRepo.addTask("doc:generate", {
  exec: "NODE_OPTIONS=--max_old_space_size=16384 npx typedoc", // experiment with the value needed
});
```

> Note: Make sure there is enough RAM in your code build environment if you automate this using `CodePipeline`.
