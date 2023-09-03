# API Explorer

<img src="../../assets/images/website_auth.png" width="800" />

The `CloudscapeReactTsWebsiteProject` has an optional parameter called `typeSafeApi` which if passed in, automatically configures your website to set up an _API Explorer_ which will allow you to make sigv4 signed requested to your [Type Safe API](../type-safe-api/index.md).

```typescript hl_lines="5"
new CloudscapeReactTsWebsiteProject({
    parent: monorepo,
    outdir: "packages/website",
    name: "website",
    typeSafeApi: api,
});
```