# Smithy Async Transformer

This package defines a custom [Smithy transform](https://smithy.io/2.0/guides/smithy-build-json.html#transforms) which is used for WebSocket APIs.

Smithy -> OpenAPI conversion requires the `@http` trait to be added to operations, however it would be unintuitive for users to specify this in their model for websocket APIs. We therefore use this transform to add the trait to operations prior to OpenAPI conversion.
