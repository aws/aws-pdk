# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/aws/aws-prototyping-sdk/compare/@aws-prototyping-sdk/identity@0.3.0...@aws-prototyping-sdk/identity@0.3.1) (2022-11-20)

**Note:** Version bump only for package @aws-prototyping-sdk/identity





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



## 0.5.2 (2022-07-25)


### Bug Fixes

* disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))
* **identity:** reference web client in identity pool ([#110](https://github.com/aws/aws-prototyping-sdk/issues/110)) ([aeab868](https://github.com/aws/aws-prototyping-sdk/commit/aeab868b2f0f580d0e26994f0722b878db47badb))



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



## 0.3.4 (2022-07-11)


### Bug Fixes

* enable MFA and verification for identity construct ([#83](https://github.com/aws/aws-prototyping-sdk/issues/83)) ([15cf838](https://github.com/aws/aws-prototyping-sdk/commit/15cf838063c9ec3686745b16d8e58a0bd8da53e4))


### Features

* provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))


### BREAKING CHANGES

* rename type -> cidrType in CidrAllowList

* fix: add failOnWarning to PDKNag



## 0.2.17 (2022-06-30)



## 0.2.16 (2022-06-30)



## 0.2.11 (2022-06-26)



## 0.2.8 (2022-06-22)


### Features

* add RuntimeConfig.fromUserIdentity helper ([#55](https://github.com/aws/aws-prototyping-sdk/issues/55)) ([fd0008b](https://github.com/aws/aws-prototyping-sdk/commit/fd0008baddef16383ae11f1028059e2d8aa45674))
* implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))



## 0.0.96 (2022-06-17)


### Bug Fixes

* resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))



## 0.0.95 (2022-06-17)



## 0.0.94 (2022-06-17)


### Bug Fixes

* simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))



## 0.0.73 (2022-06-02)





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

## 0.5.2 (2022-07-25)

### Bug Fixes

- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))
- **identity:** reference web client in identity pool ([#110](https://github.com/aws/aws-prototyping-sdk/issues/110)) ([aeab868](https://github.com/aws/aws-prototyping-sdk/commit/aeab868b2f0f580d0e26994f0722b878db47badb))

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

## 0.3.4 (2022-07-11)

### Bug Fixes

- enable MFA and verification for identity construct ([#83](https://github.com/aws/aws-prototyping-sdk/issues/83)) ([15cf838](https://github.com/aws/aws-prototyping-sdk/commit/15cf838063c9ec3686745b16d8e58a0bd8da53e4))

### Features

- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.11 (2022-06-26)

## 0.2.8 (2022-06-22)

### Features

- add RuntimeConfig.fromUserIdentity helper ([#55](https://github.com/aws/aws-prototyping-sdk/issues/55)) ([fd0008b](https://github.com/aws/aws-prototyping-sdk/commit/fd0008baddef16383ae11f1028059e2d8aa45674))
- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

## 0.0.73 (2022-06-02)

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

## 0.5.2 (2022-07-25)

### Bug Fixes

- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))
- **identity:** reference web client in identity pool ([#110](https://github.com/aws/aws-prototyping-sdk/issues/110)) ([aeab868](https://github.com/aws/aws-prototyping-sdk/commit/aeab868b2f0f580d0e26994f0722b878db47badb))

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

## 0.3.4 (2022-07-11)

### Bug Fixes

- enable MFA and verification for identity construct ([#83](https://github.com/aws/aws-prototyping-sdk/issues/83)) ([15cf838](https://github.com/aws/aws-prototyping-sdk/commit/15cf838063c9ec3686745b16d8e58a0bd8da53e4))

### Features

- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.11 (2022-06-26)

## 0.2.8 (2022-06-22)

### Features

- add RuntimeConfig.fromUserIdentity helper ([#55](https://github.com/aws/aws-prototyping-sdk/issues/55)) ([fd0008b](https://github.com/aws/aws-prototyping-sdk/commit/fd0008baddef16383ae11f1028059e2d8aa45674))
- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

## 0.0.73 (2022-06-02)
