# Using TypeSpec

You can use [TypeSpec](https://typespec.io/), an interface definition language (IDL) to model your APIs. To use TypeSpec, in `TypeSafeApiProject`, specify it as your `model.language`.

Use the `namespace` to name your API. The convention is to use `PascalCase` to define your namespace.

=== "TS"

    ```ts
    new TypeSafeApiProject({
      model: {
        language: ModelLanguage.TYPESPEC,
        options: {
          typeSpec: {
            namespace: "MyApi"
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
                            .typeSpec(TypeSpecModelOptions.builder()
                                    .namespace("MyApi")
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
                type_spec=TypeSpecModelOptions(
                    namespace="MyApi"
                )
            )
        ),
        ...
    )
    ```

!!!tip

    Use the same namespace in all of your `.tsp` files to ensure they are included in your API.

## Using the TypeSpec IDL

For more information on how use TypeSpec for writing models, refer to the [TypeSpec documentation](https://typespec.io/docs/getting-started/getting-started-rest/01-setup-basic-syntax/).

You will find your API model in `model/src/main.tsp`:

```tsp
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
import "../generated/aws-pdk/prelude.tsp";

import "./types/errors.tsp";

using Http;
using OpenAPI;

/**
 * A sample TypeSpec api
 */
@service({
  title: "MyApi",
})
@info({
  version: "1.0",
})
namespace MyApi;

@get
@route("/hello")
@handler({ language: "typescript" })
op SayHello(@query name: string):
  | {
    message: string;
  }
  | BadRequestError
  | NotAuthorizedError
  | NotFoundError
  | InternalFailureError;
```

### Splitting your model definition

You can split your model definition into multiple `.tsp` files in the `model/src` folder. For example, you can structure your model as follows:

```
model/src
    |_ operations/
        |_ say-hello.tsp
    |_ models/
        |_ say-hello-input.tsp
        |_ say-hello-output.tsp
    |_ main.tsp
```

### Defining models

In TypeSpec, you can define and reuse structures called `models`. For example, one might define a model named `Foo` in `models/foo.tsp`:

```tsp
namespace MyApi;

model Foo {
  member: string;
}
```

You can reference this model in other `.tsp` files so long as you import it, for example:

```tsp
import "./foo.tsp";

namespace MyApi;

model Bar {
  foo: Foo;
}
```
