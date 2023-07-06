# Using Smithy

You can use [Smithy](https://smithy.io/2.0), an interface definition language (IDL) to model your APIs. To use Smithy, in `TypeSafeApiProject`, specify it as your `model.language`.

=== "TS"

    ```ts
    new TypeSafeApiProject({
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: 'com.mycompany',
              serviceName: 'MyApi',
            },
          },
        },
      },
      ...
    });
    ```

=== "JAVA"

    ```java
    TypeSafeApiProject.Builder.create()
            .model(ModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                            .smithy(SmithyModelOptions.builder()
                                    .serviceName(SmithyServiceName.builder()
                                            .namespace("com.mycompany")
                                            .serviceName("MyApi")
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
        model={
            "language": ModelLanguage.SMITHY,
            "options": {
                "smithy": {
                    "service_name": {
                        "namespace": "com.mycompany",
                        "service_name": "MyApi"
                    }
                }
            }
        },
        ...
    )
    ```

## Using the Smithy IDL

For more information on how use Smithy for writing models, refer to the [Smithy documentation](https://smithy.io/2.0/quickstart.html).

```smithy
$version: "2"
namespace example.hello

use aws.protocols#restJson1

@title("A Sample Hello World API")

/// A sample smithy api
@restJson1
service Hello {
    version: "1.0"
    operations: [SayHello]
}

@readonly
@http(method: "GET", uri: "/hello")
operation SayHello {
    input := {
        @httpQuery("name")
        @required
        name: String
    }
    output := {
        @required
        message: String
    }
    errors: [ApiError]
}

@error("client")
structure ApiError {
    @required
    errorMessage: String
}
```

### Splitting your model definition

You can split your model definition into multiple `.smithy` files, but ensure they are in the `model/src/main/smithy` folder. For example, you can structure your model as follows:

```
model/src/main/smithy/
    |_ operations/
        |_ say-hello.smithy
    |_ structures/
        |_ say-hello-input.smithy
        |_ say-hello-output.smithy
    |_ main.smithy
```

### Defining shapes

You can reference any defined shape from any `.smithy` file in any other `.smithy` file, so long as it is defined in the same namespace.

If you wish to define shapes under different namespaces, you can import them with the `use` keyword, for example:

```smithy
$version: "2"
namespace com.foo

structure Foo {
    member: String
}
```

```smithy
$version: "2"
namespace com.bar

use com.foo#Foo

structure Bar {
    foo: Foo
}
```

### Supported protocols

PDK only supports [AWS restJson1](https://smithy.io/2.0/aws/protocols/aws-restjson1-protocol.html) currently, so make sure your service is annotated with the `@restJson1` trait.

### Authorizers

Smithy supports [adding API Gateway authorizers in the model itself](https://smithy.io/2.0/aws/aws-auth.html). If you do not have the ARN of the user pool or lambda function for an authorizer while defining the model, we recommend adding the authorizer(s) in your API CDK construct.

!!! info

    If you use Smithy generated clients, some authorizer traits such as sigv4 will include configuring the client for that particular method of authorization, so it is beneficial to define authorizers in the model. 
    
    PDK supports specifying authorizers in both the model and the construct, but the construct will take precedence where the authorizer ID is the same.

## Customizing the Smithy build

When you synthesize the `TypeSafeApiProject`, it will contain a `model/smithy-build.json` file which customises the Smithy build, such as its conversion to OpenAPI. You can customise this file by adjusting the `model.options.smithy.smithyBuildOptions`:

=== "TS"

    ```ts
    new TypeSafeApiProject({
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: 'com.mycompany',
              serviceName: 'MyApi',
            },
            // Use smithyBuildOptions to control what is added to smithy-build.json.
            smithyBuildOptions: {
              projections: {
                // You can customise the built-in openapi projection, used to generate the OpenAPI specification.
                openapi: {
                  plugins: {
                    openapi: {
                      // Customise the openapi projection here.
                      // See: https://smithy.io/2.0/guides/converting-to-openapi.html
                      useIntegerType: true,
                      ...
                    }
                  }
                },
                // You can add new projections here too
                "ts-client": {
                  "plugins": {
                    "typescript-codegen": {
                      "package" : "@my-test/smithy-generated-typescript-client",
                      "packageVersion": "0.0.1"
                    }
                  }
                }
              },
              // Note that any additional dependencies required for projections/plugins can be added here, which in turn will
              // add them to the `smithy/build.gradle` file
              maven: {
                dependencies: [
                  "software.amazon.smithy:smithy-validation-model:1.27.2",
                ]
              }
            }
          },
        },
      },
      ...
    });
    ```

=== "JAVA"

    ```java
     TypeSafeApiProject.Builder.create()
            .name("myapi")
            .model(ModelConfiguration.builder()
                    .language(ModelLanguage.SMITHY)
                    .options(ModelOptions.builder()
                            .smithy(SmithyModelOptions.builder()
                                    .serviceName(SmithyServiceName.builder()
                                            .namespace("com.mycompany")
                                            .serviceName("MyApi")
                                            .build())
                                    // Use smithyBuildOptions to control what is added to smithy-build.json.
                                    .smithyBuildOptions(SmithyBuildOptions.builder()
                                            .projections(Map.of(
                                                // You can customise the built-in openapi projection, used to generate the OpenAPI specification.
                                                "openapi", SmithyProjection.builder()
                                                        .plugins(Map.of(
                                                                "openapi", Map.of(
                                                                    "useIntegerType", true
                                                                )
                                                        ))
                                                        .build(),
                                                // You can add new projections here too
                                                "ts-client", SmithyProjection.builder()
                                                        .plugins(Map.of(
                                                                "typescript-codegen", Map.of(
                                                                        "package", "@my-test/smithy-generated-typescript-client",
                                                                        "packageVersion", "0.0.1")
                                                        ))
                                                        .build()
                                                ))
                                            // Note that any additional dependencies required for projections/plugins can be added here, which in turn will
                                            // add them to the `smithy/build.gradle` file
                                            .maven(SmithyMavenConfiguration.builder()
                                                    .dependencies(Arrays.asList("software.amazon.smithy:smithy-validation-model:1.27.2"))
                                                    .build())
                                            .build()

                                    ).build())
                                    .build())
                            .build())
        ...
        .build();
    ```

=== "PYTHON"

    ```python
    TypeSafeApiProject(
        model={
            "language": ModelLanguage.SMITHY,
            "options": {
                "smithy": {
                    "service_name": {
                        "namespace": "com.mycompany",
                        "service_name": "MyApi"
                    },
                    # Use smithyBuildOptions to control what is added to smithy-build.json.
                    "smithy_build_options": {
                        "projections": {
                            # You can customise the built-in openapi projection, used to generate the OpenAPI specification.
                            "openapi": {
                                "plugins": {
                                    "openapi": {
                                        # Customise the openapi projection here.
                                        # See: https://smithy.io/2.0/guides/converting-to-openapi.html
                                        "use_integer_type": True, ...
                                    }
                                }
                            },
                            # You can add new projections here too
                            "ts-client": {
                                "plugins": {
                                    "typescript-codegen": {
                                        "package": "@my-test/smithy-generated-typescript-client",
                                        "package_version": "0.0.1"
                                    }
                                }
                            }
                        },
                        # Note that any additional dependencies required for projections/plugins can be added here, which in turn will
                        # add them to the `smithy/build.gradle` file
                        "maven": {
                            "dependencies": ["software.amazon.smithy:smithy-validation-model:1.27.2"]
                        }
                    }
                }
            }
        },
        ...
    )
    ```
