import * as path from 'path';
import { OpenApiGatewayLambdaApi, OpenApiGatewayLambdaApiProps, OpenApiIntegration } from '@aws-prototyping-sdk/open-api-gateway';
import { OperationLookup, OperationConfig } from 'api-typescript';
import { Construct } from 'constructs';
import spec from '../spec/.parsed-spec.json';

export type ApiIntegrations = OperationConfig<OpenApiIntegration>;

export interface ApiProps extends Omit<OpenApiGatewayLambdaApiProps, 'spec' | 'specPath' | 'operationLookup' | 'integrations'> {
  readonly integrations: ApiIntegrations;
}

/**
 * Type-safe construct for the API Gateway resources defined by the spec.
 * You will likely not need to modify this file, and can instead extend it and define your integrations.
 */
export class Api extends OpenApiGatewayLambdaApi {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id, {
      ...props,
      integrations: props.integrations as any,
      spec,
      specPath: path.resolve(__dirname, '../spec/.parsed-spec.json'),
      operationLookup: OperationLookup as any,
    });
  }
}
