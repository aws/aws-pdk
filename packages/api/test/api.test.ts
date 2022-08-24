import { OperationLookup } from 'api-typescript';
import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Api } from '../src/api';

/**
 * A simple test to ensure the api construct synthesizes correctly
 */
describe('Api', () => {
  it('should synthesize', () => {
    const stack = new Stack();
    new Api(stack, 'ApiTest', {
      // Create a dummy integration for every operation defined in the api
      integrations: Object.fromEntries(Object.keys(OperationLookup).map((operation) => [operation, {
        function: new Function(stack, `${operation}Lambda`, {
          code: Code.fromInline('test'), handler: 'test', runtime: Runtime.NODEJS_14_X,
        }),
      }])) as any,
    });

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
