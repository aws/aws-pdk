# Troubleshooting

### I want to use a fixed CDK/Constructs package version

```ts
const cdkVersion = ...;
const constructsVersion = ...;

monorepo.tryFindObjectFile("package.json")?.addOverride("resolutions", {
  "**/aws-cdk-lib": cdkVersion,
  "**/constructs": constructsVersion,
})
```

### I’m getting Jest `(WARN) Define ts-jest config under globals is deprecated` warnings

#### The warning

```bash
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
     <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
```

#### Solution

Add `jestOptions` when you extend or instantiate `MonorepoTsProject`:

```ts
jestOptions: {
  jestConfig: {
    transform: {
      "\\.[jt]sx?$": ["ts-jest", { tsconfig: "tsconfig.dev.json" }],
    },
  },
},
```

### I receive `@types/mapbox-gl TS2304` errors

I get this error when I add a `CloudscapeReactTsWebsiteProject` to my project:

```bash
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(328,19): error TS2304: Cannot find name 'ImageData'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(329,19): error TS2304: Cannot find name 'ImageBitmap'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(339,19): error TS2304: Cannot find name 'ImageData'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(340,19): error TS2304: Cannot find name 'ImageBitmap'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(347,86): error TS2304: Cannot find name 'ImageBitmap'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(1230,33): error TS2304: Cannot find name 'Node'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(1359,52): error TS2304: Cannot find name 'ImageData'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(1359,64): error TS2304: Cannot find name 'ImageBitmap'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(1387,43): error TS2304: Cannot find name 'ImageData'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(1387,55): error TS2304: Cannot find name 'ImageBitmap'.
myPackage: ../../node_modules/@types/mapbox-gl/index.d.ts(2027,58): error TS2304: Cannot find name 'WebGLContextEvent'.
myPackage: 👾 Task "build » compile" failed when executing "tsc --build" (cwd: /Users/<user>/projects/myProject/packages/myPackage)
```

#### Solution

When you instantiate a `TypeScriptProject` or extend it, add this to the constructor

```ts
tsconfig: {
  compilerOptions: {
    lib: ["es2019", "dom"],
  },
},
```
