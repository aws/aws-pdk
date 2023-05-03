/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CognitoAuth } from '@aws-northstar/ui';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import Config from './config.json';

export interface RuntimeContext {
  readonly region: string;
  readonly userPoolId: string;
  readonly userPoolWebClientId: string;
  readonly identityPoolId: string;
}

/**
 * Context for storing the runtimeContext.
 */
export const RuntimeConfigContext = createContext<RuntimeContext | undefined>(undefined);

/**
 * Sets up the runtimeContext and Cognito auth.
 *
 * This assumes a runtime-config.json file is present at '/'. In order for Auth to be set up automatically,
 * the runtime-config.json must have the following properties configured: [region, userPoolId, userPoolWebClientId, identityPoolId].
 */
const Auth: React.FC<any> = ({ children }) => {
  const [runtimeContext, setRuntimeContext] = useState<RuntimeContext | undefined>();

  useEffect(() => {
    fetch('/runtime-config.json')
      .then(response => {
        return response.json();
      })
      .then(runtimeCtx => {
        if (runtimeCtx.region &&
            runtimeCtx.userPoolId &&
            runtimeCtx.userPoolWebClientId &&
            runtimeCtx.identityPoolId) {
          setRuntimeContext(runtimeCtx as RuntimeContext);
        } else {
          console.warn('runtime-config.json should have region, userPoolId, userPoolWebClientId & identityPoolId.');
        }
      })
      .catch(() => {
        console.log('No runtime-config.json detected');
        setRuntimeContext(undefined);
      });
  }, [setRuntimeContext]);

  const AuthWrapper: React.FC<any> = useCallback(({ children: _children }) => (runtimeContext?.userPoolId && runtimeContext?.userPoolWebClientId) ?
    <CognitoAuth
      header={Config.applicationName}
      userPoolId={runtimeContext.userPoolId}
      clientId={runtimeContext.userPoolWebClientId}
      region={runtimeContext.region}
      identityPoolId={runtimeContext.identityPoolId}
    >
      {_children}
    </CognitoAuth> :
    <>
      {
        runtimeContext ?
          _children : <></> // Don't render anything if the context has not finalized
      }
    </>, [runtimeContext]);

  return (
    <AuthWrapper>
      <RuntimeConfigContext.Provider value={runtimeContext}>
        {children}
      </RuntimeConfigContext.Provider>
    </AuthWrapper>
  );
};

export default Auth;