import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { Logger } from '@aws-lambda-powertools/logger';
// import { ConstructorOptions } from '@aws-lambda-powertools/logger/lib/types';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { PolicyDocument } from 'aws-lambda';

const { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } = process.env;

const tracer = new Tracer({ serviceName: 'notificationService' });
const logger = new Logger({ serviceName: 'notificationService', logLevel: 'DEBUG' });

// generate a policy to return
const generatePolicy = (principalId: any, effect: any, resource: any) =>{
  var authResponse: any = {
    principalId: principalId,
  };
  if (effect && resource) {
    let policyDocument: PolicyDocument = ({
      Version: '2012-10-17', // default version
      Statement: [],
    });

    var statementOne = {
      Action: 'execute-api:Invoke', // default action
      Effect: effect,
      Resource: resource,

    };
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  // Optional output with custom properties of the String, Number or Boolean type.
  authResponse.context = {
    customerId: principalId,
  };
  return authResponse;
}

// generate an allow policy
const generateAllow = (principalId: any, resource: any) => {
  return generatePolicy(principalId, 'Allow', resource);
}

// generate a deny policy
const generateDeny = (principalId: any, resource: any) =>{
  return generatePolicy(principalId, 'Deny', resource);
}

// Lambda Handler
class Lambda implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(event: any, context: any): Promise<any> {
    logger.addContext(context);
    logger.debug(JSON.stringify(event));
    logger.debug(JSON.stringify(context));
    
    var token = event.queryStringParameters.token;

    try {
      // create a cognito token verifier for the pool and client id
      let cognitoVerifier = CognitoJwtVerifier.create({
        userPoolId: COGNITO_USER_POOL_ID!,
        tokenUse: 'id',
        clientId: COGNITO_CLIENT_ID,
      });

      //  verify the token - thrown if not valid
      const verifiedToken = await cognitoVerifier.verify(token, { clientId: COGNITO_CLIENT_ID! });
      logger.debug('Token is valid and verified:', verifiedToken);

      // return an allow policy
      return generateAllow(verifiedToken['cognito:username'], event.methodArn);

    } catch (err: any) {
      logger.debug('Error during token validation: ', err);

      // generate a deny policy
      return generateDeny('default', event.methodArn);
    }
  }
}

// export the handler class
export const handlerClass = new Lambda();

// export the handler function
export const handler = handlerClass.handler;
