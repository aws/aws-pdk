# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 3.0.0-alpha.0 (2022-11-20)



## 0.12.11 (2022-11-14)


### Bug Fixes

* change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)



## 0.12.6 (2022-11-03)


### Bug Fixes

* broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))



## 0.12.5 (2022-10-31)


### Bug Fixes

* **open-api-gateway:** support primitive types in request and response body in lambda wrappers ([#193](https://github.com/aws/aws-prototyping-sdk/issues/193)) ([68a1c45](https://github.com/aws/aws-prototyping-sdk/commit/68a1c451735d9098eaeb31e83b0a729837f14aef))



## 0.12.3 (2022-10-10)



## 0.12.1 (2022-10-06)


### Bug Fixes

* **open-api-gateway:** fix python interceptor removal on successive lambda calls ([#187](https://github.com/aws/aws-prototyping-sdk/issues/187)) ([ef25dca](https://github.com/aws/aws-prototyping-sdk/commit/ef25dcaad6f9ed50f1f76a92b29895f5127fb8e0))



# 0.12.0 (2022-10-05)


### Features

* **open-api-gateway:** make service name a required property for smithy projects ([#184](https://github.com/aws/aws-prototyping-sdk/issues/184)) ([46181bb](https://github.com/aws/aws-prototyping-sdk/commit/46181bbca5500022795a4d9034c5a02ee99faa81)), closes [#176](https://github.com/aws/aws-prototyping-sdk/issues/176)


### BREAKING CHANGES

* **open-api-gateway:** serviceName is now a required property for Smithy projects. Additionally its
components have been split into an object, for example 'example.hello#HelloService' becomes {
namespace: 'example.hello', serviceName: 'HelloService' }



## 0.11.8 (2022-10-04)


### Bug Fixes

* **open-api-gateway:** throw error for unsupported http methods instead of silently omitting ([#182](https://github.com/aws/aws-prototyping-sdk/issues/182)) ([3fffcae](https://github.com/aws/aws-prototyping-sdk/commit/3fffcaeb122c11e94605920412026291988a358c)), closes [#179](https://github.com/aws/aws-prototyping-sdk/issues/179)



## 0.11.7 (2022-10-04)



## 0.11.6 (2022-10-03)


### Bug Fixes

* **integrations.ts:** bUG 178 - Enable aws api gateway console to invoke lambda integrations ([#180](https://github.com/aws/aws-prototyping-sdk/issues/180)) ([7524cba](https://github.com/aws/aws-prototyping-sdk/commit/7524cbaabe2d1569451e98aa93792167cdc3443d)), closes [#178](https://github.com/aws/aws-prototyping-sdk/issues/178)



## 0.11.5 (2022-10-03)


### Bug Fixes

* **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)



## 0.11.4 (2022-09-28)


### Bug Fixes

* **open-api-gateway:** fix python sample api integration ([#174](https://github.com/aws/aws-prototyping-sdk/issues/174)) ([4a0a936](https://github.com/aws/aws-prototyping-sdk/commit/4a0a936bf629b33a32f7b3cf11605d5802bcd019))



## 0.11.3 (2022-09-26)



## 0.11.1 (2022-09-19)


### Features

* **open-api-gateway:** prefer user-specified dependency versions for auto-added dependencies ([#166](https://github.com/aws/aws-prototyping-sdk/issues/166)) ([24b88dd](https://github.com/aws/aws-prototyping-sdk/commit/24b88dd03eab971090583648dbd9116ce76b1422)), closes [#164](https://github.com/aws/aws-prototyping-sdk/issues/164)



# 0.11.0 (2022-09-16)


### Features

* **open-api-gateway:** support integrations other than lambda ([#163](https://github.com/aws/aws-prototyping-sdk/issues/163)) ([cf29ab0](https://github.com/aws/aws-prototyping-sdk/commit/cf29ab06be24d5d40d771bc48ddfab3fb1ec7e10))


### BREAKING CHANGES

* **open-api-gateway:** Rename OpenApiGatewayLambdaApi construct to OpenApiGatewayRestApi. Integrations no
longer take a 'function' prop, and instead must be given 'integration:
Integrations.lambda(myLambda)'



## 0.10.3 (2022-09-15)


### Features

* **open-api-gateway:** clean up previously generated clients and docs ([#162](https://github.com/aws/aws-prototyping-sdk/issues/162)) ([93623b5](https://github.com/aws/aws-prototyping-sdk/commit/93623b5c2d54239f4612d0764064fb505803ff7d))



## 0.10.2 (2022-09-14)


### Bug Fixes

* **open-api-gateway:** ensure cors options request does not inherit default authorizer ([#161](https://github.com/aws/aws-prototyping-sdk/issues/161)) ([2989f17](https://github.com/aws/aws-prototyping-sdk/commit/2989f17ceb20a79507671cf2acdcd981016a45aa))



## 0.10.1 (2022-09-14)


### Features

* **open-api-gateway:** support smithy as alternative api interface definition language ([#160](https://github.com/aws/aws-prototyping-sdk/issues/160)) ([924d71c](https://github.com/aws/aws-prototyping-sdk/commit/924d71ce728600368208d8ed009e8a02a96ffaed)), closes [#145](https://github.com/aws/aws-prototyping-sdk/issues/145)



# 0.10.0 (2022-09-13)


### Bug Fixes

* **openapi tool:** upgrade python generator ([#159](https://github.com/aws/aws-prototyping-sdk/issues/159)) ([117c034](https://github.com/aws/aws-prototyping-sdk/commit/117c034e2adbd788998d0d09f79d01a040057598))


### BREAKING CHANGES

* **openapi tool:** import paths for the generated api client changed



## 0.9.4 (2022-09-12)


### Features

* **open-api-gateway:** add aws wafv2 webacl to api, enabled by default ([#153](https://github.com/aws/aws-prototyping-sdk/issues/153)) ([83c164e](https://github.com/aws/aws-prototyping-sdk/commit/83c164e583faa7ba198b60726c66dc9d0b0fa179))



## 0.9.1 (2022-09-07)


### Features

* **open-api-gateway:** add java projen project type for defining cdk infrastructure in java ([#152](https://github.com/aws/aws-prototyping-sdk/issues/152)) ([a458fae](https://github.com/aws/aws-prototyping-sdk/commit/a458fae9ce3841b945746f5f3f58fc3877787255))



# 0.9.0 (2022-09-07)


### Features

* **open-api-gateway:** typescript handler input as single object with typed event/context ([#151](https://github.com/aws/aws-prototyping-sdk/issues/151)) ([431dbec](https://github.com/aws/aws-prototyping-sdk/commit/431dbec05522383c769d6534d3a43fc7be233529))


### BREAKING CHANGES

* **open-api-gateway:** Typescript handler methods now accept a single object with input, event, context
rather than as separate arguments.



## 0.8.5 (2022-09-05)



## 0.8.4 (2022-09-02)


### Features

* **open-api-gateway:** add python interceptor support ([#149](https://github.com/aws/aws-prototyping-sdk/issues/149)) ([1289ff2](https://github.com/aws/aws-prototyping-sdk/commit/1289ff251640b4fd9947fd8e629c2649aa69e404))



## 0.8.3 (2022-09-02)


### Bug Fixes

* **open-api-gateway:** fix bug where all clients were generated no matter requested languages ([#148](https://github.com/aws/aws-prototyping-sdk/issues/148)) ([321ed85](https://github.com/aws/aws-prototyping-sdk/commit/321ed85fe49b04c7487fea8cc2ccefdc4c827f63))



## 0.8.1 (2022-09-01)


### Bug Fixes

* **open-api-gateway:** make sure references to generated clients are available when spec unchanged ([#146](https://github.com/aws/aws-prototyping-sdk/issues/146)) ([bb14926](https://github.com/aws/aws-prototyping-sdk/commit/bb14926995da1876a00bfda3391742b1d0a8146a))



# 0.8.0 (2022-09-01)


### Features

* **open-api-gateway:** add lambda handler wrappers and interceptors to generated java client ([#144](https://github.com/aws/aws-prototyping-sdk/issues/144)) ([32eb329](https://github.com/aws/aws-prototyping-sdk/commit/32eb3293ef03f5682d7b0ef27b732ff490f2d272))


### BREAKING CHANGES

* **open-api-gateway:** Generated Java client methods now require .execute() to make the api call, eg
api.sayHello(name).execute()



## 0.7.9 (2022-08-31)


### Features

* **open-api-gateway:** control re-generating clients and docs ([#138](https://github.com/aws/aws-prototyping-sdk/issues/138)) ([fe877ff](https://github.com/aws/aws-prototyping-sdk/commit/fe877ff6672ba792d09bb7d7e36ef981dbc05ed9))



## 0.7.8 (2022-08-31)


### Bug Fixes

* **open-api-gateway:** use generated json encoder to serialise schemas ([#143](https://github.com/aws/aws-prototyping-sdk/issues/143)) ([83fe023](https://github.com/aws/aws-prototyping-sdk/commit/83fe0237875321d8ffe16219e128d0f6c5692bba))



## 0.7.4 (2022-08-23)


### Bug Fixes

* remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))



## 0.7.3 (2022-08-23)


### Bug Fixes

* snapshots ([#134](https://github.com/aws/aws-prototyping-sdk/issues/134)) ([a07c783](https://github.com/aws/aws-prototyping-sdk/commit/a07c78373b223e0d26316213fc80fa717a0356f9))


### Features

* sigv4 middleware, cors by default for sample api ([#132](https://github.com/aws/aws-prototyping-sdk/issues/132)) ([3b391c0](https://github.com/aws/aws-prototyping-sdk/commit/3b391c0d0ad94c3909c34066cce1dd69ff55538f))



## 0.7.2 (2022-08-19)


### Bug Fixes

* **open-api-gateway:** ensure api is redeployed when integrations/authorizers change ([#130](https://github.com/aws/aws-prototyping-sdk/issues/130)) ([76f76dd](https://github.com/aws/aws-prototyping-sdk/commit/76f76dd9fc1972ee7a230ea88ac825add160e280))



# 0.7.0 (2022-08-17)


### Features

* **open-api-gateway:** stricter type enforcement for error responses in ts/python lambda handlers ([#126](https://github.com/aws/aws-prototyping-sdk/issues/126)) ([bdebc28](https://github.com/aws/aws-prototyping-sdk/commit/bdebc283c3dc737bf8412c5fbefc947efc02c1ce))


### BREAKING CHANGES

* **open-api-gateway:** lambda handler wrappers no longer accept a type parameter for errors. lambda
handlers must return the matching response body for the status code defined in the specification.



## 0.6.1 (2022-08-15)


### Bug Fixes

* **open-api-gateway:** use correct path to spec in typed construct wrapper ([#122](https://github.com/aws/aws-prototyping-sdk/issues/122)) ([dc5395f](https://github.com/aws/aws-prototyping-sdk/commit/dc5395fe973d0b8da807c765064c44c49a5bad0a))



# 0.6.0 (2022-08-15)


### Features

* **open-api-gateway:** support larger api specs via s3-based api definition ([#120](https://github.com/aws/aws-prototyping-sdk/issues/120)) ([f28faad](https://github.com/aws/aws-prototyping-sdk/commit/f28faad9233b34938f43809eae63a87c24d929f7))


### BREAKING CHANGES

* **open-api-gateway:** construct no longer extends SpecRestApi and requires new specPath prop



## 0.5.5 (2022-08-08)


### Bug Fixes

* **open-api-gateway:** iam auth in combination with other authorizers ([#117](https://github.com/aws/aws-prototyping-sdk/issues/117)) ([6d6d813](https://github.com/aws/aws-prototyping-sdk/commit/6d6d8139c934d1f42478971401ba8ab90bf6f6d6))



## 0.5.4 (2022-08-08)


### Bug Fixes

* **open-api-gateway:** response marshalling status code ([#116](https://github.com/aws/aws-prototyping-sdk/issues/116)) ([c087dc4](https://github.com/aws/aws-prototyping-sdk/commit/c087dc493a2a068d5f5085a1db27de715db09b70))



## 0.5.3 (2022-08-05)


### Bug Fixes

* **open-api-gateway:** fix non json return type marshalling ([#115](https://github.com/aws/aws-prototyping-sdk/issues/115)) ([5053078](https://github.com/aws/aws-prototyping-sdk/commit/50530789bd776faa88b2858aa4b78e280750f626))



## 0.5.1 (2022-07-24)


### Bug Fixes

* disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))


### Features

* **open-api-gateway:** support for chained request/response interceptors in typescript ([#108](https://github.com/aws/aws-prototyping-sdk/issues/108)) ([d498b83](https://github.com/aws/aws-prototyping-sdk/commit/d498b83735c30f31ae22c46833731ead05269472))



## 0.3.13 (2022-07-18)


### Features

* add support for a monorepo upgrade-deps task ([#96](https://github.com/aws/aws-prototyping-sdk/issues/96)) ([3c84956](https://github.com/aws/aws-prototyping-sdk/commit/3c84956e424162632faacbcdab4dad4c3418a7ce))



## 0.3.12 (2022-07-15)


### Bug Fixes

* ensure aspects run for Pipeline stages ([#94](https://github.com/aws/aws-prototyping-sdk/issues/94)) ([35082e0](https://github.com/aws/aws-prototyping-sdk/commit/35082e069c0ca8714a9f8b91a997bf2710a38177))



## 0.3.10 (2022-07-14)


### Bug Fixes

* add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))



## 0.3.9 (2022-07-14)


### Bug Fixes

* add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))
* fix pipeline errors ([#90](https://github.com/aws/aws-prototyping-sdk/issues/90)) ([28c59e0](https://github.com/aws/aws-prototyping-sdk/commit/28c59e0248a7bab6cfe1e74ec1e89a7cf8b4eaee))


### Features

* improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))



## 0.3.8 (2022-07-12)


### Bug Fixes

* improve security posture of OpenAPI construct ([#88](https://github.com/aws/aws-prototyping-sdk/issues/88)) ([86b7143](https://github.com/aws/aws-prototyping-sdk/commit/86b714339ccf5f5a1ef145312037534c664983e1))



## 0.3.7 (2022-07-12)


### Bug Fixes

* **open-api-gateway:** remove lib dir in precompile to ensure spec always updated ([#86](https://github.com/aws/aws-prototyping-sdk/issues/86)) ([5c50540](https://github.com/aws/aws-prototyping-sdk/commit/5c5054054cc21ea47405458e63b96eeca376db54))



## 0.3.2 (2022-07-07)


### Features

* **open-api-gateway:** add documentation generation support ([#79](https://github.com/aws/aws-prototyping-sdk/issues/79)) ([5f32fa0](https://github.com/aws/aws-prototyping-sdk/commit/5f32fa0b251e94efaf5d2e1fd88f009b3ee4df21)), closes [cdklabs/jsii-docgen#644](https://github.com/cdklabs/jsii-docgen/issues/644)



## 0.3.1 (2022-07-06)


### Features

* **open-api-gateway:** add operation config for java and update docs ([#78](https://github.com/aws/aws-prototyping-sdk/issues/78)) ([7420c27](https://github.com/aws/aws-prototyping-sdk/commit/7420c2750654f8bae74a6266693b75d189427271))
* provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))


### BREAKING CHANGES

* rename type -> cidrType in CidrAllowList

* fix: add failOnWarning to PDKNag



## 0.2.18 (2022-07-04)


### Bug Fixes

* **open-api-gateway:** allow customisation of generated typescript client tsconfig ([#75](https://github.com/aws/aws-prototyping-sdk/issues/75)) ([3932610](https://github.com/aws/aws-prototyping-sdk/commit/393261051c1019fbfc1a5888fefbfa8d6534b207))



## 0.2.17 (2022-06-30)



## 0.2.16 (2022-06-30)



## 0.2.14 (2022-06-28)


### Features

* **open-api-gateway:** python support ([#61](https://github.com/aws/aws-prototyping-sdk/issues/61)) ([b176429](https://github.com/aws/aws-prototyping-sdk/commit/b1764292686c40c933d4755707ad76db49296c0a))



## 0.2.11 (2022-06-26)



## 0.2.7 (2022-06-22)


### Bug Fixes

* **open-api-gateway:** use projen .gitignore rather than open-api-generator ([#52](https://github.com/aws/aws-prototyping-sdk/issues/52)) ([535aaac](https://github.com/aws/aws-prototyping-sdk/commit/535aaac8bbf8dbacf3667ed5215da9b38a7805d1))


### Features

* implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))



## 0.2.4 (2022-06-21)


### Features

* **open-api-gateway:** add java client generation ([#50](https://github.com/aws/aws-prototyping-sdk/issues/50)) ([d663b24](https://github.com/aws/aws-prototyping-sdk/commit/d663b24ac6e16384c925fe9998d3897cb6beeca6))



## 0.2.2 (2022-06-21)


### Features

* **open-api-gateway:** add python client generation ([#46](https://github.com/aws/aws-prototyping-sdk/issues/46)) ([375cf7b](https://github.com/aws/aws-prototyping-sdk/commit/375cf7b6af308f67cca2093206a2c9500a13e38f))



# 0.2.0 (2022-06-18)


### Code Refactoring

* **open api gateway:** improve project structure ([#42](https://github.com/aws/aws-prototyping-sdk/issues/42)) ([1fda02b](https://github.com/aws/aws-prototyping-sdk/commit/1fda02b90e4591e68dcf465fe0f2c19d13f29fbe))


### BREAKING CHANGES

* **open api gateway:** Combined `specDir` and `specFileName` into a single `specFile` parameter

* docs(open-api-gateway): update readme



# 0.1.0 (2022-06-17)


### Features

* **open-api-gateway:** add support for cognito and custom authorizers ([#40](https://github.com/aws/aws-prototyping-sdk/issues/40)) ([db81ba1](https://github.com/aws/aws-prototyping-sdk/commit/db81ba1db2258645a710b9c113c68528ee127072))


### BREAKING CHANGES

* **open-api-gateway:** `authType` is no longer provided to the construct, instead `defaultAuthorizer` must
be used.

* build: add missing package.json changes

* refactor(open-api-gateway): docs and minor refactor

* refactor(open-api-gateway): address pr comments



## 0.0.96 (2022-06-17)


### Bug Fixes

* resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))



## 0.0.95 (2022-06-17)



## 0.0.94 (2022-06-17)


### Bug Fixes

* **open-api-gateway:** fix sample handler resolution, parsed spec import, and reduce generation time ([#33](https://github.com/aws/aws-prototyping-sdk/issues/33)) ([5d6c2d6](https://github.com/aws/aws-prototyping-sdk/commit/5d6c2d6cc143a02d11a3d4fefc297e265d6025b9))



## 0.0.92 (2022-06-15)


### Bug Fixes

* dyanmically determine dist version ([#32](https://github.com/aws/aws-prototyping-sdk/issues/32)) ([7963ea5](https://github.com/aws/aws-prototyping-sdk/commit/7963ea5ed656dcd22fa48925bb252001bed2f536))


### Features

* **open-api-gateway:** add package for declarative apis written in OpenAPI ([#28](https://github.com/aws/aws-prototyping-sdk/issues/28)) ([303e659](https://github.com/aws/aws-prototyping-sdk/commit/303e659d71c99a221af0dd5e68133be9080627b1))





# 2.0.0-alpha.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.5 (2022-10-31)

### Bug Fixes

- **open-api-gateway:** support primitive types in request and response body in lambda wrappers ([#193](https://github.com/aws/aws-prototyping-sdk/issues/193)) ([68a1c45](https://github.com/aws/aws-prototyping-sdk/commit/68a1c451735d9098eaeb31e83b0a729837f14aef))

## 0.12.3 (2022-10-10)

## 0.12.1 (2022-10-06)

### Bug Fixes

- **open-api-gateway:** fix python interceptor removal on successive lambda calls ([#187](https://github.com/aws/aws-prototyping-sdk/issues/187)) ([ef25dca](https://github.com/aws/aws-prototyping-sdk/commit/ef25dcaad6f9ed50f1f76a92b29895f5127fb8e0))

# 0.12.0 (2022-10-05)

### Features

- **open-api-gateway:** make service name a required property for smithy projects ([#184](https://github.com/aws/aws-prototyping-sdk/issues/184)) ([46181bb](https://github.com/aws/aws-prototyping-sdk/commit/46181bbca5500022795a4d9034c5a02ee99faa81)), closes [#176](https://github.com/aws/aws-prototyping-sdk/issues/176)

### BREAKING CHANGES

- **open-api-gateway:** serviceName is now a required property for Smithy projects. Additionally its
  components have been split into an object, for example 'example.hello#HelloService' becomes {
  namespace: 'example.hello', serviceName: 'HelloService' }

## 0.11.8 (2022-10-04)

### Bug Fixes

- **open-api-gateway:** throw error for unsupported http methods instead of silently omitting ([#182](https://github.com/aws/aws-prototyping-sdk/issues/182)) ([3fffcae](https://github.com/aws/aws-prototyping-sdk/commit/3fffcaeb122c11e94605920412026291988a358c)), closes [#179](https://github.com/aws/aws-prototyping-sdk/issues/179)

## 0.11.7 (2022-10-04)

## 0.11.6 (2022-10-03)

### Bug Fixes

- **integrations.ts:** bUG 178 - Enable aws api gateway console to invoke lambda integrations ([#180](https://github.com/aws/aws-prototyping-sdk/issues/180)) ([7524cba](https://github.com/aws/aws-prototyping-sdk/commit/7524cbaabe2d1569451e98aa93792167cdc3443d)), closes [#178](https://github.com/aws/aws-prototyping-sdk/issues/178)

## 0.11.5 (2022-10-03)

### Bug Fixes

- **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)

## 0.11.4 (2022-09-28)

### Bug Fixes

- **open-api-gateway:** fix python sample api integration ([#174](https://github.com/aws/aws-prototyping-sdk/issues/174)) ([4a0a936](https://github.com/aws/aws-prototyping-sdk/commit/4a0a936bf629b33a32f7b3cf11605d5802bcd019))

## 0.11.3 (2022-09-26)

## 0.11.1 (2022-09-19)

### Features

- **open-api-gateway:** prefer user-specified dependency versions for auto-added dependencies ([#166](https://github.com/aws/aws-prototyping-sdk/issues/166)) ([24b88dd](https://github.com/aws/aws-prototyping-sdk/commit/24b88dd03eab971090583648dbd9116ce76b1422)), closes [#164](https://github.com/aws/aws-prototyping-sdk/issues/164)

# 0.11.0 (2022-09-16)

### Features

- **open-api-gateway:** support integrations other than lambda ([#163](https://github.com/aws/aws-prototyping-sdk/issues/163)) ([cf29ab0](https://github.com/aws/aws-prototyping-sdk/commit/cf29ab06be24d5d40d771bc48ddfab3fb1ec7e10))

### BREAKING CHANGES

- **open-api-gateway:** Rename OpenApiGatewayLambdaApi construct to OpenApiGatewayRestApi. Integrations no
  longer take a 'function' prop, and instead must be given 'integration:
  Integrations.lambda(myLambda)'

## 0.10.3 (2022-09-15)

### Features

- **open-api-gateway:** clean up previously generated clients and docs ([#162](https://github.com/aws/aws-prototyping-sdk/issues/162)) ([93623b5](https://github.com/aws/aws-prototyping-sdk/commit/93623b5c2d54239f4612d0764064fb505803ff7d))

## 0.10.2 (2022-09-14)

### Bug Fixes

- **open-api-gateway:** ensure cors options request does not inherit default authorizer ([#161](https://github.com/aws/aws-prototyping-sdk/issues/161)) ([2989f17](https://github.com/aws/aws-prototyping-sdk/commit/2989f17ceb20a79507671cf2acdcd981016a45aa))

## 0.10.1 (2022-09-14)

### Features

- **open-api-gateway:** support smithy as alternative api interface definition language ([#160](https://github.com/aws/aws-prototyping-sdk/issues/160)) ([924d71c](https://github.com/aws/aws-prototyping-sdk/commit/924d71ce728600368208d8ed009e8a02a96ffaed)), closes [#145](https://github.com/aws/aws-prototyping-sdk/issues/145)

# 0.10.0 (2022-09-13)

### Bug Fixes

- **openapi tool:** upgrade python generator ([#159](https://github.com/aws/aws-prototyping-sdk/issues/159)) ([117c034](https://github.com/aws/aws-prototyping-sdk/commit/117c034e2adbd788998d0d09f79d01a040057598))

### BREAKING CHANGES

- **openapi tool:** import paths for the generated api client changed

## 0.9.4 (2022-09-12)

### Features

- **open-api-gateway:** add aws wafv2 webacl to api, enabled by default ([#153](https://github.com/aws/aws-prototyping-sdk/issues/153)) ([83c164e](https://github.com/aws/aws-prototyping-sdk/commit/83c164e583faa7ba198b60726c66dc9d0b0fa179))

## 0.9.1 (2022-09-07)

### Features

- **open-api-gateway:** add java projen project type for defining cdk infrastructure in java ([#152](https://github.com/aws/aws-prototyping-sdk/issues/152)) ([a458fae](https://github.com/aws/aws-prototyping-sdk/commit/a458fae9ce3841b945746f5f3f58fc3877787255))

# 0.9.0 (2022-09-07)

### Features

- **open-api-gateway:** typescript handler input as single object with typed event/context ([#151](https://github.com/aws/aws-prototyping-sdk/issues/151)) ([431dbec](https://github.com/aws/aws-prototyping-sdk/commit/431dbec05522383c769d6534d3a43fc7be233529))

### BREAKING CHANGES

- **open-api-gateway:** Typescript handler methods now accept a single object with input, event, context
  rather than as separate arguments.

## 0.8.5 (2022-09-05)

## 0.8.4 (2022-09-02)

### Features

- **open-api-gateway:** add python interceptor support ([#149](https://github.com/aws/aws-prototyping-sdk/issues/149)) ([1289ff2](https://github.com/aws/aws-prototyping-sdk/commit/1289ff251640b4fd9947fd8e629c2649aa69e404))

## 0.8.3 (2022-09-02)

### Bug Fixes

- **open-api-gateway:** fix bug where all clients were generated no matter requested languages ([#148](https://github.com/aws/aws-prototyping-sdk/issues/148)) ([321ed85](https://github.com/aws/aws-prototyping-sdk/commit/321ed85fe49b04c7487fea8cc2ccefdc4c827f63))

## 0.8.1 (2022-09-01)

### Bug Fixes

- **open-api-gateway:** make sure references to generated clients are available when spec unchanged ([#146](https://github.com/aws/aws-prototyping-sdk/issues/146)) ([bb14926](https://github.com/aws/aws-prototyping-sdk/commit/bb14926995da1876a00bfda3391742b1d0a8146a))

# 0.8.0 (2022-09-01)

### Features

- **open-api-gateway:** add lambda handler wrappers and interceptors to generated java client ([#144](https://github.com/aws/aws-prototyping-sdk/issues/144)) ([32eb329](https://github.com/aws/aws-prototyping-sdk/commit/32eb3293ef03f5682d7b0ef27b732ff490f2d272))

### BREAKING CHANGES

- **open-api-gateway:** Generated Java client methods now require .execute() to make the api call, eg
  api.sayHello(name).execute()

## 0.7.9 (2022-08-31)

### Features

- **open-api-gateway:** control re-generating clients and docs ([#138](https://github.com/aws/aws-prototyping-sdk/issues/138)) ([fe877ff](https://github.com/aws/aws-prototyping-sdk/commit/fe877ff6672ba792d09bb7d7e36ef981dbc05ed9))

## 0.7.8 (2022-08-31)

### Bug Fixes

- **open-api-gateway:** use generated json encoder to serialise schemas ([#143](https://github.com/aws/aws-prototyping-sdk/issues/143)) ([83fe023](https://github.com/aws/aws-prototyping-sdk/commit/83fe0237875321d8ffe16219e128d0f6c5692bba))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

## 0.7.3 (2022-08-23)

### Bug Fixes

- snapshots ([#134](https://github.com/aws/aws-prototyping-sdk/issues/134)) ([a07c783](https://github.com/aws/aws-prototyping-sdk/commit/a07c78373b223e0d26316213fc80fa717a0356f9))

### Features

- sigv4 middleware, cors by default for sample api ([#132](https://github.com/aws/aws-prototyping-sdk/issues/132)) ([3b391c0](https://github.com/aws/aws-prototyping-sdk/commit/3b391c0d0ad94c3909c34066cce1dd69ff55538f))

## 0.7.2 (2022-08-19)

### Bug Fixes

- **open-api-gateway:** ensure api is redeployed when integrations/authorizers change ([#130](https://github.com/aws/aws-prototyping-sdk/issues/130)) ([76f76dd](https://github.com/aws/aws-prototyping-sdk/commit/76f76dd9fc1972ee7a230ea88ac825add160e280))

# 0.7.0 (2022-08-17)

### Features

- **open-api-gateway:** stricter type enforcement for error responses in ts/python lambda handlers ([#126](https://github.com/aws/aws-prototyping-sdk/issues/126)) ([bdebc28](https://github.com/aws/aws-prototyping-sdk/commit/bdebc283c3dc737bf8412c5fbefc947efc02c1ce))

### BREAKING CHANGES

- **open-api-gateway:** lambda handler wrappers no longer accept a type parameter for errors. lambda
  handlers must return the matching response body for the status code defined in the specification.

## 0.6.1 (2022-08-15)

### Bug Fixes

- **open-api-gateway:** use correct path to spec in typed construct wrapper ([#122](https://github.com/aws/aws-prototyping-sdk/issues/122)) ([dc5395f](https://github.com/aws/aws-prototyping-sdk/commit/dc5395fe973d0b8da807c765064c44c49a5bad0a))

# 0.6.0 (2022-08-15)

### Features

- **open-api-gateway:** support larger api specs via s3-based api definition ([#120](https://github.com/aws/aws-prototyping-sdk/issues/120)) ([f28faad](https://github.com/aws/aws-prototyping-sdk/commit/f28faad9233b34938f43809eae63a87c24d929f7))

### BREAKING CHANGES

- **open-api-gateway:** construct no longer extends SpecRestApi and requires new specPath prop

## 0.5.5 (2022-08-08)

### Bug Fixes

- **open-api-gateway:** iam auth in combination with other authorizers ([#117](https://github.com/aws/aws-prototyping-sdk/issues/117)) ([6d6d813](https://github.com/aws/aws-prototyping-sdk/commit/6d6d8139c934d1f42478971401ba8ab90bf6f6d6))

## 0.5.4 (2022-08-08)

### Bug Fixes

- **open-api-gateway:** response marshalling status code ([#116](https://github.com/aws/aws-prototyping-sdk/issues/116)) ([c087dc4](https://github.com/aws/aws-prototyping-sdk/commit/c087dc493a2a068d5f5085a1db27de715db09b70))

## 0.5.3 (2022-08-05)

### Bug Fixes

- **open-api-gateway:** fix non json return type marshalling ([#115](https://github.com/aws/aws-prototyping-sdk/issues/115)) ([5053078](https://github.com/aws/aws-prototyping-sdk/commit/50530789bd776faa88b2858aa4b78e280750f626))

## 0.5.1 (2022-07-24)

### Bug Fixes

- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))

### Features

- **open-api-gateway:** support for chained request/response interceptors in typescript ([#108](https://github.com/aws/aws-prototyping-sdk/issues/108)) ([d498b83](https://github.com/aws/aws-prototyping-sdk/commit/d498b83735c30f31ae22c46833731ead05269472))

## 0.3.13 (2022-07-18)

### Features

- add support for a monorepo upgrade-deps task ([#96](https://github.com/aws/aws-prototyping-sdk/issues/96)) ([3c84956](https://github.com/aws/aws-prototyping-sdk/commit/3c84956e424162632faacbcdab4dad4c3418a7ce))

## 0.3.12 (2022-07-15)

### Bug Fixes

- ensure aspects run for Pipeline stages ([#94](https://github.com/aws/aws-prototyping-sdk/issues/94)) ([35082e0](https://github.com/aws/aws-prototyping-sdk/commit/35082e069c0ca8714a9f8b91a997bf2710a38177))

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))
- fix pipeline errors ([#90](https://github.com/aws/aws-prototyping-sdk/issues/90)) ([28c59e0](https://github.com/aws/aws-prototyping-sdk/commit/28c59e0248a7bab6cfe1e74ec1e89a7cf8b4eaee))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))

## 0.3.8 (2022-07-12)

### Bug Fixes

- improve security posture of OpenAPI construct ([#88](https://github.com/aws/aws-prototyping-sdk/issues/88)) ([86b7143](https://github.com/aws/aws-prototyping-sdk/commit/86b714339ccf5f5a1ef145312037534c664983e1))

## 0.3.7 (2022-07-12)

### Bug Fixes

- **open-api-gateway:** remove lib dir in precompile to ensure spec always updated ([#86](https://github.com/aws/aws-prototyping-sdk/issues/86)) ([5c50540](https://github.com/aws/aws-prototyping-sdk/commit/5c5054054cc21ea47405458e63b96eeca376db54))

## 0.3.2 (2022-07-07)

### Features

- **open-api-gateway:** add documentation generation support ([#79](https://github.com/aws/aws-prototyping-sdk/issues/79)) ([5f32fa0](https://github.com/aws/aws-prototyping-sdk/commit/5f32fa0b251e94efaf5d2e1fd88f009b3ee4df21)), closes [cdklabs/jsii-docgen#644](https://github.com/cdklabs/jsii-docgen/issues/644)

## 0.3.1 (2022-07-06)

### Features

- **open-api-gateway:** add operation config for java and update docs ([#78](https://github.com/aws/aws-prototyping-sdk/issues/78)) ([7420c27](https://github.com/aws/aws-prototyping-sdk/commit/7420c2750654f8bae74a6266693b75d189427271))
- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

## 0.2.18 (2022-07-04)

### Bug Fixes

- **open-api-gateway:** allow customisation of generated typescript client tsconfig ([#75](https://github.com/aws/aws-prototyping-sdk/issues/75)) ([3932610](https://github.com/aws/aws-prototyping-sdk/commit/393261051c1019fbfc1a5888fefbfa8d6534b207))

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.14 (2022-06-28)

### Features

- **open-api-gateway:** python support ([#61](https://github.com/aws/aws-prototyping-sdk/issues/61)) ([b176429](https://github.com/aws/aws-prototyping-sdk/commit/b1764292686c40c933d4755707ad76db49296c0a))

## 0.2.11 (2022-06-26)

## 0.2.7 (2022-06-22)

### Bug Fixes

- **open-api-gateway:** use projen .gitignore rather than open-api-generator ([#52](https://github.com/aws/aws-prototyping-sdk/issues/52)) ([535aaac](https://github.com/aws/aws-prototyping-sdk/commit/535aaac8bbf8dbacf3667ed5215da9b38a7805d1))

### Features

- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.2.4 (2022-06-21)

### Features

- **open-api-gateway:** add java client generation ([#50](https://github.com/aws/aws-prototyping-sdk/issues/50)) ([d663b24](https://github.com/aws/aws-prototyping-sdk/commit/d663b24ac6e16384c925fe9998d3897cb6beeca6))

## 0.2.2 (2022-06-21)

### Features

- **open-api-gateway:** add python client generation ([#46](https://github.com/aws/aws-prototyping-sdk/issues/46)) ([375cf7b](https://github.com/aws/aws-prototyping-sdk/commit/375cf7b6af308f67cca2093206a2c9500a13e38f))

# 0.2.0 (2022-06-18)

### Code Refactoring

- **open api gateway:** improve project structure ([#42](https://github.com/aws/aws-prototyping-sdk/issues/42)) ([1fda02b](https://github.com/aws/aws-prototyping-sdk/commit/1fda02b90e4591e68dcf465fe0f2c19d13f29fbe))

### BREAKING CHANGES

- **open api gateway:** Combined `specDir` and `specFileName` into a single `specFile` parameter

- docs(open-api-gateway): update readme

# 0.1.0 (2022-06-17)

### Features

- **open-api-gateway:** add support for cognito and custom authorizers ([#40](https://github.com/aws/aws-prototyping-sdk/issues/40)) ([db81ba1](https://github.com/aws/aws-prototyping-sdk/commit/db81ba1db2258645a710b9c113c68528ee127072))

### BREAKING CHANGES

- **open-api-gateway:** `authType` is no longer provided to the construct, instead `defaultAuthorizer` must
  be used.

- build: add missing package.json changes

- refactor(open-api-gateway): docs and minor refactor

- refactor(open-api-gateway): address pr comments

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- **open-api-gateway:** fix sample handler resolution, parsed spec import, and reduce generation time ([#33](https://github.com/aws/aws-prototyping-sdk/issues/33)) ([5d6c2d6](https://github.com/aws/aws-prototyping-sdk/commit/5d6c2d6cc143a02d11a3d4fefc297e265d6025b9))

## 0.0.92 (2022-06-15)

### Bug Fixes

- dyanmically determine dist version ([#32](https://github.com/aws/aws-prototyping-sdk/issues/32)) ([7963ea5](https://github.com/aws/aws-prototyping-sdk/commit/7963ea5ed656dcd22fa48925bb252001bed2f536))

### Features

- **open-api-gateway:** add package for declarative apis written in OpenAPI ([#28](https://github.com/aws/aws-prototyping-sdk/issues/28)) ([303e659](https://github.com/aws/aws-prototyping-sdk/commit/303e659d71c99a221af0dd5e68133be9080627b1))

# 1.0.0-alpha.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.5 (2022-10-31)

### Bug Fixes

- **open-api-gateway:** support primitive types in request and response body in lambda wrappers ([#193](https://github.com/aws/aws-prototyping-sdk/issues/193)) ([68a1c45](https://github.com/aws/aws-prototyping-sdk/commit/68a1c451735d9098eaeb31e83b0a729837f14aef))

## 0.12.3 (2022-10-10)

## 0.12.1 (2022-10-06)

### Bug Fixes

- **open-api-gateway:** fix python interceptor removal on successive lambda calls ([#187](https://github.com/aws/aws-prototyping-sdk/issues/187)) ([ef25dca](https://github.com/aws/aws-prototyping-sdk/commit/ef25dcaad6f9ed50f1f76a92b29895f5127fb8e0))

# 0.12.0 (2022-10-05)

### Features

- **open-api-gateway:** make service name a required property for smithy projects ([#184](https://github.com/aws/aws-prototyping-sdk/issues/184)) ([46181bb](https://github.com/aws/aws-prototyping-sdk/commit/46181bbca5500022795a4d9034c5a02ee99faa81)), closes [#176](https://github.com/aws/aws-prototyping-sdk/issues/176)

### BREAKING CHANGES

- **open-api-gateway:** serviceName is now a required property for Smithy projects. Additionally its
  components have been split into an object, for example 'example.hello#HelloService' becomes {
  namespace: 'example.hello', serviceName: 'HelloService' }

## 0.11.8 (2022-10-04)

### Bug Fixes

- **open-api-gateway:** throw error for unsupported http methods instead of silently omitting ([#182](https://github.com/aws/aws-prototyping-sdk/issues/182)) ([3fffcae](https://github.com/aws/aws-prototyping-sdk/commit/3fffcaeb122c11e94605920412026291988a358c)), closes [#179](https://github.com/aws/aws-prototyping-sdk/issues/179)

## 0.11.7 (2022-10-04)

## 0.11.6 (2022-10-03)

### Bug Fixes

- **integrations.ts:** bUG 178 - Enable aws api gateway console to invoke lambda integrations ([#180](https://github.com/aws/aws-prototyping-sdk/issues/180)) ([7524cba](https://github.com/aws/aws-prototyping-sdk/commit/7524cbaabe2d1569451e98aa93792167cdc3443d)), closes [#178](https://github.com/aws/aws-prototyping-sdk/issues/178)

## 0.11.5 (2022-10-03)

### Bug Fixes

- **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)

## 0.11.4 (2022-09-28)

### Bug Fixes

- **open-api-gateway:** fix python sample api integration ([#174](https://github.com/aws/aws-prototyping-sdk/issues/174)) ([4a0a936](https://github.com/aws/aws-prototyping-sdk/commit/4a0a936bf629b33a32f7b3cf11605d5802bcd019))

## 0.11.3 (2022-09-26)

## 0.11.1 (2022-09-19)

### Features

- **open-api-gateway:** prefer user-specified dependency versions for auto-added dependencies ([#166](https://github.com/aws/aws-prototyping-sdk/issues/166)) ([24b88dd](https://github.com/aws/aws-prototyping-sdk/commit/24b88dd03eab971090583648dbd9116ce76b1422)), closes [#164](https://github.com/aws/aws-prototyping-sdk/issues/164)

# 0.11.0 (2022-09-16)

### Features

- **open-api-gateway:** support integrations other than lambda ([#163](https://github.com/aws/aws-prototyping-sdk/issues/163)) ([cf29ab0](https://github.com/aws/aws-prototyping-sdk/commit/cf29ab06be24d5d40d771bc48ddfab3fb1ec7e10))

### BREAKING CHANGES

- **open-api-gateway:** Rename OpenApiGatewayLambdaApi construct to OpenApiGatewayRestApi. Integrations no
  longer take a 'function' prop, and instead must be given 'integration:
  Integrations.lambda(myLambda)'

## 0.10.3 (2022-09-15)

### Features

- **open-api-gateway:** clean up previously generated clients and docs ([#162](https://github.com/aws/aws-prototyping-sdk/issues/162)) ([93623b5](https://github.com/aws/aws-prototyping-sdk/commit/93623b5c2d54239f4612d0764064fb505803ff7d))

## 0.10.2 (2022-09-14)

### Bug Fixes

- **open-api-gateway:** ensure cors options request does not inherit default authorizer ([#161](https://github.com/aws/aws-prototyping-sdk/issues/161)) ([2989f17](https://github.com/aws/aws-prototyping-sdk/commit/2989f17ceb20a79507671cf2acdcd981016a45aa))

## 0.10.1 (2022-09-14)

### Features

- **open-api-gateway:** support smithy as alternative api interface definition language ([#160](https://github.com/aws/aws-prototyping-sdk/issues/160)) ([924d71c](https://github.com/aws/aws-prototyping-sdk/commit/924d71ce728600368208d8ed009e8a02a96ffaed)), closes [#145](https://github.com/aws/aws-prototyping-sdk/issues/145)

# 0.10.0 (2022-09-13)

### Bug Fixes

- **openapi tool:** upgrade python generator ([#159](https://github.com/aws/aws-prototyping-sdk/issues/159)) ([117c034](https://github.com/aws/aws-prototyping-sdk/commit/117c034e2adbd788998d0d09f79d01a040057598))

### BREAKING CHANGES

- **openapi tool:** import paths for the generated api client changed

## 0.9.4 (2022-09-12)

### Features

- **open-api-gateway:** add aws wafv2 webacl to api, enabled by default ([#153](https://github.com/aws/aws-prototyping-sdk/issues/153)) ([83c164e](https://github.com/aws/aws-prototyping-sdk/commit/83c164e583faa7ba198b60726c66dc9d0b0fa179))

## 0.9.1 (2022-09-07)

### Features

- **open-api-gateway:** add java projen project type for defining cdk infrastructure in java ([#152](https://github.com/aws/aws-prototyping-sdk/issues/152)) ([a458fae](https://github.com/aws/aws-prototyping-sdk/commit/a458fae9ce3841b945746f5f3f58fc3877787255))

# 0.9.0 (2022-09-07)

### Features

- **open-api-gateway:** typescript handler input as single object with typed event/context ([#151](https://github.com/aws/aws-prototyping-sdk/issues/151)) ([431dbec](https://github.com/aws/aws-prototyping-sdk/commit/431dbec05522383c769d6534d3a43fc7be233529))

### BREAKING CHANGES

- **open-api-gateway:** Typescript handler methods now accept a single object with input, event, context
  rather than as separate arguments.

## 0.8.5 (2022-09-05)

## 0.8.4 (2022-09-02)

### Features

- **open-api-gateway:** add python interceptor support ([#149](https://github.com/aws/aws-prototyping-sdk/issues/149)) ([1289ff2](https://github.com/aws/aws-prototyping-sdk/commit/1289ff251640b4fd9947fd8e629c2649aa69e404))

## 0.8.3 (2022-09-02)

### Bug Fixes

- **open-api-gateway:** fix bug where all clients were generated no matter requested languages ([#148](https://github.com/aws/aws-prototyping-sdk/issues/148)) ([321ed85](https://github.com/aws/aws-prototyping-sdk/commit/321ed85fe49b04c7487fea8cc2ccefdc4c827f63))

## 0.8.1 (2022-09-01)

### Bug Fixes

- **open-api-gateway:** make sure references to generated clients are available when spec unchanged ([#146](https://github.com/aws/aws-prototyping-sdk/issues/146)) ([bb14926](https://github.com/aws/aws-prototyping-sdk/commit/bb14926995da1876a00bfda3391742b1d0a8146a))

# 0.8.0 (2022-09-01)

### Features

- **open-api-gateway:** add lambda handler wrappers and interceptors to generated java client ([#144](https://github.com/aws/aws-prototyping-sdk/issues/144)) ([32eb329](https://github.com/aws/aws-prototyping-sdk/commit/32eb3293ef03f5682d7b0ef27b732ff490f2d272))

### BREAKING CHANGES

- **open-api-gateway:** Generated Java client methods now require .execute() to make the api call, eg
  api.sayHello(name).execute()

## 0.7.9 (2022-08-31)

### Features

- **open-api-gateway:** control re-generating clients and docs ([#138](https://github.com/aws/aws-prototyping-sdk/issues/138)) ([fe877ff](https://github.com/aws/aws-prototyping-sdk/commit/fe877ff6672ba792d09bb7d7e36ef981dbc05ed9))

## 0.7.8 (2022-08-31)

### Bug Fixes

- **open-api-gateway:** use generated json encoder to serialise schemas ([#143](https://github.com/aws/aws-prototyping-sdk/issues/143)) ([83fe023](https://github.com/aws/aws-prototyping-sdk/commit/83fe0237875321d8ffe16219e128d0f6c5692bba))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

## 0.7.3 (2022-08-23)

### Bug Fixes

- snapshots ([#134](https://github.com/aws/aws-prototyping-sdk/issues/134)) ([a07c783](https://github.com/aws/aws-prototyping-sdk/commit/a07c78373b223e0d26316213fc80fa717a0356f9))

### Features

- sigv4 middleware, cors by default for sample api ([#132](https://github.com/aws/aws-prototyping-sdk/issues/132)) ([3b391c0](https://github.com/aws/aws-prototyping-sdk/commit/3b391c0d0ad94c3909c34066cce1dd69ff55538f))

## 0.7.2 (2022-08-19)

### Bug Fixes

- **open-api-gateway:** ensure api is redeployed when integrations/authorizers change ([#130](https://github.com/aws/aws-prototyping-sdk/issues/130)) ([76f76dd](https://github.com/aws/aws-prototyping-sdk/commit/76f76dd9fc1972ee7a230ea88ac825add160e280))

# 0.7.0 (2022-08-17)

### Features

- **open-api-gateway:** stricter type enforcement for error responses in ts/python lambda handlers ([#126](https://github.com/aws/aws-prototyping-sdk/issues/126)) ([bdebc28](https://github.com/aws/aws-prototyping-sdk/commit/bdebc283c3dc737bf8412c5fbefc947efc02c1ce))

### BREAKING CHANGES

- **open-api-gateway:** lambda handler wrappers no longer accept a type parameter for errors. lambda
  handlers must return the matching response body for the status code defined in the specification.

## 0.6.1 (2022-08-15)

### Bug Fixes

- **open-api-gateway:** use correct path to spec in typed construct wrapper ([#122](https://github.com/aws/aws-prototyping-sdk/issues/122)) ([dc5395f](https://github.com/aws/aws-prototyping-sdk/commit/dc5395fe973d0b8da807c765064c44c49a5bad0a))

# 0.6.0 (2022-08-15)

### Features

- **open-api-gateway:** support larger api specs via s3-based api definition ([#120](https://github.com/aws/aws-prototyping-sdk/issues/120)) ([f28faad](https://github.com/aws/aws-prototyping-sdk/commit/f28faad9233b34938f43809eae63a87c24d929f7))

### BREAKING CHANGES

- **open-api-gateway:** construct no longer extends SpecRestApi and requires new specPath prop

## 0.5.5 (2022-08-08)

### Bug Fixes

- **open-api-gateway:** iam auth in combination with other authorizers ([#117](https://github.com/aws/aws-prototyping-sdk/issues/117)) ([6d6d813](https://github.com/aws/aws-prototyping-sdk/commit/6d6d8139c934d1f42478971401ba8ab90bf6f6d6))

## 0.5.4 (2022-08-08)

### Bug Fixes

- **open-api-gateway:** response marshalling status code ([#116](https://github.com/aws/aws-prototyping-sdk/issues/116)) ([c087dc4](https://github.com/aws/aws-prototyping-sdk/commit/c087dc493a2a068d5f5085a1db27de715db09b70))

## 0.5.3 (2022-08-05)

### Bug Fixes

- **open-api-gateway:** fix non json return type marshalling ([#115](https://github.com/aws/aws-prototyping-sdk/issues/115)) ([5053078](https://github.com/aws/aws-prototyping-sdk/commit/50530789bd776faa88b2858aa4b78e280750f626))

## 0.5.1 (2022-07-24)

### Bug Fixes

- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))

### Features

- **open-api-gateway:** support for chained request/response interceptors in typescript ([#108](https://github.com/aws/aws-prototyping-sdk/issues/108)) ([d498b83](https://github.com/aws/aws-prototyping-sdk/commit/d498b83735c30f31ae22c46833731ead05269472))

## 0.3.13 (2022-07-18)

### Features

- add support for a monorepo upgrade-deps task ([#96](https://github.com/aws/aws-prototyping-sdk/issues/96)) ([3c84956](https://github.com/aws/aws-prototyping-sdk/commit/3c84956e424162632faacbcdab4dad4c3418a7ce))

## 0.3.12 (2022-07-15)

### Bug Fixes

- ensure aspects run for Pipeline stages ([#94](https://github.com/aws/aws-prototyping-sdk/issues/94)) ([35082e0](https://github.com/aws/aws-prototyping-sdk/commit/35082e069c0ca8714a9f8b91a997bf2710a38177))

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))
- fix pipeline errors ([#90](https://github.com/aws/aws-prototyping-sdk/issues/90)) ([28c59e0](https://github.com/aws/aws-prototyping-sdk/commit/28c59e0248a7bab6cfe1e74ec1e89a7cf8b4eaee))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))

## 0.3.8 (2022-07-12)

### Bug Fixes

- improve security posture of OpenAPI construct ([#88](https://github.com/aws/aws-prototyping-sdk/issues/88)) ([86b7143](https://github.com/aws/aws-prototyping-sdk/commit/86b714339ccf5f5a1ef145312037534c664983e1))

## 0.3.7 (2022-07-12)

### Bug Fixes

- **open-api-gateway:** remove lib dir in precompile to ensure spec always updated ([#86](https://github.com/aws/aws-prototyping-sdk/issues/86)) ([5c50540](https://github.com/aws/aws-prototyping-sdk/commit/5c5054054cc21ea47405458e63b96eeca376db54))

## 0.3.2 (2022-07-07)

### Features

- **open-api-gateway:** add documentation generation support ([#79](https://github.com/aws/aws-prototyping-sdk/issues/79)) ([5f32fa0](https://github.com/aws/aws-prototyping-sdk/commit/5f32fa0b251e94efaf5d2e1fd88f009b3ee4df21)), closes [cdklabs/jsii-docgen#644](https://github.com/cdklabs/jsii-docgen/issues/644)

## 0.3.1 (2022-07-06)

### Features

- **open-api-gateway:** add operation config for java and update docs ([#78](https://github.com/aws/aws-prototyping-sdk/issues/78)) ([7420c27](https://github.com/aws/aws-prototyping-sdk/commit/7420c2750654f8bae74a6266693b75d189427271))
- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

## 0.2.18 (2022-07-04)

### Bug Fixes

- **open-api-gateway:** allow customisation of generated typescript client tsconfig ([#75](https://github.com/aws/aws-prototyping-sdk/issues/75)) ([3932610](https://github.com/aws/aws-prototyping-sdk/commit/393261051c1019fbfc1a5888fefbfa8d6534b207))

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.14 (2022-06-28)

### Features

- **open-api-gateway:** python support ([#61](https://github.com/aws/aws-prototyping-sdk/issues/61)) ([b176429](https://github.com/aws/aws-prototyping-sdk/commit/b1764292686c40c933d4755707ad76db49296c0a))

## 0.2.11 (2022-06-26)

## 0.2.7 (2022-06-22)

### Bug Fixes

- **open-api-gateway:** use projen .gitignore rather than open-api-generator ([#52](https://github.com/aws/aws-prototyping-sdk/issues/52)) ([535aaac](https://github.com/aws/aws-prototyping-sdk/commit/535aaac8bbf8dbacf3667ed5215da9b38a7805d1))

### Features

- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.2.4 (2022-06-21)

### Features

- **open-api-gateway:** add java client generation ([#50](https://github.com/aws/aws-prototyping-sdk/issues/50)) ([d663b24](https://github.com/aws/aws-prototyping-sdk/commit/d663b24ac6e16384c925fe9998d3897cb6beeca6))

## 0.2.2 (2022-06-21)

### Features

- **open-api-gateway:** add python client generation ([#46](https://github.com/aws/aws-prototyping-sdk/issues/46)) ([375cf7b](https://github.com/aws/aws-prototyping-sdk/commit/375cf7b6af308f67cca2093206a2c9500a13e38f))

# 0.2.0 (2022-06-18)

### Code Refactoring

- **open api gateway:** improve project structure ([#42](https://github.com/aws/aws-prototyping-sdk/issues/42)) ([1fda02b](https://github.com/aws/aws-prototyping-sdk/commit/1fda02b90e4591e68dcf465fe0f2c19d13f29fbe))

### BREAKING CHANGES

- **open api gateway:** Combined `specDir` and `specFileName` into a single `specFile` parameter

- docs(open-api-gateway): update readme

# 0.1.0 (2022-06-17)

### Features

- **open-api-gateway:** add support for cognito and custom authorizers ([#40](https://github.com/aws/aws-prototyping-sdk/issues/40)) ([db81ba1](https://github.com/aws/aws-prototyping-sdk/commit/db81ba1db2258645a710b9c113c68528ee127072))

### BREAKING CHANGES

- **open-api-gateway:** `authType` is no longer provided to the construct, instead `defaultAuthorizer` must
  be used.

- build: add missing package.json changes

- refactor(open-api-gateway): docs and minor refactor

- refactor(open-api-gateway): address pr comments

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- **open-api-gateway:** fix sample handler resolution, parsed spec import, and reduce generation time ([#33](https://github.com/aws/aws-prototyping-sdk/issues/33)) ([5d6c2d6](https://github.com/aws/aws-prototyping-sdk/commit/5d6c2d6cc143a02d11a3d4fefc297e265d6025b9))

## 0.0.92 (2022-06-15)

### Bug Fixes

- dyanmically determine dist version ([#32](https://github.com/aws/aws-prototyping-sdk/issues/32)) ([7963ea5](https://github.com/aws/aws-prototyping-sdk/commit/7963ea5ed656dcd22fa48925bb252001bed2f536))

### Features

- **open-api-gateway:** add package for declarative apis written in OpenAPI ([#28](https://github.com/aws/aws-prototyping-sdk/issues/28)) ([303e659](https://github.com/aws/aws-prototyping-sdk/commit/303e659d71c99a221af0dd5e68133be9080627b1))
