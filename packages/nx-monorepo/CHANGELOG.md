# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.3.0 (2022-11-20)



## 0.12.11 (2022-11-14)


### Bug Fixes

* change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)



## 0.12.6 (2022-11-03)


### Bug Fixes

* broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))
* **nx-monorepo:** prevent extraneous subProject node installs ([f578cb1](https://github.com/aws/aws-prototyping-sdk/commit/f578cb159ba9b4cccea84360ff55954797ec32e2))



## 0.12.4 (2022-10-13)



## 0.12.3 (2022-10-10)



## 0.12.2 (2022-10-07)


### Bug Fixes

* **nx-monorepo:** order yarn/npm/pnpm workspace packages in declaration order ([#189](https://github.com/aws/aws-prototyping-sdk/issues/189)) ([c2b1962](https://github.com/aws/aws-prototyping-sdk/commit/c2b196235c53d31d500c2fec933e80ea04b3309b)), closes [#177](https://github.com/aws/aws-prototyping-sdk/issues/177) [#177](https://github.com/aws/aws-prototyping-sdk/issues/177)



## 0.11.9 (2022-10-04)


### Features

* **nx-monorepo:** support adding custom additional packages to the yarn/npm/pnpm workspace ([#183](https://github.com/aws/aws-prototyping-sdk/issues/183)) ([a860db2](https://github.com/aws/aws-prototyping-sdk/commit/a860db25d793225507acd3d23d413a4c2812a67b)), closes [#177](https://github.com/aws/aws-prototyping-sdk/issues/177)



## 0.11.7 (2022-10-04)



## 0.11.5 (2022-10-03)


### Bug Fixes

* **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)



## 0.11.3 (2022-09-26)



## 0.11.2 (2022-09-26)


### Features

* make affected.defaultBase configurable in nx ([#169](https://github.com/aws/aws-prototyping-sdk/issues/169)) ([361d489](https://github.com/aws/aws-prototyping-sdk/commit/361d489ab4331701667fbefd03157f69a029a1f6)), closes [#167](https://github.com/aws/aws-prototyping-sdk/issues/167)



## 0.9.4 (2022-09-12)



## 0.9.3 (2022-09-08)


### Bug Fixes

* do not be prescriptive about fixed values and allow users to provide their settings ([#157](https://github.com/aws/aws-prototyping-sdk/issues/157)) ([4881808](https://github.com/aws/aws-prototyping-sdk/commit/4881808bdccb2f3e53df5fc96acc186612634bed)), closes [#154](https://github.com/aws/aws-prototyping-sdk/issues/154) [#155](https://github.com/aws/aws-prototyping-sdk/issues/155)



## 0.9.1 (2022-09-07)


### Features

* **open-api-gateway:** add java projen project type for defining cdk infrastructure in java ([#152](https://github.com/aws/aws-prototyping-sdk/issues/152)) ([a458fae](https://github.com/aws/aws-prototyping-sdk/commit/a458fae9ce3841b945746f5f3f58fc3877787255))



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



## 0.3.13 (2022-07-18)


### Features

* add support for a monorepo upgrade-deps task ([#96](https://github.com/aws/aws-prototyping-sdk/issues/96)) ([3c84956](https://github.com/aws/aws-prototyping-sdk/commit/3c84956e424162632faacbcdab4dad4c3418a7ce))



## 0.3.10 (2022-07-14)


### Bug Fixes

* add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))



## 0.3.9 (2022-07-14)


### Bug Fixes

* add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))


### Features

* improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))



## 0.3.3 (2022-07-07)



## 0.3.1 (2022-07-06)


### Features

* **open-api-gateway:** add operation config for java and update docs ([#78](https://github.com/aws/aws-prototyping-sdk/issues/78)) ([7420c27](https://github.com/aws/aws-prototyping-sdk/commit/7420c2750654f8bae74a6266693b75d189427271))



## 0.2.17 (2022-06-30)



## 0.2.16 (2022-06-30)



## 0.2.11 (2022-06-26)


### Features

* implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))



## 0.0.96 (2022-06-17)


### Bug Fixes

* resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))



## 0.0.95 (2022-06-17)



## 0.0.94 (2022-06-17)


### Bug Fixes

* refactor nx-monorepo props ([3095326](https://github.com/aws/aws-prototyping-sdk/commit/3095326dbf18e033a35854c937d30dc3bef74619))
* simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))


### Features

* add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))



## 0.0.70 (2022-05-26)



## 0.0.69 (2022-05-26)


### Bug Fixes

* add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
* resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))





# 0.2.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))
- **nx-monorepo:** prevent extraneous subProject node installs ([f578cb1](https://github.com/aws/aws-prototyping-sdk/commit/f578cb159ba9b4cccea84360ff55954797ec32e2))

## 0.12.4 (2022-10-13)

## 0.12.3 (2022-10-10)

## 0.12.2 (2022-10-07)

### Bug Fixes

- **nx-monorepo:** order yarn/npm/pnpm workspace packages in declaration order ([#189](https://github.com/aws/aws-prototyping-sdk/issues/189)) ([c2b1962](https://github.com/aws/aws-prototyping-sdk/commit/c2b196235c53d31d500c2fec933e80ea04b3309b)), closes [#177](https://github.com/aws/aws-prototyping-sdk/issues/177) [#177](https://github.com/aws/aws-prototyping-sdk/issues/177)

## 0.11.9 (2022-10-04)

### Features

- **nx-monorepo:** support adding custom additional packages to the yarn/npm/pnpm workspace ([#183](https://github.com/aws/aws-prototyping-sdk/issues/183)) ([a860db2](https://github.com/aws/aws-prototyping-sdk/commit/a860db25d793225507acd3d23d413a4c2812a67b)), closes [#177](https://github.com/aws/aws-prototyping-sdk/issues/177)

## 0.11.7 (2022-10-04)

## 0.11.5 (2022-10-03)

### Bug Fixes

- **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)

## 0.11.3 (2022-09-26)

## 0.11.2 (2022-09-26)

### Features

- make affected.defaultBase configurable in nx ([#169](https://github.com/aws/aws-prototyping-sdk/issues/169)) ([361d489](https://github.com/aws/aws-prototyping-sdk/commit/361d489ab4331701667fbefd03157f69a029a1f6)), closes [#167](https://github.com/aws/aws-prototyping-sdk/issues/167)

## 0.9.4 (2022-09-12)

## 0.9.3 (2022-09-08)

### Bug Fixes

- do not be prescriptive about fixed values and allow users to provide their settings ([#157](https://github.com/aws/aws-prototyping-sdk/issues/157)) ([4881808](https://github.com/aws/aws-prototyping-sdk/commit/4881808bdccb2f3e53df5fc96acc186612634bed)), closes [#154](https://github.com/aws/aws-prototyping-sdk/issues/154) [#155](https://github.com/aws/aws-prototyping-sdk/issues/155)

## 0.9.1 (2022-09-07)

### Features

- **open-api-gateway:** add java projen project type for defining cdk infrastructure in java ([#152](https://github.com/aws/aws-prototyping-sdk/issues/152)) ([a458fae](https://github.com/aws/aws-prototyping-sdk/commit/a458fae9ce3841b945746f5f3f58fc3877787255))

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

## 0.3.13 (2022-07-18)

### Features

- add support for a monorepo upgrade-deps task ([#96](https://github.com/aws/aws-prototyping-sdk/issues/96)) ([3c84956](https://github.com/aws/aws-prototyping-sdk/commit/3c84956e424162632faacbcdab4dad4c3418a7ce))

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))

## 0.3.3 (2022-07-07)

## 0.3.1 (2022-07-06)

### Features

- **open-api-gateway:** add operation config for java and update docs ([#78](https://github.com/aws/aws-prototyping-sdk/issues/78)) ([7420c27](https://github.com/aws/aws-prototyping-sdk/commit/7420c2750654f8bae74a6266693b75d189427271))

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.11 (2022-06-26)

### Features

- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- refactor nx-monorepo props ([3095326](https://github.com/aws/aws-prototyping-sdk/commit/3095326dbf18e033a35854c937d30dc3bef74619))
- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

## 0.0.70 (2022-05-26)

## 0.0.69 (2022-05-26)

### Bug Fixes

- add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
- resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))

# 0.1.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))
- **nx-monorepo:** prevent extraneous subProject node installs ([f578cb1](https://github.com/aws/aws-prototyping-sdk/commit/f578cb159ba9b4cccea84360ff55954797ec32e2))

## 0.12.4 (2022-10-13)

## 0.12.3 (2022-10-10)

## 0.12.2 (2022-10-07)

### Bug Fixes

- **nx-monorepo:** order yarn/npm/pnpm workspace packages in declaration order ([#189](https://github.com/aws/aws-prototyping-sdk/issues/189)) ([c2b1962](https://github.com/aws/aws-prototyping-sdk/commit/c2b196235c53d31d500c2fec933e80ea04b3309b)), closes [#177](https://github.com/aws/aws-prototyping-sdk/issues/177) [#177](https://github.com/aws/aws-prototyping-sdk/issues/177)

## 0.11.9 (2022-10-04)

### Features

- **nx-monorepo:** support adding custom additional packages to the yarn/npm/pnpm workspace ([#183](https://github.com/aws/aws-prototyping-sdk/issues/183)) ([a860db2](https://github.com/aws/aws-prototyping-sdk/commit/a860db25d793225507acd3d23d413a4c2812a67b)), closes [#177](https://github.com/aws/aws-prototyping-sdk/issues/177)

## 0.11.7 (2022-10-04)

## 0.11.5 (2022-10-03)

### Bug Fixes

- **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)

## 0.11.3 (2022-09-26)

## 0.11.2 (2022-09-26)

### Features

- make affected.defaultBase configurable in nx ([#169](https://github.com/aws/aws-prototyping-sdk/issues/169)) ([361d489](https://github.com/aws/aws-prototyping-sdk/commit/361d489ab4331701667fbefd03157f69a029a1f6)), closes [#167](https://github.com/aws/aws-prototyping-sdk/issues/167)

## 0.9.4 (2022-09-12)

## 0.9.3 (2022-09-08)

### Bug Fixes

- do not be prescriptive about fixed values and allow users to provide their settings ([#157](https://github.com/aws/aws-prototyping-sdk/issues/157)) ([4881808](https://github.com/aws/aws-prototyping-sdk/commit/4881808bdccb2f3e53df5fc96acc186612634bed)), closes [#154](https://github.com/aws/aws-prototyping-sdk/issues/154) [#155](https://github.com/aws/aws-prototyping-sdk/issues/155)

## 0.9.1 (2022-09-07)

### Features

- **open-api-gateway:** add java projen project type for defining cdk infrastructure in java ([#152](https://github.com/aws/aws-prototyping-sdk/issues/152)) ([a458fae](https://github.com/aws/aws-prototyping-sdk/commit/a458fae9ce3841b945746f5f3f58fc3877787255))

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

## 0.3.13 (2022-07-18)

### Features

- add support for a monorepo upgrade-deps task ([#96](https://github.com/aws/aws-prototyping-sdk/issues/96)) ([3c84956](https://github.com/aws/aws-prototyping-sdk/commit/3c84956e424162632faacbcdab4dad4c3418a7ce))

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))

## 0.3.3 (2022-07-07)

## 0.3.1 (2022-07-06)

### Features

- **open-api-gateway:** add operation config for java and update docs ([#78](https://github.com/aws/aws-prototyping-sdk/issues/78)) ([7420c27](https://github.com/aws/aws-prototyping-sdk/commit/7420c2750654f8bae74a6266693b75d189427271))

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.11 (2022-06-26)

### Features

- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- refactor nx-monorepo props ([3095326](https://github.com/aws/aws-prototyping-sdk/commit/3095326dbf18e033a35854c937d30dc3bef74619))
- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

## 0.0.70 (2022-05-26)

## 0.0.69 (2022-05-26)

### Bug Fixes

- add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
- resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))
