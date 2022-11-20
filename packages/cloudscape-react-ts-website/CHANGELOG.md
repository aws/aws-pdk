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



## 0.7.5 (2022-08-23)


### Bug Fixes

* **cloudscape-react-ts-website:** check for existance of runtime config in Auth.tsx ([#136](https://github.com/aws/aws-prototyping-sdk/issues/136)) ([72a69d1](https://github.com/aws/aws-prototyping-sdk/commit/72a69d11e4b8bb80441c0f51134b8352e1b2f5d7))



## 0.7.4 (2022-08-23)


### Bug Fixes

* remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))


### Features

* sigv4 middleware, cors by default for sample api ([#132](https://github.com/aws/aws-prototyping-sdk/issues/132)) ([3b391c0](https://github.com/aws/aws-prototyping-sdk/commit/3b391c0d0ad94c3909c34066cce1dd69ff55538f))



## 0.7.1 (2022-08-18)


### Bug Fixes

* add missing snap ([#129](https://github.com/aws/aws-prototyping-sdk/issues/129)) ([1248204](https://github.com/aws/aws-prototyping-sdk/commit/12482049857e7d0d99d3be90b1b7ef107331f026))
* **cloudscape-react-ts-website:** fix blank screen on signin due to missing runtime context ([#127](https://github.com/aws/aws-prototyping-sdk/issues/127)) ([c3f3327](https://github.com/aws/aws-prototyping-sdk/commit/c3f3327faec897bd4f1002e3dc3465229df454c2))



# 0.6.0 (2022-08-15)


### Bug Fixes

* add missing snap ([#112](https://github.com/aws/aws-prototyping-sdk/issues/112)) ([c782943](https://github.com/aws/aws-prototyping-sdk/commit/c7829430f8693fbbb96d52401dfdf57616d727b5))
* fix issue in website related to header path and header stickiness ([#111](https://github.com/aws/aws-prototyping-sdk/issues/111)) ([d1a6233](https://github.com/aws/aws-prototyping-sdk/commit/d1a6233ada7913e1cb2c1653157c2fad63c67c0e))
* refactor Cloudscape sample to support sign out dropdown ([#106](https://github.com/aws/aws-prototyping-sdk/issues/106)) ([55f629b](https://github.com/aws/aws-prototyping-sdk/commit/55f629ba6facd1d96e6c3db55f79b30d09cbe191))



## 0.4.1 (2022-07-20)


### Bug Fixes

* fix pjid typo for cloudscape-react-ts-website ([#102](https://github.com/aws/aws-prototyping-sdk/issues/102)) ([dca2774](https://github.com/aws/aws-prototyping-sdk/commit/dca27746a824fd8df5358e516d101d05ecc75122))



# 0.4.0 (2022-07-19)


### Features

* add CloudscapeReactTsWebsite to replace AWSUIReactTsWebsite ([#100](https://github.com/aws/aws-prototyping-sdk/issues/100)) ([53a41ae](https://github.com/aws/aws-prototyping-sdk/commit/53a41ae3807073dec091f81ab41cc136399deff4))


### BREAKING CHANGES

* AWSUIReactTsWebsite has been moved into CloudscapeReactTsWebsite. All components
are backward compatible however imports will need to move to the new @cloudspace-design namespace.

Co-authored-by: Dimech <dimecha@bcd07403f081.ant.amazon.com>





# 2.0.0-alpha.0 (2022-11-20)

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

## 0.7.5 (2022-08-23)

### Bug Fixes

- **cloudscape-react-ts-website:** check for existance of runtime config in Auth.tsx ([#136](https://github.com/aws/aws-prototyping-sdk/issues/136)) ([72a69d1](https://github.com/aws/aws-prototyping-sdk/commit/72a69d11e4b8bb80441c0f51134b8352e1b2f5d7))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

### Features

- sigv4 middleware, cors by default for sample api ([#132](https://github.com/aws/aws-prototyping-sdk/issues/132)) ([3b391c0](https://github.com/aws/aws-prototyping-sdk/commit/3b391c0d0ad94c3909c34066cce1dd69ff55538f))

## 0.7.1 (2022-08-18)

### Bug Fixes

- add missing snap ([#129](https://github.com/aws/aws-prototyping-sdk/issues/129)) ([1248204](https://github.com/aws/aws-prototyping-sdk/commit/12482049857e7d0d99d3be90b1b7ef107331f026))
- **cloudscape-react-ts-website:** fix blank screen on signin due to missing runtime context ([#127](https://github.com/aws/aws-prototyping-sdk/issues/127)) ([c3f3327](https://github.com/aws/aws-prototyping-sdk/commit/c3f3327faec897bd4f1002e3dc3465229df454c2))

# 0.6.0 (2022-08-15)

### Bug Fixes

- add missing snap ([#112](https://github.com/aws/aws-prototyping-sdk/issues/112)) ([c782943](https://github.com/aws/aws-prototyping-sdk/commit/c7829430f8693fbbb96d52401dfdf57616d727b5))
- fix issue in website related to header path and header stickiness ([#111](https://github.com/aws/aws-prototyping-sdk/issues/111)) ([d1a6233](https://github.com/aws/aws-prototyping-sdk/commit/d1a6233ada7913e1cb2c1653157c2fad63c67c0e))
- refactor Cloudscape sample to support sign out dropdown ([#106](https://github.com/aws/aws-prototyping-sdk/issues/106)) ([55f629b](https://github.com/aws/aws-prototyping-sdk/commit/55f629ba6facd1d96e6c3db55f79b30d09cbe191))

## 0.4.1 (2022-07-20)

### Bug Fixes

- fix pjid typo for cloudscape-react-ts-website ([#102](https://github.com/aws/aws-prototyping-sdk/issues/102)) ([dca2774](https://github.com/aws/aws-prototyping-sdk/commit/dca27746a824fd8df5358e516d101d05ecc75122))

# 0.4.0 (2022-07-19)

### Features

- add CloudscapeReactTsWebsite to replace AWSUIReactTsWebsite ([#100](https://github.com/aws/aws-prototyping-sdk/issues/100)) ([53a41ae](https://github.com/aws/aws-prototyping-sdk/commit/53a41ae3807073dec091f81ab41cc136399deff4))

### BREAKING CHANGES

- AWSUIReactTsWebsite has been moved into CloudscapeReactTsWebsite. All components
  are backward compatible however imports will need to move to the new @cloudspace-design namespace.

Co-authored-by: Dimech <dimecha@bcd07403f081.ant.amazon.com>

# 1.0.0-alpha.0 (2022-11-20)

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

## 0.7.5 (2022-08-23)

### Bug Fixes

- **cloudscape-react-ts-website:** check for existance of runtime config in Auth.tsx ([#136](https://github.com/aws/aws-prototyping-sdk/issues/136)) ([72a69d1](https://github.com/aws/aws-prototyping-sdk/commit/72a69d11e4b8bb80441c0f51134b8352e1b2f5d7))

## 0.7.4 (2022-08-23)

### Bug Fixes

- remove test from release target ([#135](https://github.com/aws/aws-prototyping-sdk/issues/135)) ([2c37fde](https://github.com/aws/aws-prototyping-sdk/commit/2c37fdec814073ec0984ccd9d59d086292b7fee2))

### Features

- sigv4 middleware, cors by default for sample api ([#132](https://github.com/aws/aws-prototyping-sdk/issues/132)) ([3b391c0](https://github.com/aws/aws-prototyping-sdk/commit/3b391c0d0ad94c3909c34066cce1dd69ff55538f))

## 0.7.1 (2022-08-18)

### Bug Fixes

- add missing snap ([#129](https://github.com/aws/aws-prototyping-sdk/issues/129)) ([1248204](https://github.com/aws/aws-prototyping-sdk/commit/12482049857e7d0d99d3be90b1b7ef107331f026))
- **cloudscape-react-ts-website:** fix blank screen on signin due to missing runtime context ([#127](https://github.com/aws/aws-prototyping-sdk/issues/127)) ([c3f3327](https://github.com/aws/aws-prototyping-sdk/commit/c3f3327faec897bd4f1002e3dc3465229df454c2))

# 0.6.0 (2022-08-15)

### Bug Fixes

- add missing snap ([#112](https://github.com/aws/aws-prototyping-sdk/issues/112)) ([c782943](https://github.com/aws/aws-prototyping-sdk/commit/c7829430f8693fbbb96d52401dfdf57616d727b5))
- fix issue in website related to header path and header stickiness ([#111](https://github.com/aws/aws-prototyping-sdk/issues/111)) ([d1a6233](https://github.com/aws/aws-prototyping-sdk/commit/d1a6233ada7913e1cb2c1653157c2fad63c67c0e))
- refactor Cloudscape sample to support sign out dropdown ([#106](https://github.com/aws/aws-prototyping-sdk/issues/106)) ([55f629b](https://github.com/aws/aws-prototyping-sdk/commit/55f629ba6facd1d96e6c3db55f79b30d09cbe191))

## 0.4.1 (2022-07-20)

### Bug Fixes

- fix pjid typo for cloudscape-react-ts-website ([#102](https://github.com/aws/aws-prototyping-sdk/issues/102)) ([dca2774](https://github.com/aws/aws-prototyping-sdk/commit/dca27746a824fd8df5358e516d101d05ecc75122))

# 0.4.0 (2022-07-19)

### Features

- add CloudscapeReactTsWebsite to replace AWSUIReactTsWebsite ([#100](https://github.com/aws/aws-prototyping-sdk/issues/100)) ([53a41ae](https://github.com/aws/aws-prototyping-sdk/commit/53a41ae3807073dec091f81ab41cc136399deff4))

### BREAKING CHANGES

- AWSUIReactTsWebsite has been moved into CloudscapeReactTsWebsite. All components
  are backward compatible however imports will need to move to the new @cloudspace-design namespace.

Co-authored-by: Dimech <dimecha@bcd07403f081.ant.amazon.com>
