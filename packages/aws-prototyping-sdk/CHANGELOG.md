# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/aws/aws-prototyping-sdk/compare/aws-prototyping-sdk@0.3.0...aws-prototyping-sdk@0.3.1) (2022-11-20)

**Note:** Version bump only for package aws-prototyping-sdk





# 0.3.0 (2022-11-20)



## 0.12.11 (2022-11-14)


### Bug Fixes

* change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)



## 0.12.6 (2022-11-03)


### Bug Fixes

* broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))



## 0.12.4 (2022-10-13)



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



## 0.3.10 (2022-07-14)


### Bug Fixes

* add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))



## 0.3.9 (2022-07-14)


### Bug Fixes

* add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))


### Features

* improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))



## 0.2.17 (2022-06-30)



## 0.2.16 (2022-06-30)



## 0.2.13 (2022-06-28)


### Bug Fixes

* fix bundling to support inter-dependencies ([#64](https://github.com/aws/aws-prototyping-sdk/issues/64)) ([d62db29](https://github.com/aws/aws-prototyping-sdk/commit/d62db29f4365cedbd4a65ab39400428d00223a4e)), closes [#58](https://github.com/aws/aws-prototyping-sdk/issues/58)



## 0.2.11 (2022-06-26)


### Features

* implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))



## 0.0.96 (2022-06-17)


### Bug Fixes

* resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))



## 0.0.95 (2022-06-17)



## 0.0.94 (2022-06-17)


### Bug Fixes

* don't delete prettier files from aws-prototyping-sdk ([15e1e66](https://github.com/aws/aws-prototyping-sdk/commit/15e1e666deaa20585a5b48289e425d61ef73206d))



## 0.0.81 (2022-06-07)



## 0.0.78 (2022-06-06)



## 0.0.76 (2022-06-03)


### Bug Fixes

* simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))



## 0.0.74 (2022-06-02)


### Features

* add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))



## 0.0.72 (2022-05-30)


### Bug Fixes

* refactor nx-monorepo props ([3095326](https://github.com/aws/aws-prototyping-sdk/commit/3095326dbf18e033a35854c937d30dc3bef74619))
* resolve issue with release:mainline failing due to incorrect version of package ([aad2330](https://github.com/aws/aws-prototyping-sdk/commit/aad2330449a4e35f38da5f3b98a7e55adbc9322b))



## 0.0.71 (2022-05-30)


### Bug Fixes

* add missing scripts folder ([bb19590](https://github.com/aws/aws-prototyping-sdk/commit/bb19590818ebe1c4fe722a7e1cb69c676a32c18b))



## 0.0.70 (2022-05-26)



## 0.0.69 (2022-05-26)


### Bug Fixes

* add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
* resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))



## 0.0.67 (2022-05-18)


### Features

* add support for noHoistGlobs in Nx Monorepo. Additionally add PDKProject boilerplate ([e39b751](https://github.com/aws/aws-prototyping-sdk/commit/e39b751367b7a7edab0ac84514220ecbaed5a480))



## 0.0.66 (2022-05-17)


### Bug Fixes

* fix issue with broken monorepo tests ([fd61ef0](https://github.com/aws/aws-prototyping-sdk/commit/fd61ef0ed034d57d25aabfd55714370d67383459))



## 0.0.63 (2022-05-16)



## 0.0.62 (2022-05-13)


### Bug Fixes

* make python tests dynamic ([3cb2261](https://github.com/aws/aws-prototyping-sdk/commit/3cb226129a09528d09ac49aa6280c16c9a76d3b0))
* remove unused test ([e143001](https://github.com/aws/aws-prototyping-sdk/commit/e143001883af21e26289dd4c240e2f7ef3d02a0b))
* revert back to correct exports ([f3c66bd](https://github.com/aws/aws-prototyping-sdk/commit/f3c66bd27531cc69b0a434c6eac9fa34ac5d43d7))
* update Java pipeline project to resolve sample issues ([c8592fc](https://github.com/aws/aws-prototyping-sdk/commit/c8592fc9419aae1dd3223c080cd6d5cd496618f3))



## 0.0.60 (2022-05-11)


### Bug Fixes

* fix bug when specifying python entrypoint ([1cb0267](https://github.com/aws/aws-prototyping-sdk/commit/1cb026740dbe1a028499991ba17e3149bdcab190))



## 0.0.59 (2022-05-11)



## 0.0.58 (2022-05-11)


### Bug Fixes

* remove monorepo sample code ([58534ab](https://github.com/aws/aws-prototyping-sdk/commit/58534aba2537ba5ea75e7aa5020f4976e351b3a9))
* update deps for pipeline projects ([6a8a58f](https://github.com/aws/aws-prototyping-sdk/commit/6a8a58f71acd1d3acf8676c2bbed858b59d86c56))



## 0.0.55 (2022-04-28)


### Reverts

* Revert "build: skip building pdk_projen submodule for non ts languages" ([4e96efb](https://github.com/aws/aws-prototyping-sdk/commit/4e96efb5a809a5b447afa1c7277aedf452f3d909))



## 0.0.54 (2022-04-28)



## 0.0.52 (2022-03-10)


### Bug Fixes

* remove dependency on git from sonar project ([2d2c913](https://github.com/aws/aws-prototyping-sdk/commit/2d2c9130e66a0f27e454a459237da7aff894c5d8))



## 0.0.51 (2022-03-10)


### Bug Fixes

* fix path ([9761334](https://github.com/aws/aws-prototyping-sdk/commit/976133416925c50b263b69370bb80e01fb1caf81))



## 0.0.50 (2022-03-10)


### Bug Fixes

* add global install of cdk to sonar build project ([5daace8](https://github.com/aws/aws-prototyping-sdk/commit/5daace89a3f4053a863e08f35671e861df230c8e))



## 0.0.49 (2022-03-10)


### Bug Fixes

* fix typos in sonar scripts ([0eb61c0](https://github.com/aws/aws-prototyping-sdk/commit/0eb61c05f67ac0ff8a3043cf67d28ae392a75e6b))



## 0.0.48 (2022-03-10)


### Bug Fixes

* fix issue with args in cube ([50af1de](https://github.com/aws/aws-prototyping-sdk/commit/50af1dea5fc4178c8264f134c7283aa964723d9d))


### Features

* make sonar config configurable for inclusions/exclusions ([3cccae8](https://github.com/aws/aws-prototyping-sdk/commit/3cccae89961f290dd953bca910b1fec253fcc6b2))



## 0.0.46 (2022-03-09)


### Bug Fixes

* fix issue with reports not generating correctly ([55263bc](https://github.com/aws/aws-prototyping-sdk/commit/55263bc8d20b3f35ef5efae5999df8d7c07b7171))
* fix upgrade target for monorepo ([423c5c1](https://github.com/aws/aws-prototyping-sdk/commit/423c5c13e15855b1df72ef627d1cdc6a8d800d80))



## 0.0.44 (2022-03-09)


### Bug Fixes

* pass in codeCommitRemovalPolicy to PDKPipeline ([1eedc69](https://github.com/aws/aws-prototyping-sdk/commit/1eedc69ca3d469363fe2ae7f6dd1321a53d44d5d))


### Features

* emit the secretArn from the code scanner ([632a65a](https://github.com/aws/aws-prototyping-sdk/commit/632a65a0afba22f691beae90063444b3116e0448))



## 0.0.39 (2022-03-08)


### Bug Fixes

* move context retrival into samples ([34b50cf](https://github.com/aws/aws-prototyping-sdk/commit/34b50cf738c29e22b9ffd73c3ca2f47155d8484d))



## 0.0.38 (2022-03-08)


### Features

* add support for generating Java projects :) ([d59497d](https://github.com/aws/aws-prototyping-sdk/commit/d59497ded9a5d65a719254c964d5203d67d5f639))
* add support for SonarCodeScanner ([2066ecc](https://github.com/aws/aws-prototyping-sdk/commit/2066ecc5537b90d7f1cfed81cdc0a53a4ad84901))
* emit synth project ARN from PDKPipeline ([a569d70](https://github.com/aws/aws-prototyping-sdk/commit/a569d70ac575c1da7b7cbf5aee9b33bc5866f2ed))



## 0.0.34 (2022-03-05)



## 0.0.32 (2022-03-04)



## 0.0.31 (2022-03-04)



## 0.0.30 (2022-03-04)



## 0.0.29 (2022-03-04)



## 0.0.28 (2022-03-04)



## 0.0.27 (2022-03-04)



## 0.0.26 (2022-03-04)





# 0.2.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.4 (2022-10-13)

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

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.13 (2022-06-28)

### Bug Fixes

- fix bundling to support inter-dependencies ([#64](https://github.com/aws/aws-prototyping-sdk/issues/64)) ([d62db29](https://github.com/aws/aws-prototyping-sdk/commit/d62db29f4365cedbd4a65ab39400428d00223a4e)), closes [#58](https://github.com/aws/aws-prototyping-sdk/issues/58)

## 0.2.11 (2022-06-26)

### Features

- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- don't delete prettier files from aws-prototyping-sdk ([15e1e66](https://github.com/aws/aws-prototyping-sdk/commit/15e1e666deaa20585a5b48289e425d61ef73206d))

## 0.0.81 (2022-06-07)

## 0.0.78 (2022-06-06)

## 0.0.76 (2022-06-03)

### Bug Fixes

- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

## 0.0.74 (2022-06-02)

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

## 0.0.72 (2022-05-30)

### Bug Fixes

- refactor nx-monorepo props ([3095326](https://github.com/aws/aws-prototyping-sdk/commit/3095326dbf18e033a35854c937d30dc3bef74619))
- resolve issue with release:mainline failing due to incorrect version of package ([aad2330](https://github.com/aws/aws-prototyping-sdk/commit/aad2330449a4e35f38da5f3b98a7e55adbc9322b))

## 0.0.71 (2022-05-30)

### Bug Fixes

- add missing scripts folder ([bb19590](https://github.com/aws/aws-prototyping-sdk/commit/bb19590818ebe1c4fe722a7e1cb69c676a32c18b))

## 0.0.70 (2022-05-26)

## 0.0.69 (2022-05-26)

### Bug Fixes

- add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
- resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))

## 0.0.67 (2022-05-18)

### Features

- add support for noHoistGlobs in Nx Monorepo. Additionally add PDKProject boilerplate ([e39b751](https://github.com/aws/aws-prototyping-sdk/commit/e39b751367b7a7edab0ac84514220ecbaed5a480))

## 0.0.66 (2022-05-17)

### Bug Fixes

- fix issue with broken monorepo tests ([fd61ef0](https://github.com/aws/aws-prototyping-sdk/commit/fd61ef0ed034d57d25aabfd55714370d67383459))

## 0.0.63 (2022-05-16)

## 0.0.62 (2022-05-13)

### Bug Fixes

- make python tests dynamic ([3cb2261](https://github.com/aws/aws-prototyping-sdk/commit/3cb226129a09528d09ac49aa6280c16c9a76d3b0))
- remove unused test ([e143001](https://github.com/aws/aws-prototyping-sdk/commit/e143001883af21e26289dd4c240e2f7ef3d02a0b))
- revert back to correct exports ([f3c66bd](https://github.com/aws/aws-prototyping-sdk/commit/f3c66bd27531cc69b0a434c6eac9fa34ac5d43d7))
- update Java pipeline project to resolve sample issues ([c8592fc](https://github.com/aws/aws-prototyping-sdk/commit/c8592fc9419aae1dd3223c080cd6d5cd496618f3))

## 0.0.60 (2022-05-11)

### Bug Fixes

- fix bug when specifying python entrypoint ([1cb0267](https://github.com/aws/aws-prototyping-sdk/commit/1cb026740dbe1a028499991ba17e3149bdcab190))

## 0.0.59 (2022-05-11)

## 0.0.58 (2022-05-11)

### Bug Fixes

- remove monorepo sample code ([58534ab](https://github.com/aws/aws-prototyping-sdk/commit/58534aba2537ba5ea75e7aa5020f4976e351b3a9))
- update deps for pipeline projects ([6a8a58f](https://github.com/aws/aws-prototyping-sdk/commit/6a8a58f71acd1d3acf8676c2bbed858b59d86c56))

## 0.0.55 (2022-04-28)

### Reverts

- Revert "build: skip building pdk_projen submodule for non ts languages" ([4e96efb](https://github.com/aws/aws-prototyping-sdk/commit/4e96efb5a809a5b447afa1c7277aedf452f3d909))

## 0.0.54 (2022-04-28)

## 0.0.52 (2022-03-10)

### Bug Fixes

- remove dependency on git from sonar project ([2d2c913](https://github.com/aws/aws-prototyping-sdk/commit/2d2c9130e66a0f27e454a459237da7aff894c5d8))

## 0.0.51 (2022-03-10)

### Bug Fixes

- fix path ([9761334](https://github.com/aws/aws-prototyping-sdk/commit/976133416925c50b263b69370bb80e01fb1caf81))

## 0.0.50 (2022-03-10)

### Bug Fixes

- add global install of cdk to sonar build project ([5daace8](https://github.com/aws/aws-prototyping-sdk/commit/5daace89a3f4053a863e08f35671e861df230c8e))

## 0.0.49 (2022-03-10)

### Bug Fixes

- fix typos in sonar scripts ([0eb61c0](https://github.com/aws/aws-prototyping-sdk/commit/0eb61c05f67ac0ff8a3043cf67d28ae392a75e6b))

## 0.0.48 (2022-03-10)

### Bug Fixes

- fix issue with args in cube ([50af1de](https://github.com/aws/aws-prototyping-sdk/commit/50af1dea5fc4178c8264f134c7283aa964723d9d))

### Features

- make sonar config configurable for inclusions/exclusions ([3cccae8](https://github.com/aws/aws-prototyping-sdk/commit/3cccae89961f290dd953bca910b1fec253fcc6b2))

## 0.0.46 (2022-03-09)

### Bug Fixes

- fix issue with reports not generating correctly ([55263bc](https://github.com/aws/aws-prototyping-sdk/commit/55263bc8d20b3f35ef5efae5999df8d7c07b7171))
- fix upgrade target for monorepo ([423c5c1](https://github.com/aws/aws-prototyping-sdk/commit/423c5c13e15855b1df72ef627d1cdc6a8d800d80))

## 0.0.44 (2022-03-09)

### Bug Fixes

- pass in codeCommitRemovalPolicy to PDKPipeline ([1eedc69](https://github.com/aws/aws-prototyping-sdk/commit/1eedc69ca3d469363fe2ae7f6dd1321a53d44d5d))

### Features

- emit the secretArn from the code scanner ([632a65a](https://github.com/aws/aws-prototyping-sdk/commit/632a65a0afba22f691beae90063444b3116e0448))

## 0.0.39 (2022-03-08)

### Bug Fixes

- move context retrival into samples ([34b50cf](https://github.com/aws/aws-prototyping-sdk/commit/34b50cf738c29e22b9ffd73c3ca2f47155d8484d))

## 0.0.38 (2022-03-08)

### Features

- add support for generating Java projects :) ([d59497d](https://github.com/aws/aws-prototyping-sdk/commit/d59497ded9a5d65a719254c964d5203d67d5f639))
- add support for SonarCodeScanner ([2066ecc](https://github.com/aws/aws-prototyping-sdk/commit/2066ecc5537b90d7f1cfed81cdc0a53a4ad84901))
- emit synth project ARN from PDKPipeline ([a569d70](https://github.com/aws/aws-prototyping-sdk/commit/a569d70ac575c1da7b7cbf5aee9b33bc5866f2ed))

## 0.0.34 (2022-03-05)

## 0.0.32 (2022-03-04)

## 0.0.31 (2022-03-04)

## 0.0.30 (2022-03-04)

## 0.0.29 (2022-03-04)

## 0.0.28 (2022-03-04)

## 0.0.27 (2022-03-04)

## 0.0.26 (2022-03-04)

# 0.1.0 (2022-11-20)

## 0.12.11 (2022-11-14)

### Bug Fixes

- change license header format to SPDX-License-Identifier ([#205](https://github.com/aws/aws-prototyping-sdk/issues/205)) ([4b3b7ae](https://github.com/aws/aws-prototyping-sdk/commit/4b3b7ae1fe716e969010a2aca6ac90089b16c2c1)), closes [#199](https://github.com/aws/aws-prototyping-sdk/issues/199)

## 0.12.6 (2022-11-03)

### Bug Fixes

- broken build ([8a0cb5f](https://github.com/aws/aws-prototyping-sdk/commit/8a0cb5fd29fb7987334b9de713703b0afe0cfa4c))

## 0.12.4 (2022-10-13)

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

## 0.3.10 (2022-07-14)

### Bug Fixes

- add dependencies for each projen project so peerDependencies are automatically resolved ([#92](https://github.com/aws/aws-prototyping-sdk/issues/92)) ([38a7998](https://github.com/aws/aws-prototyping-sdk/commit/38a7998a8b4609926f0a4ccfb27308c6cacd310a))

## 0.3.9 (2022-07-14)

### Bug Fixes

- add version for pdk-nag dependencies ([#91](https://github.com/aws/aws-prototyping-sdk/issues/91)) ([a013601](https://github.com/aws/aws-prototyping-sdk/commit/a013601f35abf329df526dfcdfdcbe1d35ba169e))

### Features

- improve security posture for pipeline ([#89](https://github.com/aws/aws-prototyping-sdk/issues/89)) ([8a7926d](https://github.com/aws/aws-prototyping-sdk/commit/8a7926d3fd9232cf08123bcd040208eea0deea5d))

## 0.2.17 (2022-06-30)

## 0.2.16 (2022-06-30)

## 0.2.13 (2022-06-28)

### Bug Fixes

- fix bundling to support inter-dependencies ([#64](https://github.com/aws/aws-prototyping-sdk/issues/64)) ([d62db29](https://github.com/aws/aws-prototyping-sdk/commit/d62db29f4365cedbd4a65ab39400428d00223a4e)), closes [#58](https://github.com/aws/aws-prototyping-sdk/issues/58)

## 0.2.11 (2022-06-26)

### Features

- implement AwsUiReactTsWebsiteProject ([#51](https://github.com/aws/aws-prototyping-sdk/issues/51)) ([477236a](https://github.com/aws/aws-prototyping-sdk/commit/477236af8fb504970802b80cdb18dfc9ecfa468a))

## 0.0.96 (2022-06-17)

### Bug Fixes

- resolve issue with exports ([#41](https://github.com/aws/aws-prototyping-sdk/issues/41)) ([99c5205](https://github.com/aws/aws-prototyping-sdk/commit/99c520551f2374bd4b199ce9ff710b5d2f6cd613))

## 0.0.95 (2022-06-17)

## 0.0.94 (2022-06-17)

### Bug Fixes

- don't delete prettier files from aws-prototyping-sdk ([15e1e66](https://github.com/aws/aws-prototyping-sdk/commit/15e1e666deaa20585a5b48289e425d61ef73206d))

## 0.0.81 (2022-06-07)

## 0.0.78 (2022-06-06)

## 0.0.76 (2022-06-03)

### Bug Fixes

- simplify upgrade-deps task and bump all deps ([666a0fc](https://github.com/aws/aws-prototyping-sdk/commit/666a0fcc8a4ebe30d93397cafd93993644d56259))

## 0.0.74 (2022-06-02)

### Features

- add static website and update documentation ([0d074b3](https://github.com/aws/aws-prototyping-sdk/commit/0d074b3eec243e96bf363f92bd9875f5ff61cd46))

## 0.0.72 (2022-05-30)

### Bug Fixes

- refactor nx-monorepo props ([3095326](https://github.com/aws/aws-prototyping-sdk/commit/3095326dbf18e033a35854c937d30dc3bef74619))
- resolve issue with release:mainline failing due to incorrect version of package ([aad2330](https://github.com/aws/aws-prototyping-sdk/commit/aad2330449a4e35f38da5f3b98a7e55adbc9322b))

## 0.0.71 (2022-05-30)

### Bug Fixes

- add missing scripts folder ([bb19590](https://github.com/aws/aws-prototyping-sdk/commit/bb19590818ebe1c4fe722a7e1cb69c676a32c18b))

## 0.0.70 (2022-05-26)

## 0.0.69 (2022-05-26)

### Bug Fixes

- add publishConfig to handle scoped npm packages ([5d95aa6](https://github.com/aws/aws-prototyping-sdk/commit/5d95aa6cb71b809308d9bff9f376d3800385d392))
- resolve issue with oss attribution and node resolutions ([fc8c5fd](https://github.com/aws/aws-prototyping-sdk/commit/fc8c5fdec17eb232d2b15fcf3d47f9c71e6a357e))

## 0.0.67 (2022-05-18)

### Features

- add support for noHoistGlobs in Nx Monorepo. Additionally add PDKProject boilerplate ([e39b751](https://github.com/aws/aws-prototyping-sdk/commit/e39b751367b7a7edab0ac84514220ecbaed5a480))

## 0.0.66 (2022-05-17)

### Bug Fixes

- fix issue with broken monorepo tests ([fd61ef0](https://github.com/aws/aws-prototyping-sdk/commit/fd61ef0ed034d57d25aabfd55714370d67383459))

## 0.0.63 (2022-05-16)

## 0.0.62 (2022-05-13)

### Bug Fixes

- make python tests dynamic ([3cb2261](https://github.com/aws/aws-prototyping-sdk/commit/3cb226129a09528d09ac49aa6280c16c9a76d3b0))
- remove unused test ([e143001](https://github.com/aws/aws-prototyping-sdk/commit/e143001883af21e26289dd4c240e2f7ef3d02a0b))
- revert back to correct exports ([f3c66bd](https://github.com/aws/aws-prototyping-sdk/commit/f3c66bd27531cc69b0a434c6eac9fa34ac5d43d7))
- update Java pipeline project to resolve sample issues ([c8592fc](https://github.com/aws/aws-prototyping-sdk/commit/c8592fc9419aae1dd3223c080cd6d5cd496618f3))

## 0.0.60 (2022-05-11)

### Bug Fixes

- fix bug when specifying python entrypoint ([1cb0267](https://github.com/aws/aws-prototyping-sdk/commit/1cb026740dbe1a028499991ba17e3149bdcab190))

## 0.0.59 (2022-05-11)

## 0.0.58 (2022-05-11)

### Bug Fixes

- remove monorepo sample code ([58534ab](https://github.com/aws/aws-prototyping-sdk/commit/58534aba2537ba5ea75e7aa5020f4976e351b3a9))
- update deps for pipeline projects ([6a8a58f](https://github.com/aws/aws-prototyping-sdk/commit/6a8a58f71acd1d3acf8676c2bbed858b59d86c56))

## 0.0.55 (2022-04-28)

### Reverts

- Revert "build: skip building pdk_projen submodule for non ts languages" ([4e96efb](https://github.com/aws/aws-prototyping-sdk/commit/4e96efb5a809a5b447afa1c7277aedf452f3d909))

## 0.0.54 (2022-04-28)

## 0.0.52 (2022-03-10)

### Bug Fixes

- remove dependency on git from sonar project ([2d2c913](https://github.com/aws/aws-prototyping-sdk/commit/2d2c9130e66a0f27e454a459237da7aff894c5d8))

## 0.0.51 (2022-03-10)

### Bug Fixes

- fix path ([9761334](https://github.com/aws/aws-prototyping-sdk/commit/976133416925c50b263b69370bb80e01fb1caf81))

## 0.0.50 (2022-03-10)

### Bug Fixes

- add global install of cdk to sonar build project ([5daace8](https://github.com/aws/aws-prototyping-sdk/commit/5daace89a3f4053a863e08f35671e861df230c8e))

## 0.0.49 (2022-03-10)

### Bug Fixes

- fix typos in sonar scripts ([0eb61c0](https://github.com/aws/aws-prototyping-sdk/commit/0eb61c05f67ac0ff8a3043cf67d28ae392a75e6b))

## 0.0.48 (2022-03-10)

### Bug Fixes

- fix issue with args in cube ([50af1de](https://github.com/aws/aws-prototyping-sdk/commit/50af1dea5fc4178c8264f134c7283aa964723d9d))

### Features

- make sonar config configurable for inclusions/exclusions ([3cccae8](https://github.com/aws/aws-prototyping-sdk/commit/3cccae89961f290dd953bca910b1fec253fcc6b2))

## 0.0.46 (2022-03-09)

### Bug Fixes

- fix issue with reports not generating correctly ([55263bc](https://github.com/aws/aws-prototyping-sdk/commit/55263bc8d20b3f35ef5efae5999df8d7c07b7171))
- fix upgrade target for monorepo ([423c5c1](https://github.com/aws/aws-prototyping-sdk/commit/423c5c13e15855b1df72ef627d1cdc6a8d800d80))

## 0.0.44 (2022-03-09)

### Bug Fixes

- pass in codeCommitRemovalPolicy to PDKPipeline ([1eedc69](https://github.com/aws/aws-prototyping-sdk/commit/1eedc69ca3d469363fe2ae7f6dd1321a53d44d5d))

### Features

- emit the secretArn from the code scanner ([632a65a](https://github.com/aws/aws-prototyping-sdk/commit/632a65a0afba22f691beae90063444b3116e0448))

## 0.0.39 (2022-03-08)

### Bug Fixes

- move context retrival into samples ([34b50cf](https://github.com/aws/aws-prototyping-sdk/commit/34b50cf738c29e22b9ffd73c3ca2f47155d8484d))

## 0.0.38 (2022-03-08)

### Features

- add support for generating Java projects :) ([d59497d](https://github.com/aws/aws-prototyping-sdk/commit/d59497ded9a5d65a719254c964d5203d67d5f639))
- add support for SonarCodeScanner ([2066ecc](https://github.com/aws/aws-prototyping-sdk/commit/2066ecc5537b90d7f1cfed81cdc0a53a4ad84901))
- emit synth project ARN from PDKPipeline ([a569d70](https://github.com/aws/aws-prototyping-sdk/commit/a569d70ac575c1da7b7cbf5aee9b33bc5866f2ed))

## 0.0.34 (2022-03-05)

## 0.0.32 (2022-03-04)

## 0.0.31 (2022-03-04)

## 0.0.30 (2022-03-04)

## 0.0.29 (2022-03-04)

## 0.0.28 (2022-03-04)

## 0.0.27 (2022-03-04)

## 0.0.26 (2022-03-04)
