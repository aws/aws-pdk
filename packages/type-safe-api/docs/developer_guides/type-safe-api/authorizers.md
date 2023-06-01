# Authorizers

The generated `Api` construct allows you to define one or more authorizers for securing your API. An integration will use the `defaultAuthorizer` unless an `authorizer` is specified at the integration level. The following authorizers are supported:

* `Authorizers.none` - No auth
* `Authorizers.iam` - AWS IAM (Signature Version 4)
* `Authorizers.cognito` - Cognito user pool
* `Authorizers.custom` - A custom authorizer (also known as a lambda authorizer)

## Cognito Authorizer

To use the Cognito authorizer, one or more user pools must be provided. You can optionally specify the scopes to check if using an access token. You can use the `withScopes` method to use the same authorizer but verify different scopes for individual integrations, for example:

=== "TS"

    ```ts
    const cognitoAuthorizer = Authorizers.cognito({
      authorizerId: "myCognitoAuthorizer",
      userPools: [new UserPool(scope, "UserPool")],
    });

    new Api(this, "Api", {
      defaultAuthorizer: cognitoAuthorizer,
      integrations: {
        // Everyone in the user pool can call this operation:
        sayHello: {
          integration: Integrations.lambda(...),
        },
        // Only users with the given scopes can call this operation
        myRestrictedOperation: {
          integration: Integrations.lambda(...),
          authorizer: cognitoAuthorizer.withScopes(
            "my-resource-server/my-scope"
          ),
        },
      },
    });
    ```

=== "JAVA"

    ```java
    CognitoAuthorizer cognitoAuthorizer = Authorizers.cognito(CognitoAuthorizerProps.builder()
            .authorizerId("myCognitoAuthorizer")
            .userPools(Arrays.asList(new UserPool(this, "UserPool")))
            .build());

    new Api(this, "Api", ApiProps.builder()
            .defaultAuthorizer(cognitoAuthorizer)
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .myRestrictedOperation(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(...))
                            .authorizer(cognitoAuthorizer.withScopes("my-resource-server/my-scope"))
                            .build())
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(...))
                            .build())
                    .build())
            .build());
    ```

=== "PYTHON"

    ```python
            cognito_authorizer = Authorizers.cognito(
                authorizer_id="myCognitoAuthorizer",
                user_pools=[UserPool(scope, "UserPool")]
            )
    
            Api(self, "Api",
                default_authorizer=cognito_authorizer,
                integrations=OperationConfig(
                    # Everyone in the user pool can call this operation:
                    say_hello=TypeSafeApiIntegration(
                        integration=Integrations.lambda_(...),
                    ),
                    # Only users with the given scopes can call this operation
                    my_restricted_operation=TypeSafeApiIntegration(
                        integration=Integrations.lambda_(...),
                        authorizer=cognito_authorizer.with_scopes("my-resource-server/my-scope")
                    ),
                ),
            )
    ```

For more information about scopes or identity and access tokens, please see the [API Gateway documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html).

## Custom Authorizer

Custom authorizers use lambda functions to handle authorizing requests. These can either be simple token-based authorizers, or more complex request-based authorizers. See the [API Gateway documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) for more details.

An example token-based authorizer (default) handled by a NodeJS lambda function:

=== "TS"

    ```ts
    Authorizers.custom({
      authorizerId: "myTokenAuthorizer",
      function: new NodejsFunction(scope, "authorizer"),
    });
    ```

=== "JAVA"

    ```java
    Authorizers.custom(CustomAuthorizerProps.builder()
            .authorizerId("myTokenAuthorizer")
            .function(new NodejsFunction(this, "authorizer"))
            .build());
    ```

=== "PYTHON"

    ```python
    Authorizers.custom(
        authorizer_id="myTokenAuthorizer",
        function=NodejsFunction(scope, "authorizer")
    )
    ```

An example request-based handler. By default the identitySource will be `method.request.header.Authorization`, however you can customise this as per [the API Gateway documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-authorizer.html#cfn-apigateway-authorizer-identitysource).

=== "TS"

    ```ts
    Authorizers.custom({
      authorizerId: "myRequestAuthorizer",
      type: CustomAuthorizerType.REQUEST,
      identitySource:
        "method.request.header.MyCustomHeader, method.request.querystring.myQueryString",
      function: new NodejsFunction(scope, "authorizer"),
    });
    ```

=== "JAVA"

    ```java
    Authorizers.custom(CustomAuthorizerProps.builder()
            .authorizerId("myRequestAuthorizer")
            .type(CustomAuthorizerType.REQUEST)
            .identitySource("method.request.header.MyCustomHeader, method.request.querystring.myQueryString")
            .function(new NodejsFunction(this, "authorizer"))
            .build());
    ```

=== "PYTHON"

    ```python
    Authorizers.custom(
        authorizer_id="myRequestAuthorizer",
        type=CustomAuthorizerType.REQUEST,
        identity_source="method.request.header.MyCustomHeader, method.request.querystring.myQueryString",
        function=NodejsFunction(scope, "authorizer")
    )
    ```
