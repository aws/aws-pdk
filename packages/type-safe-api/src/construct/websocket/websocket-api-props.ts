// ~~ Generated by projen. To modify, edit .projenrc.js and run "pnpm exec projen".
import type { aws_apigatewayv2 } from 'aws-cdk-lib';

/**
 * WebSocketApiProps
 */
export interface WebSocketApiProps {
  /**
   * The description of the API.
   * @default - none
   * @stability stable
   */
  readonly description?: string;
  /**
   * Name for the WebSocket API resource.
   * @default - id of the WebSocketApi construct.
   * @stability stable
   */
  readonly apiName?: string;
  /**
   * An API key selection expression.
   * Providing this option will require an API Key be provided to access the API.
   * @default - Key is not required to access these APIs
   * @stability stable
   */
  readonly apiKeySelectionExpression?: aws_apigatewayv2.WebSocketApiKeySelectionExpression;
}
