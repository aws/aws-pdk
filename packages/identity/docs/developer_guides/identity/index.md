# Identity

![stable](https://img.shields.io/badge/stability-stable-green.svg)
[![API Documentation](https://img.shields.io/badge/view-API_Documentation-blue.svg)](../../api/typescript/identity/index.md)
[![Source Code](https://img.shields.io/badge/view-Source_Code-blue.svg)](https://github.com/aws/aws-pdk/tree/mainline/packages/identity)

> Simplify the setup of MFA enabled authentication providers using Cognito.

This submodule by default deploys a configurable Identity Provider with a default MFA enabled Cognito User Pool. These resources can be used by your website to restrict access to only authenticated users if needed. All settings are configurable and the creation of these AuthN resources can be disabled if needed or configured to use custom AuthN providers i.e. Facebook, Google, etc.

Below is a conceptual view of the default architecture this module creates:

```
Cognito User Pool --------------------> Identity Pool
     |_ User Pool Client                     |_ Unauthenticated IAM Role
                                             |_ Authenticated IAM Role
```

## Getting Started

```ts
new UserIdentity(scope, "UserIdentity");
```

### Creating a Cognito User

By default, the UserPool is not set up to allow self-registration (this is configurable). To create a Cognito user, follow these steps:

1. Navigate to the Cognito AWS console within the account you just deployed to.
1. Click on the user pool you just created
1. Click "Create user"
1. In invitation settings, select "Send an email invitation" 
1. Enter a username
1. Enter an email address
1. In temporary password, select "Generate a password"
1. Click "Create user"

## Migrating Users

If you ever need to migrate users from one cognito user pool to another, you can use this helper utility: https://www.npmjs.com/package/cognito-backup-restore
