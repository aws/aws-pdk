# Type Safe API

This project contains an API built with [Type Safe API](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/type-safe-api).

## Project Structure

This project consists of the following components:

### Model

The `model` folder contains the API model, which defines the API operations and their inputs and outputs. For more details, please refer to the [model project README](./model/README.md).

### Runtime

The `runtime` folder contains subprojects for each of the selected runtime languages. These projects include types as well as client and server code, generated from the model.

### Infrastructure

The `infrastructure` folder contains a subproject for the selected infrastructure language. This includes a CDK construct which defines the API Gateway resources to deploy the API defined by the model.

### Documentation

The `documentation` folder contains documentation generated from the model, for each of the selected documentation formats.

## Adding Operations

This section describes the steps required to add a new operation to your API.

### Define the Operation

The API operations are defined by the API model. Please see the [model project README](./model/README.md) for instructions for the specific model language used.

### Build the Project

Next, build the project using the project's build command. This will vary depending on the overall project setup, and is likely documented in the top level README.

The build will trigger regeneration of the `runtime`, `infrastructure` and `documentation` projects, which will include your new operation.

### Add an Integration

If you are using the CDK construct defined in the `infrastructure` folder, you likely encountered a type error in your CDK project, since the construct requires an integration for every operation defined in the model.

Please refer to the [Type Safe API documentation](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/type-safe-api) for details about how to add integrations in your chosen infrastructure language.

### Implement the Operation

Finally, you'll need to implement the operation. If using AWS Lambda for your API integrations, you can make use of the generated lambda handler wrappers from one of the `runtime` projects. These wrappers provide typed interfaces for operations, providing auto-complete in your IDE for inputs, and ensuring you return the output (or one of the errors) defined in the model.

For more details about using the handler wrappers in the various supported languages, please refer to the [Type Safe API documentation](https://github.com/aws/aws-prototyping-sdk/tree/mainline/packages/type-safe-api).
