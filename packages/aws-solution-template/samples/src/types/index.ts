import { AUTH_TYPE } from "aws-appsync-auth-link";

export enum AppSyncAuthType {
  OPEN_ID = AUTH_TYPE.OPENID_CONNECT,
  AMAZON_COGNITO_USER_POOLS = AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
}
export interface AmplifyConfigType {
  aws_project_region: string;
  aws_appsync_graphqlEndpoint: string;
  aws_appsync_region: string;
  aws_appsync_authenticationType: AppSyncAuthType;
  aws_cognito_region: string;
  aws_user_pools_id: string;
  aws_user_pools_web_client_id: string;
  default_logging_bucket: string;
  aws_oidc_provider: string;
  aws_oidc_client_id: string;
  aws_oidc_customer_domain: string;
  aws_cloudfront_url: string;
  loghub_version: string;
  default_cmk_arn: string;
}
