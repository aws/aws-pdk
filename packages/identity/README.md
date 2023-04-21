> **BREAKING CHANGES** (pre-release)
> - `> v0.15.5`: updated defaults for UserPoolWithMfa will break deployments for already created userPools. If migrating to a newer version of this package, be sure to set the following in your `cdk.context.json`:
>
>  
>   ```
>     {
>       "@aws-prototyping-sdk/identity:useLegacyMFAProps":true
>     }
>   ```

This module by default deploys a configurable Identity Provider with a default Cognito User Pool. These resources can be used by your website to restrict access to only authenticated users if needed. All settings are configurable and the creation of these AuthN resources can be disabled if needed or configured to use custom AuthN providers i.e. Facebook, Google, etc.

Below is a conceptual view of the default architecture this module creates:

```
Cognito User Pool --------------------> Identity Pool
     |_ User Pool Client                     |_ Unauthenticated IAM Role
                                             |_ Authenticated IAM Role
```

## Migrating Users

If you ever need to migrate users from one cognito user pool to another, you can use this helper utility: https://www.npmjs.com/package/cognito-backup-restore