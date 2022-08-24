import { sayHelloHandler } from 'api-typescript';

/**
 * An example lambda handler which uses the generated handler wrapper to manage marshalling inputs/outputs.
 */
export const handler = sayHelloHandler(async (input) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: {
      message: `Hello ${input.requestParameters.name}!`,
    },
  };
});
