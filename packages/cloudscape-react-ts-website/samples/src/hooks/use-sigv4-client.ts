/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import { useCognitoAuthContext } from '@aws-northstar/ui';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { createSignedFetcher } from 'aws-sigv4-fetch';
import { useContext } from 'react';
import { RuntimeConfigContext, RuntimeContext } from '../Auth';


const getCredentials = (runtimeContext: RuntimeContext, cognitoUser: CognitoUser): Promise<AwsCredentialIdentity> => {
  return new Promise<AwsCredentialIdentity>(async (resolve) => {
    cognitoUser.getSession(async (_: null, session: CognitoUserSession) => {
      const cognitoidentity = new CognitoIdentityClient({
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region: runtimeContext.region }),
          identityPoolId: runtimeContext.identityPoolId,
          logins: {
            [`cognito-idp.${runtimeContext.region}.amazonaws.com/${runtimeContext.userPoolId}`]: session.getIdToken().getJwtToken(),
          },
        }),
      });
      resolve(await cognitoidentity.config.credentials());
    });
  });
};

export const useSigv4Client = (service: string = 'execute-api') => {
  const { getAuthenticatedUser } = useCognitoAuthContext();
  const runtimeContext = useContext(RuntimeConfigContext);

  return createSignedFetcher({
    service,
    region: runtimeContext?.region || 'ap-southeast-2',
    credentials: runtimeContext && getAuthenticatedUser ? () => getCredentials(runtimeContext, getAuthenticatedUser()!) : undefined,
  });
};