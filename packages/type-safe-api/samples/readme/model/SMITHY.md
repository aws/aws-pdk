# Smithy Model

This project defines the API operations and their inputs and outputs, using an interface definition language called [Smithy](https://smithy.io/2.0/).

The default entrypoint for the API is `src/main/smithy/main.smithy`. You can add more Smithy files (and subfolders) in the `src/main/smithy` directory, and these will be discovered as part of the project's build task.

Resources:
 - [Smithy Documentation](https://smithy.io/2.0/)
 - [Type Safe API Documentation](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/type-safe-api)

## Adding Operations

To add an operation, we can use the `operation` shape. It should be annotated with the `@http` trait, which defines the method and path for the operation. Each operation has `input`, `output` and `errors`. You can define the `input` and `output` inline using the `:=` syntax.

```smithy
/// This is an example operation.
@http(method: "POST", uri: "/foo/{myUrlParam}")
operation CreateFoo {
    input := {
        /// This parameter comes from the url
        @httpLabel
        myUrlParam: String

        /// Since there's no @httpLabel or @httpQuery annotation,
        /// this parameter will be in the POST request body
        @reqired
        someParameter: String

        /// This parameter is also in the body, but is optional
        anotherParameter: Double
    }
    output := {
        @required
        foo: Foo
    }
    errors: [ApiError]
}
```

In the above, we've referenced a shape called `Foo` in the output. Let's define that as a `structure`:

```smithy
structure Foo {
    /// Some documentation about this property
    @required
    myProperty: Integer
}
```

When we're happy with our new operation, we must add it to our `service`. By default, the `service` shape is in the `src/main/smithy/main.smithy` file.

```smithy
@restJson1
service MyApi {
    version: "1.0"
    operations: [
        SayHello
        CreateFoo // <- add the new operation here
    ]
}
```

After adding the operation, please follow the remaining instructions in the [main README](../README.md).

## Resources

A common pattern is to use resources to model parts of your API. These are collections of operations which for managing an entity with an identifier. In a resource, you define the identifier as well as operations to manage the entity's lifecycle. For example:

```smithy
resource PetResource {
    identifiers: {
        petId: String
    }
    read: GetPet
    list: ListPets
    update: UpdatePet
    create: CreatePet
    delete: DeletePet
}
```

For the resource to be included in your API, you must attach it to the `service` by adding it to the service's `resources` property:

```smithy
@restJson1
service MyApi {
    version: "1.0"
    resources: [
        PetResource
    ]
}
```

For more details, see the [Smithy documentation](https://smithy.io/2.0/spec/service-types.html#resource).

## Customising the Smithy Build

The build task for this project will by default generate an Open API specification from the Smithy model, which is then used to generate the runtime, infrastructure, and documentation projects.

You can further customise the build via editing the `TypeSafeApiProject` `model.options.smithyBuildOptions` in the root `.projenrc` file. This includes adding projections, or customising the `openapi` projection used to generate the Open API specification.

For details about customising the build, please see the [Type Safe API README](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/type-safe-api), and refer to the [Smithy Build documentation](https://smithy.io/2.0/guides/building-models/build-config.html).
