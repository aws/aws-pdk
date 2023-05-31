# Using Smithy

[Smithy](https://smithy.io/2.0) is an interface definition language (IDL) which you can use to model APIs. It's the language we use to define the APIs for AWS services internally.

You can use Smithy by specifying it as your `model.language` in `TypeSafeApiProject`, for example:

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
            .model(Map.of(
                    "language", ModelLanguage.getSMITHY(),
                    "options", Map.of(
                            "smithy", Map.of(
                                    "serviceName", Map.of(
                                            "namespace", "com.mycompany",
                                            "serviceName", "MyApi")))))
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

## Smithy IDL

Please refer to the [Smithy documentation](https://smithy.io/2.0/quickstart.html) for how to write models in Smithy. A basic example is provided below:

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

You can split your model definition into multiple `.smithy` files, so long as they are in the `model/src/main/smithy` folder. For example, you may wish to structure your model as follows:

```
model/src/main/smithy/
    |_ operations/
        |_ say-hello.smithy
    |_ structures/
        |_ say-hello-input.smithy
        |_ say-hello-output.smithy
    |_ main.smithy
```

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

### Supported Protocols

Currently only [AWS restJson1](https://smithy.io/2.0/aws/protocols/aws-restjson1-protocol.html) is supported. Please ensure your service is annotated with the `@restJson1` trait.

### Authorizers

Smithy supports [adding API Gateway authorizers in the model itself](https://smithy.io/2.0/aws/aws-auth.html). Given that at model definition time one usually does not know the ARN of the user pool or lambda function for an authorizer, it is recommended to add the authorizer(s) in your Api CDK construct.

If using Smithy generated clients, some authorizer traits (eg sigv4) will include configuring the client for that particular method of authorization, so it can be beneficial to still define authorizers in the model. We therefore support specifying authorizers in both the model and the construct, but note that the construct will take precedence where the authorizer ID is the same.

## Customising the Smithy Build

When you synthesize the `TypeSafeApiProject`, it will contain a `model/smithy-build.json` file which customises the smithy build, for example its conversion to OpenAPI. You can customise this file by adjusting the `model.options.smithy.smithyBuildOptions`, for example:

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
        .model(Map.of(
                "language", ModelLanguage.getSMITHY(),
                "options", Map.of(
                        "smithy", Map.of(
                                "serviceName", Map.of(
                                        "namespace", "com.mycompany",
                                        "serviceName", "MyApi"),
                                // Use smithyBuildOptions to control what is added to smithy-build.json.
                                "smithyBuildOptions", Map.of(
                                        "projections", Map.of(
                                                // You can customise the built-in openapi projection, used to generate the OpenAPI specification.
                                                "openapi", Map.of(
                                                        "plugins", Map.of(
                                                                "openapi", Map.of(
                                                                        // Customise the openapi projection here.
                                                                        // See: https://smithy.io/2.0/guides/converting-to-openapi.html
                                                                        "useIntegerType", true, ...))),
                                                // You can add new projections here too
                                                "ts-client", Map.of(
                                                        "plugins", Map.of(
                                                                "typescript-codegen", Map.of(
                                                                        "package", "@my-test/smithy-generated-typescript-client",
                                                                        "packageVersion", "0.0.1")))),
                                        // Note that any additional dependencies required for projections/plugins can be added here, which in turn will
                                        // add them to the `smithy/build.gradle` file
                                        "maven", Map.of(
                                                "dependencies", List.of("software.amazon.smithy:smithy-validation-model:1.27.2")))))))
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
