---
title: Smithy PascalCase field names
tags: smithy
packages: open-api-gateway, cloudscape-react-ts-website
---

# I have `PascalCase` field names of my `structure` definition in a Smithy model

In general, generated code is making all field names of Smithy models `camelCase` and it takes care of marshalling/unmarshalling those models from/to JSON.
When you’re using your generated handler code and/or trying to feed your data into your services, use the generated xxxFromJSON functions _ON THE TOP LEVEL_.

## Example

```ts
const resp = await ddbClient.query(...).promise();

...

// wrong - will fail - if you have any PascalCase attribute names in any of the "item"s
return {
  statusCode: 200,
  headers: corsHeaders,
  body: ListMyEntityResponseContentFromJSON({
    data: resp.Items.map((item) => MyEntityFromJSON(item)),
  }),
};
```

```ts
const resp = await ddbClient.query(...).promise();

...

// right - only use "top level" <EntityName>FromJSON method
return {
  statusCode: 200,
  headers: corsHeaders,
  body: ListMyEntityResponseContentFromJSON({
    data: resp.Items,
  }),
};
```

## Note

In general, when it comes to generated code, the following rules apply:

* `<EntityName>FromJSON` will create an internal representation of the entity (i.e.: `PascalCase` field names are converted to `camelCase`). Use this method **after you fetched your data (e.g.: from DB) and try to send it over the network**, while handling it with the same generated code on the client side.

* `<EntityName>ToJSON` will create the _real_ (original) representation of your data from the _internal_ representation (i.e.: internally `camelCase` field names are converted back to `PascalCase`). Use this if you **received data from the client side** (serialized by the generated code) and would like to **store your data in a data store**.
