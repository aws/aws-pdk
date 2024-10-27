# FAQ

### Can I write my CDK code in Java if my .projenrc is in TypeScript?

Yes! You can mix and match languages however you like. Like all projen projects from AWS Prototyping SDK, `TypeSafeApiProject` is available for use in a `.projenrc` file in Java, Python or TypeScript.

For CDK infrastructure, pick the language you'd like to write CDK infrastructure in by configuring `infrastructure.language`.

You can also implement your API lambda handlers in a different language to your infrastructure and `.projenrc` if you like, or even implement some operations in one language and others in another. Just make sure you generate the runtime projects for any languages you'd like to write lambda handlers in.

### How do I customise the Generated Runtime/Infrastructure/Library/Handlers Projects?

By default, the generated runtime, infrastructure and library projects are configured automatically, but you can customise them in your `.projenrc` by using `runtime.options.<language>`, `infrastructure.options.<language>`, `handlers.options.<language>`, or `library.options.<library>` in your `TypeSafeApiProject`.

### How do I modify the AWS WAFv2 Web ACL my Api construct deploys?

By default, a [Web ACL](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl.html) is deployed and attached to your API Gateway Rest API with the "[AWSManagedRulesCommonRuleSet](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html)", which provides protection against exploitation of a wide range of vulnerabilities, including some of the high risk and commonly occurring vulnerabilities described in OWASP publications such as [OWASP Top 10](https://owasp.org/www-project-top-ten/).

You can customise the Web ACL configuration via the `webAclOptions` of your `Api` CDK construct, eg:

=== "TS"

    ```ts
    new Api(this, "Api", {
      webAclOptions: {
        // Allow access only to specific CIDR ranges
        cidrAllowList: {
          cidrType: 'IPV4',
          cidrRanges: ['1.2.3.4/5'],
        },
        // Pick from the set here: https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html
        managedRules: [
          { vendor: 'AWS', name: 'AWSManagedRulesSQLiRuleSet' },
        ],
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    new Api(this, "Api", ApiProps.builder()
            .webAclOptions(TypeSafeApiWebAclOptions.builder()
                    .cidrAllowList(CidrAllowList.builder()
                            .cidrType("IPV4")
                            .cidrRanges(Arrays.asList("1.2.3.4/5"))
                            .build())
                    .managedRules(Arrays.asList(ManagedRule.builder()
                                    .vendor("AWS")
                                    .name("AWSManagedRulesSQLiRuleSet")
                            .build()))
                    .build())
            ...
            .build();
    ```

=== "PYTHON"

    ```python
    Api(self, id,
        web_acl_options=TypeSafeApiWebAclOptions(
            cidr_allow_list=CidrAllowList(
                cidr_type="IPV4",
                cidr_ranges=["1.2.3.4/5"]
            ),
            managed_rules=[ManagedRule(vendor="AWS", name="AWSManagedRulesSQLiRuleSet")]
        ),
        ...
    )
    ```

### How do I configure the Smithy IntelliJ Plugin?

The Smithy-based projects are compatible with the [Smithy IntelliJ Plugin](https://github.com/iancaffey/smithy-intellij-plugin), which provides syntax highlighting and auto-complete for your Smithy model. To make use of it, perform the following steps:

- Install the "Smithy" plugin (under `Preferences -> Plugins`)
- Right-click on the `model/build.gradle` file in your Smithy API project
- Select "Link Gradle Project"

### How do I group operations in my API?

Operations can be grouped together into logical collections via tags. This can be achieved in Smithy with the `@tags` trait:

```smithy
@tags(["pets", "users"])
operation PurchasePet {
  ...
}
```

Or in OpenAPI using the `tags` property:

```yaml
paths:
  /pets/purchase:
    post:
      operationId: purchasePet
      tags:
        - pets
        - users
      ...
```

When multiple tags are used, the "first" tag is considered to be the API that the operation belongs to, so in the generated client, the above example operation would be included in the `PetsApi` client but not the `UsersApi` client.

Multiple tags are still useful for documentation generation, for example `DocumentationFormat.HTML_REDOC` will group operations by tag in the side navigation bar.

If you would like to introduce tags without breaking existing clients, we recommend first adding a tag named `default` to all operations.

⚠️ **Important Note**: Smithy versions below `1.28.0` sort tags in alphabetical order and so the "first" tag will be the earliest in the alphabet. Therefore, if using tags with older versions of Smithy, we recommend prefixing your desired first tag with an underscore (for example `_default`). This is rectified in `1.28.0`, where tag order from the `@tags` trait is preserved.

### I have multiple Smithy-based APIs, can they share common structures?

Yes. You can create a `SmithyShapeLibraryProject` on its own to create a standalone Smithy model library, which can contain the shared structures.

You can consume the library using the `addSmithyDeps` method, which adds a local file dependency to the built Smithy jar, as well as setting up an implicit dependency in the monorepo if used.

=== "TS"

    ```ts
    // Standalone model project, used as our model library
    const shapes = new SmithyShapeLibraryProject({
      name: "shapes",
      parent: monorepo,
      outdir: "packages/shapes",
    });

    const api = new TypeSafeApiProject({ ... });

    // Add a dependency on the Smithy shape library
    api.model.smithy!.addSmithyDeps(shapes);
    ```

=== "JAVA"

    ```java
    // Standalone model project, used as our model library
    SmithyShapeLibraryProject shapes = SmithyShapeLibraryProject.Builder.create()
            .name("shapes")
            .parent(monorepo)
            .outdir("packages/shapes")
            .build();

    TypeSafeApiProject api = new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()....build();

    // Add a dependency on the Smithy shape library
    api.getModel().getSmithy().addSmithyDeps(shapes);
    ```

=== "PYTHON"

    ```python
    # Standalone model project, used as our model library
    shapes = SmithyShapeLibraryProject(
        name="shapes",
        parent=monorepo,
        outdir="packages/shapes",
    )

    api = TypeSafeApiProject(...)

    # Add a dependency on the Smithy shape library
    api.model.smithy.add_smithy_deps(shapes)
    ```

### How do I debug my API locally?

You can use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) to run a local development server for your API. You can achieve this using the following steps:

1. Synthesize your CDK stack containing your `Api` construct (this might be your `AwsCdkTypeScriptApp` project for example), with the context property `type-safe-api-local` set to `true`, for example:

```bash
cd packages/infra
npx cdk synth --context type-safe-api-local=true
```

2. Use the AWS SAM CLI to start the local development server, pointing it at the cloudformation template synthesized from the above command (note that the command will fail if docker is not running)

```bash
sam local start-api -t cdk.out/<your-stack>.template.json
```

You will need to repeat the above steps every time you make a code change for them to be reflected in your local development server.

See the [AWS SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-api.html) for more information on the commands to run.

Make sure you do not deploy your CDK stack with `type-safe-api-local` set to `true`, since this uses an inline API definition which bloats the CloudFormation template and can exceed the maximum template size depending on the size of your API.

⚠️ **Important Note**: There is currently a limitation with SAM CLI where it does not support mock integrations, which means that the development server will not respond to OPTIONS requests even if you specified `corsOptions: { ... }` in your `Api` construct. This is being tracked as a [feature request here](https://github.com/aws/aws-sam-cli/issues/4973).

Note also that your API business logic may include operations which do not work locally, or may interact with real AWS resources depending on the AWS credentials you start your local development server with.

### Can I implement my API operations with something other than Lambda, like ECS?

Yes. You can write a custom integration and integrate with any of the services supported by API Gateway. See the [Integrations](../../developer_guides/type-safe-api/integrations.md) section for more information.

### How do I customise the Smithy version?

You can customise the versions of Smithy dependencies by including them in `smithyBuildOptions.maven.dependencies`. You must override the versions of all of the built-in Smithy dependencies to ensure you don't end up with a mixture of versions. For example in your `.projenrc`:

=== "TS"

    ```ts
    new TypeSafeApiProject({
      ...
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: 'my.service',
              serviceName: 'MyService',
            },
            smithyBuildOptions: {
              maven: {
                dependencies: [
                  // Override the built in smithy dependencies here
                  "software.amazon.smithy:smithy-cli:1.28.1",
                  "software.amazon.smithy:smithy-model:1.28.1",
                  "software.amazon.smithy:smithy-openapi:1.28.1",
                  "software.amazon.smithy:smithy-aws-traits:1.28.1",
                ]
              }
            }
          }
        },
      },
    });
    ```

=== "JAVA"

    ```java
     new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
            .model(ModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                            .smithy(SmithyModelOptions.builder()
                                    .serviceName(SmithyServiceName.builder()
                                            .namespace("com.my.company")
                                            .serviceName("MyApi")
                                            .build())
                                    .smithyBuildOptions(SmithyBuildOptions.builder()
                                            .maven(SmithyMavenConfiguration.builder()
                                                    .dependencies(Arrays.asList(
                                                            "software.amazon.smithy:smithy-cli:1.28.1",
                                                            "software.amazon.smithy:smithy-model:1.28.1",
                                                            "software.amazon.smithy:smithy-openapi:1.28.1",
                                                            "software.amazon.smithy:smithy-aws-traits:1.28.1"
                                                    ))
                                                    .build())
                                            .build())
                                    .build())
                            .build())
                    .build())
        ...
        .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeApiProject(
        model=ModelConfiguration(
            language=ModelLanguage.SMITHY,
            options=ModelOptions(
                smithy=SmithyModelOptions(
                    service_name=SmithyServiceName(
                        namespace="com.amazon",
                        service_name="MyAPI"
                    ),
                    smithy_build_options=SmithyBuildOptions(
                        maven=SmithyMavenConfiguration(
                            dependencies=[
                                # Override the built in smithy dependencies here
                                "software.amazon.smithy:smithy-cli:1.28.1",
                                "software.amazon.smithy:smithy-model:1.28.1",
                                "software.amazon.smithy:smithy-openapi:1.28.1",
                                "software.amazon.smithy:smithy-aws-traits:1.28.1",
                            ]
                        )
                    )
                )
            )
        ),
        ...
    )
    ```
