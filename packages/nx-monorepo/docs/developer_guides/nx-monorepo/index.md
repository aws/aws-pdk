# NX Monorepo

The _nx-monorepo_ package provides several projen project types in either Typescript, Python or Java that can configure a [NX](https://nx.dev/getting-started/intro) monorepo that can manage all of your packages. When used, these project types enable polyglot builds, declarative dependency management, build caching, dependency visualization and much, much more.

The AWS Prototyping Development Kit (PDK) itself uses the _nx-monorepo_ package and is a good reference for seeing how a complex, polyglot monorepo can be set up.

## How does it work?

The construct will set up your root project to function as a Monorepo using [NX](https://nx.dev/getting-started/intro), and as such manages all of the NX configuration for you by default. Depending on the language you decide to bootstrap your project with, a projenrc file in your preferred language will be present which will allow you to add new sub-packages to your project which will be managed by NX.

The default structure of your project will be created with the following key files as shown:

=== "TS"

    ```
    node_modules/   -- installed dependencies
    nx.json         -- nx configuration (this file is managed by projen)
    package.json    -- dependency declarations (this file is managed by projen)
    .projenrc.ts    -- where your packages are defined
    yarn.lock       -- pinned dependencies
    ```

=== "JAVA"

    ```
    node_modules          -- needed as NX is deployed via npm
    nx.json               -- nx configuration (this file is managed by projen)
    package.json          -- nx dependency declaration (do not delete)
    package-lock.json     -- pinned nx dependency declaration (do not delete)
    pom.xml               -- declared maven dependencies (this file is managed by projen)
    src/
      test/
        java/
          projenrc.java   -- where your packages are defined
    ```

=== "PYTHON"

    ```
    node_modules          -- needed as NX is deployed via npm
    nx.json               -- nx configuration (this file is managed by projen)
    package.json          -- nx dependency declaration (do not delete)
    package-lock.json     -- pinned nx dependency declaration (do not delete)
    pyproject.toml        -- declared pypi dependencies (this file is managed by projen)
    ```

## Getting started

This section describes how to get started with _nx-monorepo_ construct. For more information, please refer to the developer guides for particular features of this construct.

### Create your monorepo project

To get started, simply run the following command in an empty directory to create your NX monorepo project:

=== "TS"

    ```bash
    npx projen new --from @aws-prototyping-sdk/nx-monorepo nx-monorepo-ts
    ```

    This will bootstrap your project given the above structure and contain the _.projenrc.ts_ file containing your project definition which should contain the following:

    ```ts
    import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "main",
      devDeps: ["@aws-prototyping-sdk/nx-monorepo"],
      name: "ts-bootstrap",
      projenrcTs: true,

      // deps: [],                /* Runtime dependencies of this module. */
      // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
      // packageName: undefined,  /* The "name" in package.json. */
    });
    project.synth();
    ```

=== "JAVA"

    ```bash
    npx projen new --from @aws-prototyping-sdk/nx-monorepo nx-monorepo-java
    ```

    This will bootstrap your project given the above structure and contain the _projenrc.java_ file containing your project definition which should contain the following:

    ```java
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaProject;
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaOptions;

    public class projenrc {
        public static void main(String[] args) {
            NxMonorepoJavaProject project = new NxMonorepoJavaProject(NxMonorepoJavaOptions.builder()
                .artifactId("my-app")
                .groupId("org.acme")
                .name("java-bootstrap")
                .version("0.1.0")
                .build());
            project.synth();
        }
    }
    ```

=== "PYTHON"

    ```bash
    npx projen new --from @aws-prototyping-sdk/nx-monorepo nx-monorepo-py
    ```

    This will bootstrap your project given the above structure and contain the _.projenrc.py_ file containing your project definition which should contain the following:

    ```python
    from aws_prototyping_sdk.nx_monorepo import NxMonorepoPythonProject

    project = NxMonorepoPythonProject(
        author_email="dimecha@amazon.com",
        author_name="Adrian Dimech",
        dev_deps=["@aws-prototyping-sdk/nx-monorepo"],
        module_name="py_bootstrap",
        name="py-bootstrap",
        version="0.1.0",
    )

    project.synth()
    ```

    !!! bug

        `@aws-prototyping-sdk/nx-monorepo` can be removed from _dev_deps_ as this is erroneously added by Projen due to a bug in their bootstrapping process.

To build your project, simply run `npx projen build` from the root directory.

!!! note

    Whenever you make a change to the _projenrc_ file, you will need to re-synthesize your project by running `npx projen` from the root directory. This will re-generate any projen managed file i.e: _nx.json_.

### Making changes to your projenrc file

To add new packages to the monorepo, you can simply add them as a child to the monorepo. To demonstrate, lets add a _type-safe-api_ to our monorepo.

Firstly, we need to reference the _TypeSafeApiProject_ construct which is contained within a seperate package, so firstly we need to update our _projenrc_ file to add this new dependency before we can use it.

=== "TS"

    ```ts
    import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/nx-monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
      name: "ts-bootstrap",
      projenrcTs: true,
    });
    project.synth();
    ```

=== "JAVA"

    ```java
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaProject;

    import java.util.Arrays;

    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaOptions;

    public class projenrc {
        public static void main(String[] args) {
            NxMonorepoJavaProject project = new NxMonorepoJavaProject(NxMonorepoJavaOptions.builder()
                .artifactId("my-app")
                .groupId("org.acme")
                .name("java-bootstrap")
                .version("0.1.0")
                .testDeps(Arrays.asList("software.aws.awsprototypingsdk/type-safe-api@^0"))
                .build());
            project.synth();
        }
    }
    ```

=== "PYTHON"

    ```python
    from aws_prototyping_sdk.nx_monorepo import NxMonorepoPythonProject

    project = NxMonorepoPythonProject(
        author_email="dimecha@amazon.com",
        author_name="Adrian Dimech",
        dev_deps=["aws-prototyping-sdk.type-safe-api@^0"],
        module_name="py_bootstrap",
        name="py-bootstrap",
        version="0.1.0",
    )

    project.synth()
    ```

Now in order to apply the change, we need to run `npx projen` from the root of the monorepo to synthesize the dependency change. Depending on your preferred language, it will add a new entry into your dependency management file _i.e: package.json_ and install the dependency.

!!! warning

    It is important that you only ever manage your dependencies from within the _projenrc_ file and never in your package manager file directly. This is because anytime you run `npx projen`, it will clobber any changes to the file.

Now that our dependency on _type-safe-api_ has been installed, it is time to create our API project. To do this, create an instance of the `TypeSafeApiProject` as follows:

=== "TS"

    ```ts
    import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws-prototyping-sdk/type-safe-api";

    // rename our monorepo project for better readability
    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/nx-monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
      name: "ts-bootstrap",
      projenrcTs: true,
    });

    // Create the API project
    new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.my.company",
              serviceName: "MyApi",
            },
          },
        },
      },
      runtime: {
        languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
      },
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      documentation: {
        formats: [DocumentationFormat.HTML_REDOC],
      },
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    monorepo.synth();
    ```

=== "JAVA"

    ```java
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaProject;
    import software.aws.awsprototypingsdk.typesafeapi.*;

    import java.util.Arrays;

    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaOptions;

    public class projenrc {
        public static void main(String[] args) {
            // rename our monorepo project for better readability
            NxMonorepoJavaProject monorepo = new NxMonorepoJavaProject(NxMonorepoJavaOptions.builder()
                .artifactId("my-app")
                .groupId("org.acme")
                .name("java-bootstrap")
                .version("0.1.0")
                .testDeps(Arrays.asList("software.aws.awsprototypingsdk/type-safe-api@^0"))
                .build());

            new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
                .name("myapi")
                .parent(monorepo)
                .outdir("packages/api")
                .model(ModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                        .smithy(SmithyModelOptions.builder()
                            .serviceName(SmithyServiceName.builder()
                                .namespace("com.my.company")
                                .serviceName("MyApi")
                                .build())
                            .build())
                        .build())
                    .build())
                .runtime(RuntimeConfiguration.builder()
                    .languages(Arrays.asList(Language.JAVA, Language.TYPESCRIPT, Language.PYTHON))
                    .build())
                .infrastructure(InfrastructureConfiguration.builder()
                    .language(Language.JAVA)
                    .build())
                .documentation(DocumentationConfiguration.builder()
                    .formats(Arrays.asList(DocumentationFormat.HTML_REDOC))
                    .build())
                .library(LibraryConfiguration.builder()
                    .libraries(Arrays.asList(Library.TYPESCRIPT_REACT_QUERY_HOOKS))
                    .build())
                .build());

            monorepo.synth();
        }
    }
    ```

=== "PYTHON"

    ```python
    from aws_prototyping_sdk.nx_monorepo import NxMonorepoPythonProject
    from aws_prototyping_sdk.type_safe_api import *

    # rename our monorepo project for better readability
    monorepo = NxMonorepoPythonProject(
        author_email="dimecha@amazon.com",
        author_name="Adrian Dimech",
        dev_deps=["aws-prototyping-sdk.type-safe-api@^0"],
        module_name="py_bootstrap",
        name="py-bootstrap",
        version="0.1.0",
    )

    TypeSafeApiProject(
        name="myapi",
        parent=monorepo,
        outdir="packages/api",
        model=ModelConfiguration(
            language=ModelLanguage.SMITHY,
            options=ModelOptions(
                smithy=SmithyModelOptions(
                    service_name=SmithyServiceName(
                        namespace="com.my.company",
                        service_name="MyApi"
                    )
                )
            )
        ),
        runtime=RuntimeConfiguration(
            languages=[Language.PYTHON, Language.TYPESCRIPT, Language.JAVA]
        ),
        infrastructure=InfrastructureConfiguration(
            language=Language.PYTHON
        ),
        documentation=DocumentationConfiguration(
            formats=[DocumentationFormat.HTML_REDOC]
        ),
        library=LibraryConfiguration(
            libraries=[Library.TYPESCRIPT_REACT_QUERY_HOOKS]
        )
    )

    monorepo.synth()
    ```

Now that we have modified our _projenrc_ file, it is time to synthesize our change by running `npx projen`. You will now notice that a `packages/api` directory is now present within the monorepo which contains a series of packages that were created on your behalf. The combination of the packages represents your new API.

### Building your project

To build your project, simply run `npx projen build` from the root directory. You will notice that this command will delegate to NX in order to build your project in correct dependency order.

### Adding homogenous project dependencies

To add a project level dependency on a project of the same language, you can do so using any one of the apis located on the monorepo instance as follows:

=== "TS"

    ```ts
    parentTsProject.addDeps(childTsProject.package.packageName);
    monorepo.addJavaDependency(parentJavaProject, childJavaProject);
    monorepo.addPythonPoetryDependency(parentPythonProject, childPythonProject);
    ```

=== "JAVA"

    ```java
    parentTsProject.addDeps(childTsProject.getPackage().getPackageName());
    monorepo.addJavaDependency(parentJavaProject, childJavaProject);
    monorepo.addPythonPoetryDependency(parentPythonProject, childPythonProject);
    ```

=== "PYTHON"

    ```python
    parentTsProject.add_deps(childTsProject.package.package_name)
    monorepo.add_java_dependency(parentJavaProject, childJavaProject)
    monorepo.add_python_poetry_dependency(parentPythonProject, childPythonProject)
    ```

For a worked example showing how these can be used, refer to the below example which creates an cdk _infra_ package with a dependency on the API infrastructure package:

=== "TS"

    ```ts
    import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws-prototyping-sdk/type-safe-api";
    import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";

    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/nx-monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
      name: "ts-bootstrap",
      projenrcTs: true,
    });

    const api = new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.my.company",
              serviceName: "MyApi",
            },
          },
        },
      },
      runtime: {
        languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
      },
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      documentation: {
        formats: [DocumentationFormat.HTML_REDOC],
      },
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    // Create CDK infra
    new AwsCdkTypeScriptApp({
      name: "infra",
      parent: monorepo,
      outdir: "packages/infra",
      cdkVersion: "2.1.0",
      defaultReleaseBranch: "mainline",
      // Add dependency on the infrastructure ts package
      deps: [api.infrastructure.typescript!.package.packageName],
    });

    monorepo.synth();
    ```

=== "JAVA"

    ```java
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaProject;
    import software.aws.awsprototypingsdk.typesafeapi.*;

    import java.util.Arrays;

    import io.github.cdklabs.projen.awscdk.AwsCdkJavaApp;
    import io.github.cdklabs.projen.awscdk.AwsCdkJavaAppOptions;
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaOptions;

    public class projenrc {
        public static void main(String[] args) {
            NxMonorepoJavaProject monorepo = new NxMonorepoJavaProject(NxMonorepoJavaOptions.builder()
                .artifactId("my-app")
                .groupId("org.acme")
                .name("java-bootstrap")
                .version("0.1.0")
                .testDeps(Arrays.asList("software.aws.awsprototypingsdk/type-safe-api@^0"))
                .build());

            TypeSafeApiProject api = new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
                .name("myapi")
                .parent(monorepo)
                .outdir("packages/api")
                .model(ModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                        .smithy(SmithyModelOptions.builder()
                            .serviceName(SmithyServiceName.builder()
                                .namespace("com.my.company")
                                .serviceName("MyApi")
                                .build())
                            .build())
                        .build())
                    .build())
                .runtime(RuntimeConfiguration.builder()
                    .languages(Arrays.asList(Language.JAVA, Language.TYPESCRIPT, Language.PYTHON))
                    .build())
                .infrastructure(InfrastructureConfiguration.builder()
                    .language(Language.JAVA)
                    .build())
                .documentation(DocumentationConfiguration.builder()
                    .formats(Arrays.asList(DocumentationFormat.HTML_REDOC))
                    .build())
                .library(LibraryConfiguration.builder()
                    .libraries(Arrays.asList(Library.TYPESCRIPT_REACT_QUERY_HOOKS))
                    .build())
                .build());

            // Create CDK infra
            AwsCdkJavaApp infra = new AwsCdkJavaApp(AwsCdkJavaAppOptions.builder()
                .name("infra")
                .parent(monorepo)
                .outdir("packages/infra")
                .cdkVersion("2.1.0")
                .groupId("com.my.company")
                .artifactId("infra")
                .mainClass("com.my.company.Infra")
                .version("0.0.0")
                .build());

            // Add dependency on the infrastructure java package
            monorepo.addJavaDependency(infra, api.getInfrastructure().getJava());
            monorepo.synth();
        }
    }
    ```

=== "PYTHON"

    ```python
    from aws_prototyping_sdk.nx_monorepo import NxMonorepoPythonProject
    from aws_prototyping_sdk.type_safe_api import *
    from projen.awscdk import *

    monorepo = NxMonorepoPythonProject(
        author_email="dimecha@amazon.com",
        author_name="Adrian Dimech",
        dev_deps=["aws-prototyping-sdk.type-safe-api@^0"],
        module_name="py_bootstrap",
        name="py-bootstrap",
        version="0.1.0",
    )

    api = TypeSafeApiProject(
        name="myapi",
        parent=monorepo,
        outdir="packages/api",
        model=ModelConfiguration(
            language=ModelLanguage.SMITHY,
            options=ModelOptions(
                smithy=SmithyModelOptions(
                    service_name=SmithyServiceName(
                        namespace="com.my.company",
                        service_name="MyApi"
                    )
                )
            )
        ),
        runtime=RuntimeConfiguration(
            languages=[Language.PYTHON, Language.TYPESCRIPT, Language.JAVA]
        ),
        infrastructure=InfrastructureConfiguration(
            language=Language.PYTHON
        ),
        documentation=DocumentationConfiguration(
            formats=[DocumentationFormat.HTML_REDOC]
        ),
        library=LibraryConfiguration(
            libraries=[Library.TYPESCRIPT_REACT_QUERY_HOOKS]
        )
    )

    # Create CDK infra
    infra = AwsCdkPythonApp(
        name="infra",
        parent=monorepo,
        module_name="infra",
        author_email="john@doe.com",
        author_name="John Doe",
        outdir="packages/infra",
        cdk_version="2.1.0",
        version="0.0.0",
        poetry=True
    )

    # Add dependency on the infrastructure python package
    monorepo.add_python_poetry_dependency(infra, api.infrastructure.python)

    monorepo.synth()
    ```

As always, ensure to run `npx projen` to synthesize the new project and dependency.

### Adding non-homogenous project dependencies

To add a project level dependency on a project of a different language within the monorepo, you can do so using the API's found on the monorepo instance as follows:

=== "TS"

    ```ts
    monorepo.addImplicitDependency(parentProject, childProject);

    // or

    NxProject.of(parentProject).addImplicitDependency(childProject);
    ```

=== "JAVA"

    ```java
    monorepo.addImplicitDependency(parentProject, childProject);

    // or

    NxProject.of(parentProject).addImplicitDependency(childProject);
    ```

=== "PYTHON"

    ```python
    monorepo.add_implicit_dependency(parentProject, childProject)

    # or

    NxProject.of(parentProject).add_implicit_dependency(childProject)
    ```

For a fully worked example to demonstrate, please refer to the following:

=== "TS"

    ```ts
    import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
    import {
      DocumentationFormat,
      Language,
      Library,
      ModelLanguage,
      TypeSafeApiProject,
    } from "@aws-prototyping-sdk/type-safe-api";
    import { AwsCdkTypeScriptApp } from "projen/lib/awscdk";
    import { PythonProject } from "projen/lib/python";

    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "main",
      devDeps: [
        "@aws-prototyping-sdk/nx-monorepo",
        "@aws-prototyping-sdk/type-safe-api",
      ],
      name: "ts-bootstrap",
      projenrcTs: true,
    });

    const api = new TypeSafeApiProject({
      name: "myapi",
      parent: monorepo,
      outdir: "packages/api",
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.my.company",
              serviceName: "MyApi",
            },
          },
        },
      },
      runtime: {
        languages: [Language.TYPESCRIPT, Language.PYTHON, Language.JAVA],
      },
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      documentation: {
        formats: [DocumentationFormat.HTML_REDOC],
      },
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    const infra = new AwsCdkTypeScriptApp({
      name: "infra",
      parent: monorepo,
      outdir: "packages/infra",
      cdkVersion: "2.1.0",
      defaultReleaseBranch: "mainline",
      deps: [api.infrastructure.typescript!.package.packageName],
    });

    // Create a python lib
    const pythonLib = new PythonProject({
      name: "pythonlib",
      outdir: "packages/pythonlib",
      parent: monorepo,
      moduleName: "pythonlib",
      authorEmail: "john@doe.com",
      authorName: "John Doe",
      version: "0.0.0",
      poetry: true,
    });

    // Add a dependency on pythonLib from infra
    monorepo.addImplicitDependency(infra, pythonLib);

    monorepo.synth();
    ```

=== "JAVA"

    ```java
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaProject;
    import software.aws.awsprototypingsdk.typesafeapi.*;

    import java.util.Arrays;

    import io.github.cdklabs.projen.awscdk.AwsCdkJavaApp;
    import io.github.cdklabs.projen.awscdk.AwsCdkJavaAppOptions;
    import io.github.cdklabs.projen.typescript.TypeScriptProject;
    import io.github.cdklabs.projen.typescript.TypeScriptProjectOptions;
    import software.aws.awsprototypingsdk.nxmonorepo.NxMonorepoJavaOptions;

    public class projenrc {
        public static void main(String[] args) {
            NxMonorepoJavaProject monorepo = new NxMonorepoJavaProject(NxMonorepoJavaOptions.builder()
                .artifactId("my-app")
                .groupId("org.acme")
                .name("java-bootstrap")
                .version("0.1.0")
                .testDeps(Arrays.asList("software.aws.awsprototypingsdk/type-safe-api@^0"))
                .build());

            TypeSafeApiProject api = new TypeSafeApiProject(TypeSafeApiProjectOptions.builder()
                .name("myapi")
                .parent(monorepo)
                .outdir("packages/api")
                .model(ModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                        .smithy(SmithyModelOptions.builder()
                            .serviceName(SmithyServiceName.builder()
                                .namespace("com.my.company")
                                .serviceName("MyApi")
                                .build())
                            .build())
                        .build())
                    .build())
                .runtime(RuntimeConfiguration.builder()
                    .languages(Arrays.asList(Language.JAVA, Language.TYPESCRIPT, Language.PYTHON))
                    .build())
                .infrastructure(InfrastructureConfiguration.builder()
                    .language(Language.JAVA)
                    .build())
                .documentation(DocumentationConfiguration.builder()
                    .formats(Arrays.asList(DocumentationFormat.HTML_REDOC))
                    .build())
                .library(LibraryConfiguration.builder()
                    .libraries(Arrays.asList(Library.TYPESCRIPT_REACT_QUERY_HOOKS))
                    .build())
                .build());

            AwsCdkJavaApp infra = new AwsCdkJavaApp(AwsCdkJavaAppOptions.builder()
                .name("infra")
                .parent(monorepo)
                .outdir("packages/infra")
                .cdkVersion("2.1.0")
                .groupId("com.my.company")
                .artifactId("infra")
                .mainClass("com.my.company.Infra")
                .version("0.0.0")
                .build());

            // Create a ts lib
            TypeScriptProject tsLib = new TypeScriptProject(TypeScriptProjectOptions.builder()
                .name("tslib")
                .parent(monorepo)
                .outdir("packages/tslib")
                .defaultReleaseBranch("main")
                .build());

            // Add a dependency on the tslib from infra
            monorepo.addImplicitDependency(infra, tsLib);
            monorepo.addJavaDependency(infra, api.getInfrastructure().getJava());
            monorepo.synth();
        }
    }
    ```

=== "PYTHON"

    ```python
    from aws_prototyping_sdk.nx_monorepo import NxMonorepoPythonProject
    from aws_prototyping_sdk.type_safe_api import *
    from projen.awscdk import *
    from projen.typescript import *

    monorepo = NxMonorepoPythonProject(
        author_email="dimecha@amazon.com",
        author_name="Adrian Dimech",
        dev_deps=["aws-prototyping-sdk.type-safe-api@^0"],
        module_name="py_bootstrap",
        name="py-bootstrap",
        version="0.1.0",
    )

    api = TypeSafeApiProject(
        name="myapi",
        parent=monorepo,
        outdir="packages/api",
        model=ModelConfiguration(
            language=ModelLanguage.SMITHY,
            options=ModelOptions(
                smithy=SmithyModelOptions(
                    service_name=SmithyServiceName(
                        namespace="com.my.company",
                        service_name="MyApi"
                    )
                )
            )
        ),
        runtime=RuntimeConfiguration(
            languages=[Language.PYTHON, Language.TYPESCRIPT, Language.JAVA]
        ),
        infrastructure=InfrastructureConfiguration(
            language=Language.PYTHON
        ),
        documentation=DocumentationConfiguration(
            formats=[DocumentationFormat.HTML_REDOC]
        ),
        library=LibraryConfiguration(
            libraries=[Library.TYPESCRIPT_REACT_QUERY_HOOKS]
        )
    )

    infra = AwsCdkPythonApp(
        name="infra",
        parent=monorepo,
        module_name="infra",
        author_email="john@doe.com",
        author_name="John Doe",
        outdir="packages/infra",
        cdk_version="2.1.0",
        version="0.0.0",
        poetry=True
    )

    # Create the ts lib
    tslib = TypeScriptProject(
        name="tslib",
        parent=monorepo,
        outdir="packages/tslib",
        default_release_branch="main"
    )

    # add a dependency on tslib from infra
    monorepo.add_implicit_dependency(infra, tslib)
    monorepo.add_python_poetry_dependency(infra, api.infrastructure.python)

    monorepo.synth()
    ```

### Visualizing your package dependencies

To visualize your project graph, run `npx projen graph` from the root of the monorepo.
