# Prototyping Show Demo

This is the source code for the Prototyping Show demo from Episode 2!

## Follow Along

The following steps show how you can create your own repo like this from scratch using the PDK!

### Prerequisites

#### Required Tools

* `node` version 14+
* `yarn` (`npm install -g yarn`)
* [AWS CLI](https://aws.amazon.com/cli/)
* [CDK version 2](https://github.com/aws/aws-cdk#getting-started)
* [`git-remote-codecommit`](https://github.com/aws/git-remote-codecommit#step-3-install-git-remote-codecommit)

#### AWS Credentials

Ensure you have your default AWS profile set up with the region in which the CI/CD pipeline should be deployed, and
credentials for your target AWS account.

```bash
aws configure
```

### Create a Monorepo

The NX monorepo is used to manage dependencies between different sub-packages which we use to build different components
of our application. We can start with an empty monorepo using the following command:

```bash
npx projen new --from aws-prototyping-sdk nx-monorepo --no-git
```

### Add Dependencies to `.projenrc.ts`

Next, add dependencies on the experimental PDK packages we're going to use. In your `.projenrc.ts` file:

```ts
const monorepo = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: "main",
  devDeps: [
    "aws-prototyping-sdk",
    "@aws-prototyping-sdk/static-website",
    "@aws-prototyping-sdk/open-api-gateway",
    "@aws-prototyping-sdk/identity",
    "@aws-prototyping-sdk/cloudscape-react-ts-website",
  ],
  name: "PrototypingShow",
});
```

### Synthesize

Install the dependencies by synthesizing our projen project again:

```bash
npx projen
```

### Set up Standalone Packages

Next add the api, website and infrastructure packages to `.projenrc.ts`:

```ts
new OpenApiGatewayTsProject({
  name: "api",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/api",
  clientLanguages: [ClientLanguage.TYPESCRIPT],
  documentationFormats: [DocumentationFormat.HTML2],
});

new CloudscapeReactTsWebsiteProject({
  name: "website",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/website",
});

new PDKPipelineTsProject({
  name: "infra",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/infra",
  cdkVersion: "2.1.0",
  deps: [
    "@aws-prototyping-sdk/static-website",
    "@aws-prototyping-sdk/open-api-gateway",
    "@aws-prototyping-sdk/identity",
    "@aws-cdk/aws-cognito-identitypool-alpha",
  ],
});
```

Synthesize again to generate the projects we declared above:

```bash
npx projen
```

### Configure Dependencies

Next we configure dependencies between our packages by referencing package names in `deps`:

```ts
const api = new OpenApiGatewayTsProject({
  name: "api",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/api",
  clientLanguages: [ClientLanguage.TYPESCRIPT],
  documentationFormats: [DocumentationFormat.HTML2],
});

const website = new CloudscapeReactTsWebsiteProject({
  name: "website",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/website",
  deps: [api.generatedTypescriptClient.package.packageName],
});

new PDKPipelineTsProject({
  name: "infra",
  defaultReleaseBranch: "main",
  parent: monorepo,
  outdir: "packages/infra",
  cdkVersion: "2.1.0",
  deps: [
    "@aws-prototyping-sdk/static-website",
    "@aws-prototyping-sdk/open-api-gateway",
    "@aws-prototyping-sdk/identity",
    "@aws-cdk/aws-cognito-identitypool-alpha",
    api.package.packageName,
    website.package.packageName,
  ],
});
```

Synthesize again to add the dependencies in our generated projects:

```bash
npx projen
```

### Check the Build Graph

The following command is useful to visualise the dependencies between packages in your NX monorepo:

```bash
npx nx graph
```

### Build All Packages

Use the following command to build all packages in the monorepo:

```bash
npx nx run-many --target build --all
```

### Define the Infrastructure

Define infrastructure in `application-stack.ts` - in this case we instantiate the API, UserIdentity and Website, making
sure we grant permissions to authenticated users from the identity pool to call our API.

```ts
const api = new SampleApi(this, "Api");

const userIdentity = new UserIdentity(this, "UserIdentity");

userIdentity.identityPool.authenticatedRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["execute-api:Invoke"],
    resources: [api.api.arnForExecuteApi("*", "/*", "*")],
  })
);

new StaticWebsite(this, "Website", {
  websiteContentPath: path.join(__dirname, "../../website/build"),
  runtimeOptions: {
    jsonPayload: {
      region: this.region,
      apiUrl: api.api.urlForPath(),
      identityPoolId: userIdentity.identityPool.identityPoolId,
      userPoolId: userIdentity.userPool.userPoolId,
      userPoolWebClientId: userIdentity.userPoolClient!.userPoolClientId,
    },
  },
});
```

Rebuild to include the latest changes:

```bash
npx nx run-many --target build --all
```

### Deploy the Pipeline

We'll deploy the pipeline, which sets up the CodePipeline and CodeCommit repo.

Make sure you're in the `packages/infra` directory:

```bash
cd packages/infra
```

Bootstrap CDK if you haven't done this for your account already:

```bash
npx cdk bootstrap
```

Deploy the pipeline:

```
npx cdk deploy
```

### Mount to the CodeCommit Repo

The above deployed a CodeCommit repo in your AWS account called `monorepo`, which we'll mount to and push.

Make sure you're back in the root directory of your monorepo before you do this!

```bash
cd ../..
git init && git checkout -b mainline && git add --all && git commit -m "Initial commit"
git remote add origin codecommit://monorepo
git push origin mainline -u
```

Your change will flow through the pipeline and deploy!

### Create a Hook for the API Client

Next we want to call our API from the website, so we'll create a hook in `packages/website/src/api-hook.tsx`:

```ts
export const useApi = () => {
  const { runtimeContext } = useContext(RuntimeConfigContext);
  const apiUrl = runtimeContext.apiUrl;
  return new DefaultApi(new Configuration({
    basePath: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
    fetchApi: window.fetch.bind(window),
    middleware: [
      addJsonContentTypeHeaderMiddleware,
      sigv4SignMiddleware(runtimeContext.region),
    ],
  }));
};
```

This hook is using the generated typescript client (`DefaultApi`), instantiating it with the api url from the
`RuntimeConfigContext`, which was made available through the `runtimeOptions` in the static website construct.

We pass in the implementation of `fetch` - in this case the default browser implementation from `window`.

We also make use of `middleware` to augment the client's requests before they're sent to API Gateway. We add the
`Content-Type: application/json` header with the `addJsonContentTypeHeaderMiddleware`. Since we're using IAM/SigV4
authentication, we also ensure that all requests are signed with the authenticated user's credentials with the
`sigv4SignMiddleware`. If you use Cognito authentication instead, you would need to add the identity or access token
to the `Authorization` header instead.

### Update the Website Homepage

Next we update `packages/website/src/Home.tsx` to call our API when the page loads, using our type-safe client:

```tsx
const [text, setText] = useState<string | undefined>();

const api = useApi();

useEffect(() => {
  api.sayHello({
    name: 'Prototyping Show',
  }).then(result => setText(result.message)).catch(e => console.error(e));
}, []);
```

We can then render the message that comes back from the API, or a spinner if it's still loading:

```tsx
return (
  <SpaceBetween size="l">
    <Container>
      {
        text ? <h1>{text}</h1> : <Spinner size="large" />
      }
    </Container>
  </SpaceBetween>
);
```

### Deploy the Finished Product

We can push our website changes and the pipeline will deploy them:

```bash
git add --all && git commit -m "call api from website"
git push
```

### Create a Cognito User

While the change is deploying, open up the AWS console and create a user in your Cognito User pool, which we'll use to
log in to the website.

### Visit the Website

Open up CloudFront, and find the distribution that was recently deployed. Visit the distribution url, log in with your
cognito user details, and see the end result!
