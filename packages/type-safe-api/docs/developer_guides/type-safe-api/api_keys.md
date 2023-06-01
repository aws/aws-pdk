# API Keys

The generated `Api` construct allows you to configure API Keys for your API, allowing you to configure and use [Usage Plans](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html).

You can configure the API Key source, and whether API keys are required by default by passing `apiKeyOptions` to your construct.

Note that you can choose between `ApiKeySourceType.HEADER` and `ApiKeySourceType.AUTHORIZER` depending on whether you would like your users to pass the API Key via the `x-api-key` header when calling your API, or whether your lambda authorizer will return the API Key based on the caller identity. See the [API Key Source documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-key-source.html) for more details.

For `HEADER` API Keys, you can choose whether API Keys are required for all operations by default by setting `apiKeyOptions.requiredByDefault` to `true`. You can also specify it at the individual operation level by setting the individual integration's `options.apiKeyRequired` property. The operation-level value will override the default.

As well as configuring the API Key source and API Key required settings, you will likely also wish to register API Keys which can be used to call your API, and associate them with usage plans. You can do this on the `Api` construct's `api` property. Please refer to the [CDK documentation for Usage Plans and API Keys](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html#usage-plan--api-keys) for more details.

The below example demonstrates requiring an API Key for all operations besides the `sayGoodbye` operation, as well as creating an API Key and Usage Plan:

=== "TS"

    ```ts
    const api = new Api(this, "Api", {
        apiKeyOptions: {
            source: ApiKeySourceType.HEADER,
            requiredByDefault: true,
        },
        integrations: {
            sayHello: {
                integration: Integrations.lambda(...),
            },
            sayGoodbye: {
                integration: Integrations.lambda(...),
                options: {
                    apiKeyRequired: false,
                },
            },
        },
    });

    // Add API Keys and usage plans as appropriate
    const key = api.api.addApiKey("MyApiKey");
    const plan = api.api.addUsagePlan("MyUsagePlan");
    plan.addApiKey(key);
    plan.addApiStage({ stage: api.api.deploymentStage });
    ```

=== "JAVA"

    ```java
    Api api = new Api(this, "Api", ApiProps.builder()
            .apiKeyOptions(ApiKeyOptions.builder()
                    .source(ApiKeySourceType.HEADER)
                    .requiredByDefault(true)
                    .build())
            .integrations(OperationConfig.<TypeSafeApiIntegration>builder()
                    .sayHello(TypeSafeApiIntegration.builder()
                            .integration(Integrations.lambda(...))
                            .options(TypeSafeApiIntegrationOptions.builder()
                                    .apiKeyRequired(false)
                                    .build())
                            .build())
                    .build())
            .build());

    IApiKey key = api.getApi().addApiKey("MyApiKey");
    UsagePlan plan = api.getApi().addUsagePlan("MyUsagePlan");
    plan.addApiKey(key);
    plan.addApiStage(UsagePlanPerApiStage.builder()
            .stage(api.getApi().getDeploymentStage())
            .build());
    ```

=== "PYTHON"

    ```python
    api = Api(self, 'Api',
        default_authorizer=Authorizers.iam(),
        api_key_options=ApiKeyOptions(
            source=ApiKeySourceType.HEADER,
            required_by_default=True,
        ),
        integrations=OperationConfig(
            say_hello=TypeSafeApiIntegration(
                integration=Integrations.lambda_(...),
                options=TypeSafeApiIntegrationOptions(
                    api_key_required=False
                )
            ),
        ),
    )
    
    key = api.api.add_api_key("MyApiKey")
    plan = api.api.add_usage_plan("MyUsagePlan")
    plan.add_api_key(key)
    plan.add_api_stage(stage=api.api.deployment_stage)
    ```
