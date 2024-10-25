# TypeSpec Model

This project defines the API operations and their inputs and outputs, using an interface definition language called [TypeSpec](https://typespec.io/).

The entrypoint for the API is `src/main.tsp`. You can add more TypeSpec files (and subfolders) in the `src` directory.

Resources:
 - [TypeSpec Documentation](https://typespec.io/)
 - [Type Safe API Documentation](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html)

## Adding Operations

To add an operation, we can use the `op` keyword. It should be annotated with the `@route` decorator to specify the url for the operation, and the appropriate decorator for the HTTP method (eg `@get` or `@post`) Each operation has its input defined in parentheses, and its output or errors defined after the colon `:`.

```tsp
namespace MyApi;

/**
 * This is an example operation
 */
@post
@route("/foo/{myUrlParam}")
op CreateFoo(
    /**
     * This parameter comes from the url
     */
    @path myUrlParam: string,
    /**
     * Since there's no @path or @query decorator,
     * this parameter will be in the request body
     */
    someParameter: string,
    /**
     * This parameter is also in the body, but is optional
     */
    anotherParameter?: double,
): {
    /**
     * This will be a property of the response
     */
    foo: Foo;
} | BadRequestError;
```

In the above, we've referenced a model called `Foo` in the output. Let's define that as a `model`:

```tsp
model Foo {
    /**
     * Some documentation about this property
     */
    myProperty: int32;
}
```

We can add the operation in its own separate file if we like, or just in `main.tsp`. If in a separate file, __make sure to import the operation in `main.tsp`__, for example:

```tsp
import "./operations/create-foo.tsp";
```

Note that you must use the same `namespace` for all operations defined in your API.

For more details, see the [TypeSpec documentation](https://typespec.io/).
