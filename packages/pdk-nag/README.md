## PDK Nag

PDKNag ships with a helper utility that automatically configures CDKNag within your application.

```ts
const app = PDKNag.app();
const stack = new Stack(app, 'MyStack');
...
```

As shown above, this will configure your application to have CDKNag run on synthesis and by default will cause the build to fail if errors are encountered.

Additional configuration can be passed in to relax these errors if needed as follows:

```ts
const app = PDKNag.app({ failOnError: false });
const stack = new Stack(app, 'MyStack');

const nagResults: NagResult[] = app.nagResults(); // Do something with the results if needed
...
```

