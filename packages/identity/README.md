This module by default deploys a configurable Identity Provider with a default Cognito User Pool. These resources can be used by your website to restrict access to only authenticated users if needed. All settings are configurable and the creation of these AuthN resources can be disabled if needed or configured to use custom AuthN providers i.e. Facebook, Google, etc.

Below is a conceptual view of the default architecture this module creates:

```
Cognito User Pool --------------------> Identity Pool
     |_ User Pool Client                     |_ Unauthenticated IAM Role
                                             |_ Authenticated IAM Role
```