# Authorizers

The generated `WebSocketApi` construct allows you to define an authorizer for securing your WebSocket API. The provided authorizer is applied to the `$connect` route to allow or deny connections. Authorizers from the [AWS APIGatewayv2 Authorizers CDK module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigatewayv2_authorizers-readme.html#websocket-apis) are used to define this.

Pass your chosen authorizer to the construct as the `authorizer`, or omit this if you would not like to manage access to your API.

For example, you can configure IAM auth as follows:

=== "TS"

    ```ts
    new WebSocketApi(this, "Api", {
      authorizer: new WebSocketIamAuthorizer(),
      integrations: MockIntegrations.mockAll(),
    });
    ```

=== "JAVA"

    !!!warning

        Java is not yet supported.

=== "PYTHON"

    !!!warning

        Python is not yet supported.
