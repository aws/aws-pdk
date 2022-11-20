# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/aws/aws-prototyping-sdk/compare/@aws-prototyping-sdk/pipeline@0.3.0...@aws-prototyping-sdk/pipeline@0.3.1) (2022-11-20)

**Note:** Version bump only for package @aws-prototyping-sdk/pipeline





# 0.3.0 (2022-11-20)



## 0.12.11 (2022-11-14)


### Bug Fixes

* change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)
* **pdk-pipeline:** resolve artifact bucket not having KMS key for cross account keys ([#201](https://github.com/aws/aws-prototyping-sdk/issues/201)) ([f7bbc82](https://github.com/aws/aws-prototyping-sdk/commit/f7bbc82178e7673092d3c5f11f9f3aca6d3bb092))



## 0.12.6 (2022-11-03)


### Bug Fixes

* broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))



## 0.12.3 (2022-10-10)



## 0.11.7 (2022-10-04)



## 0.11.5 (2022-10-03)


### Bug Fixes

* **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)



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



## 0.7.7 (2022-08-30)


### Bug Fixes

* broken python builds when rooted under monorepo ([#142](https://github.com/aws/aws-prototyping-sdk/issues/142)) ([bbb64da](https://github.com/aws/aws-prototyping-sdk/commit/bbb64da4aa3aabec82e5e9309d1dcf9ef02e6452))



## 0.7.4 (2022-08-23)


### Bug Fixes

* remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))



## 0.6.2 (2022-08-16)


### Bug Fixes

* add missing snap ([#125](https://github.com/aws/aws-prototyping-sdk/issues/125)) ([392fb8c](https://github.com/aws/aws-prototyping-sdk/commit/392fb8c483a99123d4e8a8b6b95b5aa7ecb014b8))
* add pytest dep ([#123](https://github.com/aws/aws-prototyping-sdk/issues/123)) ([4767d81](https://github.com/aws/aws-prototyping-sdk/commit/4767d81cc6e8d0a4f9e74a282d5fe7916cfee42e))
* python bootstrap issues ([#124](https://github.com/aws/aws-prototyping-sdk/issues/124)) ([aabb8de](https://github.com/aws/aws-prototyping-sdk/commit/aabb8dea7c5ab14ad86a6904ad3039f23aa35611))



# 0.6.0 (2022-08-15)



## 0.3.14 (2022-07-18)


### Bug Fixes

* add missing snap file ([#99](https://github.com/aws/aws-prototyping-sdk/issues/99)) ([373505a](https://github.com/aws/aws-prototyping-sdk/commit/373505a7ad2de675191f35517640255fe365df1b))
* disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))



## 0.3.12 (2022-07-15)


### Bug Fixes

* ensure aspects run for Pipeline stages ([#94](https://github.com/aws/aws-prototyping-sdk/issues/94)) ([35082e0](https://github.com/aws/aws-prototyping-sdk/commit/35082e069c0ca8714a9f8b91a997bf2710a38177))



## 0.3.11 (2022-07-14)


### Bug Fixes

* resolve nag errors for sonar scanner ([#93](https://github.com/aws/aws-prototyping-sdk/issues/93)) ([a91e076](https://github.com/aws/aws-prototyping-sdk/commit/a91e076df45fd43d4495368fc06ff9d5233fbc62))



## 0.3.10 (2022-07-14)


### Bug Fixes

* add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))



## 0.3.9 (2022-07-14)


### Bug Fixes

* add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))
* fix pipeline errors ([#90](https://github.com/aws/aws-prototyping-sdk/issues/90)) ([28c59e0](https://github.com/aws/aws-prototyping-sdk/commit/28c59e0248a7bab6cfe1e74ec1e89a7cf8b4eaee))


### Features

* improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))
* provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))


### BREAKING CHANGES

* rename type -> cidrType in CidrAllowList

* fix: add failOnWarning to PDKNag



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

* add missing snapshot ([2bf8d7f](https://github.com/aws/aws-prototyping-sdk/commit/2bf8d7f0ee7a99cf63736cd912bb6f6e66560295))



## 0.0.83 (2022-06-09)


### Features

* add support for customizable webAcl props ([5b9d1bb](https://github.com/aws/aws-prototyping-sdk/commit/5b9d1bb96533d3b734514ffc22f457003e94165a))



## 0.0.75 (2022-06-03)


### Bug Fixes

* checkin updated pipeline ts snapshot ([0d3f370](https://github.com/aws/aws-prototyping-sdk/commit/0d3f370c6b3510976aeb7059b8e9140420b82d26))
* simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))


### Features

* add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))



## 0.0.70 (2022-05-26)



## 0.0.69 (2022-05-26)


### Bug Fixes

* add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
* resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))
* resolve issue with self mutation ([178d552](https://github.com/aws/aws-prototyping-sdk/commit/178d5523eabeb8c31e49f9bc718ba784c184789a))





# 0.2.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)
- **pdk-pipeline:** resolve artifact bucket not having KMS key for cross account keys ([#201](https://github.com/aws/aws-prototyping-sdk/issues/201)) ([f7bbc82](https://github.com/aws/aws-prototyping-sdk/commit/f7bbc82178e7673092d3c5f11f9f3aca6d3bb092))

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.3 (2022-10-10)

## 0.11.7 (2022-10-04)

## 0.11.5 (2022-10-03)

### Bug Fixes

- **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)

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

## 0.7.7 (2022-08-30)

### Bug Fixes

- broken python builds when rooted under monorepo ([#142](https://github.com/aws/aws-prototyping-sdk/issues/142)) ([bbb64da](https://github.com/aws/aws-prototyping-sdk/commit/bbb64da4aa3aabec82e5e9309d1dcf9ef02e6452))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

## 0.6.2 (2022-08-16)

### Bug Fixes

- add missing snap ([#125](https://github.com/aws/aws-prototyping-sdk/issues/125)) ([392fb8c](https://github.com/aws/aws-prototyping-sdk/commit/392fb8c483a99123d4e8a8b6b95b5aa7ecb014b8))
- add pytest dep ([#123](https://github.com/aws/aws-prototyping-sdk/issues/123)) ([4767d81](https://github.com/aws/aws-prototyping-sdk/commit/4767d81cc6e8d0a4f9e74a282d5fe7916cfee42e))
- python bootstrap issues ([#124](https://github.com/aws/aws-prototyping-sdk/issues/124)) ([aabb8de](https://github.com/aws/aws-prototyping-sdk/commit/aabb8dea7c5ab14ad86a6904ad3039f23aa35611))

# 0.6.0 (2022-08-15)

## 0.3.14 (2022-07-18)

### Bug Fixes

- add missing snap file ([#99](https://github.com/aws/aws-prototyping-sdk/issues/99)) ([373505a](https://github.com/aws/aws-prototyping-sdk/commit/373505a7ad2de675191f35517640255fe365df1b))
- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))

## 0.3.12 (2022-07-15)

### Bug Fixes

- ensure aspects run for Pipeline stages ([#94](https://github.com/aws/aws-prototyping-sdk/issues/94)) ([35082e0](https://github.com/aws/aws-prototyping-sdk/commit/35082e069c0ca8714a9f8b91a997bf2710a38177))

## 0.3.11 (2022-07-14)

### Bug Fixes

- resolve nag errors for sonar scanner ([#93](https://github.com/aws/aws-prototyping-sdk/issues/93)) ([a91e076](https://github.com/aws/aws-prototyping-sdk/commit/a91e076df45fd43d4495368fc06ff9d5233fbc62))

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))
- fix pipeline errors ([#90](https://github.com/aws/aws-prototyping-sdk/issues/90)) ([28c59e0](https://github.com/aws/aws-prototyping-sdk/commit/28c59e0248a7bab6cfe1e74ec1e89a7cf8b4eaee))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))
- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

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

- add missing snapshot ([2bf8d7f](https://github.com/aws/aws-prototyping-sdk/commit/2bf8d7f0ee7a99cf63736cd912bb6f6e66560295))

## 0.0.83 (2022-06-09)

### Features

- add support for customizable webAcl props ([5b9d1bb](https://github.com/aws/aws-prototyping-sdk/commit/5b9d1bb96533d3b734514ffc22f457003e94165a))

## 0.0.75 (2022-06-03)

### Bug Fixes

- checkin updated pipeline ts snapshot ([0d3f370](https://github.com/aws/aws-prototyping-sdk/commit/0d3f370c6b3510976aeb7059b8e9140420b82d26))
- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

## 0.0.70 (2022-05-26)

## 0.0.69 (2022-05-26)

### Bug Fixes

- add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
- resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))
- resolve issue with self mutation ([178d552](https://github.com/aws/aws-prototyping-sdk/commit/178d5523eabeb8c31e49f9bc718ba784c184789a))

# 0.1.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)
- **pdk-pipeline:** resolve artifact bucket not having KMS key for cross account keys ([#201](https://github.com/aws/aws-prototyping-sdk/issues/201)) ([f7bbc82](https://github.com/aws/aws-prototyping-sdk/commit/f7bbc82178e7673092d3c5f11f9f3aca6d3bb092))

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.3 (2022-10-10)

## 0.11.7 (2022-10-04)

## 0.11.5 (2022-10-03)

### Bug Fixes

- **nx-monorepo:** run python install sequentially in dependency order ([#175](https://github.com/aws/aws-prototyping-sdk/issues/175)) ([d36dbb7](https://github.com/aws/aws-prototyping-sdk/commit/d36dbb704e4515cc8d15da842e8be8eb11510b1d)), closes [#171](https://github.com/aws/aws-prototyping-sdk/issues/171)

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

## 0.7.7 (2022-08-30)

### Bug Fixes

- broken python builds when rooted under monorepo ([#142](https://github.com/aws/aws-prototyping-sdk/issues/142)) ([bbb64da](https://github.com/aws/aws-prototyping-sdk/commit/bbb64da4aa3aabec82e5e9309d1dcf9ef02e6452))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

## 0.6.2 (2022-08-16)

### Bug Fixes

- add missing snap ([#125](https://github.com/aws/aws-prototyping-sdk/issues/125)) ([392fb8c](https://github.com/aws/aws-prototyping-sdk/commit/392fb8c483a99123d4e8a8b6b95b5aa7ecb014b8))
- add pytest dep ([#123](https://github.com/aws/aws-prototyping-sdk/issues/123)) ([4767d81](https://github.com/aws/aws-prototyping-sdk/commit/4767d81cc6e8d0a4f9e74a282d5fe7916cfee42e))
- python bootstrap issues ([#124](https://github.com/aws/aws-prototyping-sdk/issues/124)) ([aabb8de](https://github.com/aws/aws-prototyping-sdk/commit/aabb8dea7c5ab14ad86a6904ad3039f23aa35611))

# 0.6.0 (2022-08-15)

## 0.3.14 (2022-07-18)

### Bug Fixes

- add missing snap file ([#99](https://github.com/aws/aws-prototyping-sdk/issues/99)) ([373505a](https://github.com/aws/aws-prototyping-sdk/commit/373505a7ad2de675191f35517640255fe365df1b))
- disable workspace resolution in syncpack ([#98](https://github.com/aws/aws-prototyping-sdk/issues/98)) ([f18daae](https://github.com/aws/aws-prototyping-sdk/commit/f18daae93d1fcf0f87b976552c71e2c3e8525e84))

## 0.3.12 (2022-07-15)

### Bug Fixes

- ensure aspects run for Pipeline stages ([#94](https://github.com/aws/aws-prototyping-sdk/issues/94)) ([35082e0](https://github.com/aws/aws-prototyping-sdk/commit/35082e069c0ca8714a9f8b91a997bf2710a38177))

## 0.3.11 (2022-07-14)

### Bug Fixes

- resolve nag errors for sonar scanner ([#93](https://github.com/aws/aws-prototyping-sdk/issues/93)) ([a91e076](https://github.com/aws/aws-prototyping-sdk/commit/a91e076df45fd43d4495368fc06ff9d5233fbc62))

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))
- fix pipeline errors ([#90](https://github.com/aws/aws-prototyping-sdk/issues/90)) ([28c59e0](https://github.com/aws/aws-prototyping-sdk/commit/28c59e0248a7bab6cfe1e74ec1e89a7cf8b4eaee))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))
- provide PDKNag util ([#73](https://github.com/aws/aws-prototyping-sdk/issues/73)) ([be8e113](https://github.com/aws/aws-prototyping-sdk/commit/be8e1130e7564ecbe1e3a7cc925e90945f6866d4))

### BREAKING CHANGES

- rename type -> cidrType in CidrAllowList

- fix: add failOnWarning to PDKNag

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

- add missing snapshot ([2bf8d7f](https://github.com/aws/aws-prototyping-sdk/commit/2bf8d7f0ee7a99cf63736cd912bb6f6e66560295))

## 0.0.83 (2022-06-09)

### Features

- add support for customizable webAcl props ([5b9d1bb](https://github.com/aws/aws-prototyping-sdk/commit/5b9d1bb96533d3b734514ffc22f457003e94165a))

## 0.0.75 (2022-06-03)

### Bug Fixes

- checkin updated pipeline ts snapshot ([0d3f370](https://github.com/aws/aws-prototyping-sdk/commit/0d3f370c6b3510976aeb7059b8e9140420b82d26))
- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

## 0.0.70 (2022-05-26)

## 0.0.69 (2022-05-26)

### Bug Fixes

- add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
- resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))
- resolve issue with self mutation ([178d552](https://github.com/aws/aws-prototyping-sdk/commit/178d5523eabeb8c31e49f9bc718ba784c184789a))
