# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/aws/aws-prototyping-sdk/compare/@aws-prototyping-sdk/static-website@0.3.0...@aws-prototyping-sdk/static-website@0.3.1) (2022-11-20)

**Note:** Version bump only for package @aws-prototyping-sdk/static-website





# 0.3.0 (2022-11-20)



## 0.12.11 (2022-11-14)


### Bug Fixes

* change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)



## 0.12.6 (2022-11-03)


### Bug Fixes

* broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))



## 0.12.3 (2022-10-10)



## 0.11.7 (2022-10-04)



## 0.11.3 (2022-09-26)



## 0.9.4 (2022-09-12)



## 0.9.2 (2022-09-08)


### Bug Fixes

* change unknown routes to return as 404 instead of 403 ([#156](https://github.com/aws/aws-prototyping-sdk/issues/156)) ([df85b6e](https://github.com/aws/aws-prototyping-sdk/commit/df85b6efc1f70b81bd06f260fd85b9f680f88f3a)), closes [#69](https://github.com/aws/aws-prototyping-sdk/issues/69)



## 0.8.5 (2022-09-05)



# 0.8.0 (2022-09-01)


### Features

* **open-api-gateway:** add lambda handler wrappers and interceptors to generated java client ([#144](https://github.com/aws/aws-prototyping-sdk/issues/144)) ([32eb329](https://github.com/aws/aws-prototyping-sdk/commit/32eb3293ef03f5682d7b0ef27b732ff490f2d272))


### BREAKING CHANGES

* **open-api-gateway:** Generated Java client methods now require .execute() to make the api call, eg
api.sayHello(name).execute()



## 0.7.9 (2022-08-31)


### Features

* **open-api-gateway:** control re-generating clients and docs ([#138](https://github.com/aws/aws-prototyping-sdk/issues/138)) ([fe877ff](https://github.com/aws/aws-prototyping-sdk/commit/fe877ff6672ba792d09bb7d7e36ef981dbc05ed9))



## 0.7.4 (2022-08-23)


### Bug Fixes

* remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))



# 0.6.0 (2022-08-15)



# 0.5.0 (2022-07-21)


### Bug Fixes

* revert [#69](https://github.com/aws/aws-prototyping-sdk/issues/69) as this can expose application specific details ([#107](https://github.com/aws/aws-prototyping-sdk/issues/107)) ([f18b689](https://github.com/aws/aws-prototyping-sdk/commit/f18b6897f4220280b8cf04a066376456611fa0f6))


### BREAKING CHANGES

* Removing default error page for 403 as it can lead to the accidental leakage of information from the index.html page which otherwise would be blocked by WAF.



## 0.4.3 (2022-07-21)


### Bug Fixes

* add ipset resource to wafv2 perms policy ([#104](https://github.com/aws/aws-prototyping-sdk/issues/104)) ([9e6964b](https://github.com/aws/aws-prototyping-sdk/commit/9e6964beb59fcbf6be324e477a320e3bfa837457))



## 0.3.14 (2022-07-18)


### Bug Fixes

* add missing snap file ([#99](https://github.com/aws/aws-prototyping-sdk/issues/99)) ([373505a](https://github.com/aws/aws-prototyping-sdk/commit/373505a7ad2de675191f35517640255fe365df1b))
* disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))



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



## 0.3.6 (2022-07-12)


### Bug Fixes

* support nested stacks in CDK Nag suppressions ([#87](https://github.com/aws/aws-prototyping-sdk/issues/87)) ([ec1ef17](https://github.com/aws/aws-prototyping-sdk/commit/ec1ef177b67ebe56707ee21ddb6390885cbafd1b))



## 0.3.5 (2022-07-12)


### Bug Fixes

* improve security posture of static-website ([#85](https://github.com/aws/aws-prototyping-sdk/issues/85)) ([715f5a0](https://github.com/aws/aws-prototyping-sdk/commit/715f5a04ffc2a0b085c263053a55b3dbc9245053))



# 0.3.0 (2022-07-05)


### Bug Fixes

* add missing snap ([#77](https://github.com/aws/aws-prototyping-sdk/issues/77)) ([a04fe3f](https://github.com/aws/aws-prototyping-sdk/commit/a04fe3fd4676685be84f5dea611b1521dde1af97))


### Features

* provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))


### BREAKING CHANGES

* rename type -> cidrType in CidrAllowList

* fix: add failOnWarning to PDKNag



## 0.2.17 (2022-06-30)



## 0.2.16 (2022-06-30)



## 0.2.15 (2022-06-29)


### Bug Fixes

* add missing snap ([#71](https://github.com/aws/aws-prototyping-sdk/issues/71)) ([54903ba](https://github.com/aws/aws-prototyping-sdk/commit/54903ba2819fbd987e6cf64f6b046bd6a57c75eb))



## 0.2.11 (2022-06-26)



## 0.2.10 (2022-06-23)


### Bug Fixes

* **docs:** fail docs build when errors are thrown ([#60](https://github.com/aws/aws-prototyping-sdk/issues/60)) ([43dd2b6](https://github.com/aws/aws-prototyping-sdk/commit/43dd2b6ac240069da5d0a728394ab168e10a3327)), closes [#57](https://github.com/aws/aws-prototyping-sdk/issues/57)



## 0.2.9 (2022-06-22)


### Bug Fixes

* remove RuntimeConfig helper due to inter-dep issue ([#56](https://github.com/aws/aws-prototyping-sdk/issues/56)) ([f5bc84e](https://github.com/aws/aws-prototyping-sdk/commit/f5bc84ea236daef727b989d288c75fa4d5b33668))



## 0.2.8 (2022-06-22)


### Features

* add RuntimeConfig.fromUserIdentity helper ([#55](https://github.com/aws/aws-prototyping-sdk/issues/55)) ([fd0008b](https://github.com/aws/aws-prototyping-sdk/commit/fd0008baddef16383ae11f1028059e2d8aa45674))
* implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))



## 0.2.3 (2022-06-21)


### Bug Fixes

* Change default encryption to S3MANAGED for static website ([#48](https://github.com/aws/aws-prototyping-sdk/issues/48)) ([355b4fe](https://github.com/aws/aws-prototyping-sdk/commit/355b4fe850fb1d95ec1cc9f0538d538536ee7cc3))



## 0.0.96 (2022-06-17)


### Bug Fixes

* resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))



## 0.0.95 (2022-06-17)



## 0.0.94 (2022-06-17)



## 0.0.93 (2022-06-16)



## 0.0.86 (2022-06-09)


### Bug Fixes

* plumb through webAclProps ([7be19a7](https://github.com/aws/aws-prototyping-sdk/commit/7be19a7ff99959f6691ca244fa73ab3c3c1863f5))



## 0.0.85 (2022-06-09)


### Bug Fixes

* refactor NodeJsFunction -> Function as it requires esbuild which fails for non-ts projects ([dfe981f](https://github.com/aws/aws-prototyping-sdk/commit/dfe981f43faafe2806f027ba63b61e1ce8740396))



## 0.0.84 (2022-06-09)


### Bug Fixes

* add missing handler file to bundled js dist ([8910df3](https://github.com/aws/aws-prototyping-sdk/commit/8910df3a56e3091c242565c2630255dd80f44963))



## 0.0.83 (2022-06-09)


### Features

* add support for customizable webAcl props ([5b9d1bb](https://github.com/aws/aws-prototyping-sdk/commit/5b9d1bb96533d3b734514ffc22f457003e94165a))



## 0.0.82 (2022-06-09)


### Bug Fixes

* simplify static-website interface and encrypt buckets by default with KMS ([cfd77c0](https://github.com/aws/aws-prototyping-sdk/commit/cfd77c00ce5703f6d4bfc02a8dcb107abfdb7a63))



## 0.0.81 (2022-06-07)



## 0.0.77 (2022-06-03)


### Bug Fixes

* fix issue with OAI not being created due to invalid S3 Bucket website param ([44590e1](https://github.com/aws/aws-prototyping-sdk/commit/44590e1e29ec54f33427ec62e4cb162240b0a0f7))
* simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))



## 0.0.73 (2022-06-02)


### Features

* add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))





# 0.2.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.3 (2022-10-10)

## 0.11.7 (2022-10-04)

## 0.11.3 (2022-09-26)

## 0.9.4 (2022-09-12)

## 0.9.2 (2022-09-08)

### Bug Fixes

- change unknown routes to return as 404 instead of 403 ([#156](https://github.com/aws/aws-prototyping-sdk/issues/156)) ([df85b6e](https://github.com/aws/aws-prototyping-sdk/commit/df85b6efc1f70b81bd06f260fd85b9f680f88f3a)), closes [#69](https://github.com/aws/aws-prototyping-sdk/issues/69)

## 0.8.5 (2022-09-05)

# 0.8.0 (2022-09-01)

### Features

- **open-api-gateway:** add lambda handler wrappers and interceptors to generated java client ([#144](https://github.com/aws/aws-prototyping-sdk/issues/144)) ([32eb329](https://github.com/aws/aws-prototyping-sdk/commit/32eb3293ef03f5682d7b0ef27b732ff490f2d272))

### BREAKING CHANGES

- **open-api-gateway:** Generated Java client methods now require .execute() to make the api call, eg
  api.sayHello(name).execute()

## 0.7.9 (2022-08-31)

### Features

- **open-api-gateway:** control re-generating clients and docs ([#138](https://github.com/aws/aws-prototyping-sdk/issues/138)) ([fe877ff](https://github.com/aws/aws-prototyping-sdk/commit/fe877ff6672ba792d09bb7d7e36ef981dbc05ed9))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

# 0.6.0 (2022-08-15)

# 0.5.0 (2022-07-21)

### Bug Fixes

- revert [#69](https://github.com/aws/aws-prototyping-sdk/issues/69) as this can expose application specific details ([#107](https://github.com/aws/aws-prototyping-sdk/issues/107)) ([f18b689](https://github.com/aws/aws-prototyping-sdk/commit/f18b6897f4220280b8cf04a066376456611fa0f6))

### BREAKING CHANGES

- Removing default error page for 403 as it can lead to the accidental leakage of information from the index.html page which otherwise would be blocked by WAF.

## 0.4.3 (2022-07-21)

### Bug Fixes

- add ipset resource to wafv2 perms policy ([#104](https://github.com/aws/aws-prototyping-sdk/issues/104)) ([9e6964b](https://github.com/aws/aws-prototyping-sdk/commit/9e6964beb59fcbf6be324e477a320e3bfa837457))

## 0.3.14 (2022-07-18)

### Bug Fixes

- add missing snap file ([#99](https://github.com/aws/aws-prototyping-sdk/issues/99)) ([373505a](https://github.com/aws/aws-prototyping-sdk/commit/373505a7ad2de675191f35517640255fe365df1b))
- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))

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

## 0.3.6 (2022-07-12)

### Bug Fixes

- support nested stacks in CDK Nag suppressions ([#87](https://github.com/aws/aws-prototyping-sdk/issues/87)) ([ec1ef17](https://github.com/aws/aws-prototyping-sdk/commit/ec1ef177b67ebe56707ee21ddb6390885cbafd1b))

## 0.3.5 (2022-07-12)

### Bug Fixes

- improve security posture of static-website ([#85](https://github.com/aws/aws-prototyping-sdk/issues/85)) ([715f5a0](https://github.com/aws/aws-prototyping-sdk/commit/715f5a04ffc2a0b085c263053a55b3dbc9245053))

# 0.3.0 (2022-07-05)

### Bug Fixes

- add missing snap ([#77](https://github.com/aws/aws-prototyping-sdk/issues/77)) ([a04fe3f](https://github.com/aws/aws-prototyping-sdk/commit/a04fe3fd4676685be84f5dea611b1521dde1af97))

### Features

- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.15 (2022-06-29)

### Bug Fixes

- add missing snap ([#71](https://github.com/aws/aws-prototyping-sdk/issues/71)) ([54903ba](https://github.com/aws/aws-prototyping-sdk/commit/54903ba2819fbd987e6cf64f6b046bd6a57c75eb))

## 0.2.11 (2022-06-26)

## 0.2.10 (2022-06-23)

### Bug Fixes

- **docs:** fail docs build when errors are thrown ([#60](https://github.com/aws/aws-prototyping-sdk/issues/60)) ([43dd2b6](https://github.com/aws/aws-prototyping-sdk/commit/43dd2b6ac240069da5d0a728394ab168e10a3327)), closes [#57](https://github.com/aws/aws-prototyping-sdk/issues/57)

## 0.2.9 (2022-06-22)

### Bug Fixes

- remove RuntimeConfig helper due to inter-dep issue ([#56](https://github.com/aws/aws-prototyping-sdk/issues/56)) ([f5bc84e](https://github.com/aws/aws-prototyping-sdk/commit/f5bc84ea236daef727b989d288c75fa4d5b33668))

## 0.2.8 (2022-06-22)

### Features

- add RuntimeConfig.fromUserIdentity helper ([#55](https://github.com/aws/aws-prototyping-sdk/issues/55)) ([fd0008b](https://github.com/aws/aws-prototyping-sdk/commit/fd0008baddef16383ae11f1028059e2d8aa45674))
- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.2.3 (2022-06-21)

### Bug Fixes

- Change default encryption to S3MANAGED for static website ([#48](https://github.com/aws/aws-prototyping-sdk/issues/48)) ([355b4fe](https://github.com/aws/aws-prototyping-sdk/commit/355b4fe850fb1d95ec1cc9f0538d538536ee7cc3))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

## 0.0.93 (2022-06-16)

## 0.0.86 (2022-06-09)

### Bug Fixes

- plumb through webAclProps ([7be19a7](https://github.com/aws/aws-prototyping-sdk/commit/7be19a7ff99959f6691ca244fa73ab3c3c1863f5))

## 0.0.85 (2022-06-09)

### Bug Fixes

- refactor NodeJsFunction -> Function as it requires esbuild which fails for non-ts projects ([dfe981f](https://github.com/aws/aws-prototyping-sdk/commit/dfe981f43faafe2806f027ba63b61e1ce8740396))

## 0.0.84 (2022-06-09)

### Bug Fixes

- add missing handler file to bundled js dist ([8910df3](https://github.com/aws/aws-prototyping-sdk/commit/8910df3a56e3091c242565c2630255dd80f44963))

## 0.0.83 (2022-06-09)

### Features

- add support for customizable webAcl props ([5b9d1bb](https://github.com/aws/aws-prototyping-sdk/commit/5b9d1bb96533d3b734514ffc22f457003e94165a))

## 0.0.82 (2022-06-09)

### Bug Fixes

- simplify static-website interface and encrypt buckets by default with KMS ([cfd77c0](https://github.com/aws/aws-prototyping-sdk/commit/cfd77c00ce5703f6d4bfc02a8dcb107abfdb7a63))

## 0.0.81 (2022-06-07)

## 0.0.77 (2022-06-03)

### Bug Fixes

- fix issue with OAI not being created due to invalid S3 Bucket website param ([44590e1](https://github.com/aws/aws-prototyping-sdk/commit/44590e1e29ec54f33427ec62e4cb162240b0a0f7))
- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

## 0.0.73 (2022-06-02)

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

# 0.1.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.3 (2022-10-10)

## 0.11.7 (2022-10-04)

## 0.11.3 (2022-09-26)

## 0.9.4 (2022-09-12)

## 0.9.2 (2022-09-08)

### Bug Fixes

- change unknown routes to return as 404 instead of 403 ([#156](https://github.com/aws/aws-prototyping-sdk/issues/156)) ([df85b6e](https://github.com/aws/aws-prototyping-sdk/commit/df85b6efc1f70b81bd06f260fd85b9f680f88f3a)), closes [#69](https://github.com/aws/aws-prototyping-sdk/issues/69)

## 0.8.5 (2022-09-05)

# 0.8.0 (2022-09-01)

### Features

- **open-api-gateway:** add lambda handler wrappers and interceptors to generated java client ([#144](https://github.com/aws/aws-prototyping-sdk/issues/144)) ([32eb329](https://github.com/aws/aws-prototyping-sdk/commit/32eb3293ef03f5682d7b0ef27b732ff490f2d272))

### BREAKING CHANGES

- **open-api-gateway:** Generated Java client methods now require .execute() to make the api call, eg
  api.sayHello(name).execute()

## 0.7.9 (2022-08-31)

### Features

- **open-api-gateway:** control re-generating clients and docs ([#138](https://github.com/aws/aws-prototyping-sdk/issues/138)) ([fe877ff](https://github.com/aws/aws-prototyping-sdk/commit/fe877ff6672ba792d09bb7d7e36ef981dbc05ed9))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

# 0.6.0 (2022-08-15)

# 0.5.0 (2022-07-21)

### Bug Fixes

- revert [#69](https://github.com/aws/aws-prototyping-sdk/issues/69) as this can expose application specific details ([#107](https://github.com/aws/aws-prototyping-sdk/issues/107)) ([f18b689](https://github.com/aws/aws-prototyping-sdk/commit/f18b6897f4220280b8cf04a066376456611fa0f6))

### BREAKING CHANGES

- Removing default error page for 403 as it can lead to the accidental leakage of information from the index.html page which otherwise would be blocked by WAF.

## 0.4.3 (2022-07-21)

### Bug Fixes

- add ipset resource to wafv2 perms policy ([#104](https://github.com/aws/aws-prototyping-sdk/issues/104)) ([9e6964b](https://github.com/aws/aws-prototyping-sdk/commit/9e6964beb59fcbf6be324e477a320e3bfa837457))

## 0.3.14 (2022-07-18)

### Bug Fixes

- add missing snap file ([#99](https://github.com/aws/aws-prototyping-sdk/issues/99)) ([373505a](https://github.com/aws/aws-prototyping-sdk/commit/373505a7ad2de675191f35517640255fe365df1b))
- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))

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

## 0.3.6 (2022-07-12)

### Bug Fixes

- support nested stacks in CDK Nag suppressions ([#87](https://github.com/aws/aws-prototyping-sdk/issues/87)) ([ec1ef17](https://github.com/aws/aws-prototyping-sdk/commit/ec1ef177b67ebe56707ee21ddb6390885cbafd1b))

## 0.3.5 (2022-07-12)

### Bug Fixes

- improve security posture of static-website ([#85](https://github.com/aws/aws-prototyping-sdk/issues/85)) ([715f5a0](https://github.com/aws/aws-prototyping-sdk/commit/715f5a04ffc2a0b085c263053a55b3dbc9245053))

# 0.3.0 (2022-07-05)

### Bug Fixes

- add missing snap ([#77](https://github.com/aws/aws-prototyping-sdk/issues/77)) ([a04fe3f](https://github.com/aws/aws-prototyping-sdk/commit/a04fe3fd4676685be84f5dea611b1521dde1af97))

### Features

- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.15 (2022-06-29)

### Bug Fixes

- add missing snap ([#71](https://github.com/aws/aws-prototyping-sdk/issues/71)) ([54903ba](https://github.com/aws/aws-prototyping-sdk/commit/54903ba2819fbd987e6cf64f6b046bd6a57c75eb))

## 0.2.11 (2022-06-26)

## 0.2.10 (2022-06-23)

### Bug Fixes

- **docs:** fail docs build when errors are thrown ([#60](https://github.com/aws/aws-prototyping-sdk/issues/60)) ([43dd2b6](https://github.com/aws/aws-prototyping-sdk/commit/43dd2b6ac240069da5d0a728394ab168e10a3327)), closes [#57](https://github.com/aws/aws-prototyping-sdk/issues/57)

## 0.2.9 (2022-06-22)

### Bug Fixes

- remove RuntimeConfig helper due to inter-dep issue ([#56](https://github.com/aws/aws-prototyping-sdk/issues/56)) ([f5bc84e](https://github.com/aws/aws-prototyping-sdk/commit/f5bc84ea236daef727b989d288c75fa4d5b33668))

## 0.2.8 (2022-06-22)

### Features

- add RuntimeConfig.fromUserIdentity helper ([#55](https://github.com/aws/aws-prototyping-sdk/issues/55)) ([fd0008b](https://github.com/aws/aws-prototyping-sdk/commit/fd0008baddef16383ae11f1028059e2d8aa45674))
- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.2.3 (2022-06-21)

### Bug Fixes

- Change default encryption to S3MANAGED for static website ([#48](https://github.com/aws/aws-prototyping-sdk/issues/48)) ([355b4fe](https://github.com/aws/aws-prototyping-sdk/commit/355b4fe850fb1d95ec1cc9f0538d538536ee7cc3))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

## 0.0.93 (2022-06-16)

## 0.0.86 (2022-06-09)

### Bug Fixes

- plumb through webAclProps ([7be19a7](https://github.com/aws/aws-prototyping-sdk/commit/7be19a7ff99959f6691ca244fa73ab3c3c1863f5))

## 0.0.85 (2022-06-09)

### Bug Fixes

- refactor NodeJsFunction -> Function as it requires esbuild which fails for non-ts projects ([dfe981f](https://github.com/aws/aws-prototyping-sdk/commit/dfe981f43faafe2806f027ba63b61e1ce8740396))

## 0.0.84 (2022-06-09)

### Bug Fixes

- add missing handler file to bundled js dist ([8910df3](https://github.com/aws/aws-prototyping-sdk/commit/8910df3a56e3091c242565c2630255dd80f44963))

## 0.0.83 (2022-06-09)

### Features

- add support for customizable webAcl props ([5b9d1bb](https://github.com/aws/aws-prototyping-sdk/commit/5b9d1bb96533d3b734514ffc22f457003e94165a))

## 0.0.82 (2022-06-09)

### Bug Fixes

- simplify static-website interface and encrypt buckets by default with KMS ([cfd77c0](https://github.com/aws/aws-prototyping-sdk/commit/cfd77c00ce5703f6d4bfc02a8dcb107abfdb7a63))

## 0.0.81 (2022-06-07)

## 0.0.77 (2022-06-03)

### Bug Fixes

- fix issue with OAI not being created due to invalid S3 Bucket website param ([44590e1](https://github.com/aws/aws-prototyping-sdk/commit/44590e1e29ec54f33427ec62e4cb162240b0a0f7))
- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

## 0.0.73 (2022-06-02)

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))
