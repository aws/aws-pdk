// ~~ Generated by projen. To modify, edit .projenrc.js and run "pnpm exec projen".
import type { aws_apigatewayv2 } from 'aws-cdk-lib';

/**
 * WebSocketStageProps
 */
export interface WebSocketStageProps {
  /**
   * The name of the stage.
   * @stability stable
   */
  readonly stageName?: string;
  /**
   * Throttle settings for the routes of this stage.
   * @default - no throttling configuration
   * @stability stable
   */
  readonly throttle?: aws_apigatewayv2.ThrottleSettings;
  /**
   * The options for custom domain and api mapping.
   * @default - no custom domain and api mapping configuration
   * @stability stable
   */
  readonly domainMapping?: aws_apigatewayv2.DomainMappingOptions;
  /**
   * The description for the API stage.
   * @default - no description
   * @stability stable
   */
  readonly description?: string;
  /**
   * Whether updates to an API automatically trigger a new deployment.
   * @default false
   * @stability stable
   */
  readonly autoDeploy?: boolean;
}
