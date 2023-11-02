# Infrastructure

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/infrastructure/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/infrastructure)

> Simplify deployment of your PDK based API and Website by letting the PDK write your IaC for you!

## Getting Started

To create the necessary boilerplate infrastructure, we need to instantiate an instance of the `Infrastructure` construct from within the `projenrc` file as follows:

=== "TYPESCRIPT"

    ```typescript hl_lines="2 18-24"
    import { CloudscapeReactTsWebsiteProject } from "@aws/pdk/cloudscape-react-ts-website";
    import { InfrastructureTsProject } from "@aws/pdk/infrastructure";
    import { MonorepoTsProject } from "@aws/pdk/monorepo";
    import { TypeSafeApiProject } from "@aws/pdk/type-safe-api";

    const monorepo = new MonorepoTsProject({
       ...
    });

    const api = new TypeSafeApiProject({
       ...
    });

    const website = new CloudscapeReactTsWebsiteProject({
       ...
    });

    new InfrastructureTsProject({
        parent: monorepo,
        outdir: "packages/infra",
        name: "infra",
        cloudscapeReactTsWebsite: website,
        typeSafeApi: api,
    });

    monorepo.synth();
    ```

=== "PYTHON"

    ```python hl_lines="3 18-24"
    from aws_pdk.monorepo import MonorepoPythonProject
    from aws_pdk.cloudscape_react_ts_website import CloudscapeReactTsWebsiteProject
    from aws_pdk.infrastructure import InfrastructurePyProject
    from aws_pdk.type_safe_api import *

    monorepo = MonorepoPythonProject(
        ...
    )

    api = TypeSafeApiProject(
        ...
    )

    website = CloudscapeReactTsWebsiteProject(
        ...
    )

    InfrastructurePyProject(
        parent=monorepo,
        outdir="packages/infra",
        name="infra",
        type_safe_api=api,
        cloudscape_react_ts_website=website
    )

    monorepo.synth()
    ```

=== "JAVA"

    ```java hl_lines="5-6 25-32"
    import software.aws.pdk.monorepo.MonorepoJavaProject;
    import software.aws.pdk.monorepo.MonorepoJavaOptions;
    import software.aws.pdk.cloudscape_react_ts_website.CloudscapeReactTsWebsiteProject;
    import software.aws.pdk.cloudscape_react_ts_website.CloudscapeReactTsWebsiteProjectOptions;
    import software.aws.pdk.infrastructure.InfrastructureJavaProject;
    import software.aws.pdk.infrastructure.InfrastructureJavaProjectOptions;
    import software.aws.pdk.type_safe_api.*;
    import java.util.Arrays;

    public class projenrc {
        public static void main(String[] args) {
            MonorepoJavaProject monorepo = new MonorepoJavaProject(MonorepoJavaOptions.builder()
                    ...
                    .build());

            TypeSafeApiProject api = new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
                    ...
                    .build());

            CloudscapeReactTsWebsiteProject website = new CloudscapeReactTsWebsiteProject(
                CloudscapeReactTsWebsiteProjectOptions.builder()
                    ...
                    .build());

            new InfrastructureJavaProject(
                InfrastructureJavaProjectOptions.builder()
                    .parent(monorepo)
                    .outdir("packages/infra")
                    .name("infra")
                    .typeSafeApi(api)
                    .cloudscapeReactTsWebsite(website)
                    .build());

            monorepo.synth();
        }
    }
    ```

As always, given we have modified our `projenrc` file we need to run the `pdk` command from the root to synthesize our new infrastructure onto the filesystem.

You should now see a `packages/infra` directory containing all of your pre-configured CDK code to deploy your website and API!

Let's now build all of our code by running `pdk build` from the root directory. You should notice that all of your infrastructure now synthesizes by inspecting the `cdk.out` directory of your `packages/infra` folder. You will also notice a subfolder `cdk.out/cdkgraph` which will also contain all of your generated diagrams. If you open any of the diagrams, you should see the following which depicts the infrastructure we are about to deploy to AWS:

<img src="../../assets/images/generated_diagram.png" width="600" />

## Deploying our infrastructure to the AWS cloud

We now have everything we need to deploy our infrastructure. To do so, ensure you have [authenticated with AWS](https://docs.aws.amazon.com/sdkref/latest/guide/access.html) and that your aws cli is able to communicate with your desired AWS account & region.

Firstly, if the target account has not been [bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html), you will need to do this before proceeding.

!!!warning
    Ensure the role you have assumed has enough permissions to create all of the resources required. For full deploy permissions, you can attach the `arn:aws:iam::aws:policy/AdministratorAccess` policy to your assumed role, although this is not recommended when deploying into production.

We now can deploy our infrastructure by running the following command:

```bash
cd packages/infra
pdk run deploy --require-approval never
```

Once the deployment completes, you should see an output that resembles the following:

<img src="../../assets/images/deployment_results.png" width="600" />

Congratulations! You have successfully deployed a website and api to AWS!

To check out your website, navigate to the distribution link in the CDK deployment output above to view your website.

!!!tip
    Use the `pdk deploy:dev` command in your infrastructure package to perform a CDK hotswap deployment for faster development iterations!

## Destroying the deployed resources

Now that you're done creating your first PDK project, destroy your deployed resources to avoid incurring any costs as follows:

```bash
cd packages/infra
pdk run destroy
```

Enter **y** to approve the changes and delete the `infra-dev` stack.