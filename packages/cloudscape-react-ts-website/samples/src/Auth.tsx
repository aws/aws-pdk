/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Auth as AmplifyAuth } from '@aws-amplify/auth';
import { Amplify, Hub } from '@aws-amplify/core';
import { Authenticator, ThemeProvider, Theme, useTheme } from '@aws-amplify/ui-react';
import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react';

/**
 * Context for storing the runtimeContext.
 */
export const RuntimeConfigContext = createContext<any>({});

/**
 * Sets up the runtimeContext and Cognito auth.
 *
 * This assumes a runtime-config.json file is present at '/'. In order for Auth to be set up automatically,
 * the runtime-config.json must have the following properties configured: [region, userPoolId, userPoolWebClientId, identityPoolId].
 */
const Auth: React.FC<any> = ({ children }) => {
  const [runtimeContext, setRuntimeContext] = useState<any>(undefined);
  const { tokens } = useTheme();

  // Customize your login theme
  const theme: Theme = useMemo(() => ({
    name: 'AuthTheme',
    tokens: {
      components: {
        passwordfield: {
          button: {
            _hover: {
              backgroundColor: {
                value: 'white',
              },
              borderColor: {
                value: tokens.colors.blue['40'].value,
              },
            },
          },
        },
      },
      colors: {
        background: {
          primary: {
            value: tokens.colors.neutral['20'].value,
          },
          secondary: {
            value: tokens.colors.neutral['100'].value,
          },
        },
        brand: {
          primary: {
            10: tokens.colors.blue['20'],
            80: tokens.colors.blue['40'],
            90: tokens.colors.blue['40'],
            100: tokens.colors.blue['40'],
          },
        },
      },
    },
  }), [tokens]);

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
          Amplify.configure({
            Auth: {
              region: runtimeCtx.region,
              userPoolId: runtimeCtx.userPoolId,
              userPoolWebClientId: runtimeCtx.userPoolWebClientId,
              identityPoolId: runtimeCtx.identityPoolId,
            },
          });
          AmplifyAuth.currentUserInfo()
            .then(user => setRuntimeContext({ ...runtimeCtx, user }))
            .catch(e => console.error(e));
        } else {
          console.warn('runtime-config.json should have region, userPoolId, userPoolWebClientId & identityPoolId.');
        }
      })
      .catch(() => {
        console.log('No runtime-config.json detected');
        setRuntimeContext({});
      });
  }, [setRuntimeContext]);

  useEffect(() => {
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signIn':
          AmplifyAuth.currentUserInfo()
            .then(user => setRuntimeContext((prevRuntimeContext: any) => ({ ...prevRuntimeContext, user })))
            .catch(e => console.error(e));
          break;
        case 'signOut':
          window.location.reload();
          break;
      }
    });
  }, []);

  const AuthWrapper: React.FC<any> = useCallback(({ children: _children }) => runtimeContext?.userPoolId ?
    <ThemeProvider theme={theme}>
      <Authenticator variation="modal" hideSignUp>
        {_children}
      </Authenticator>
    </ThemeProvider> :
    <>
      {
        runtimeContext ?
          _children : <></> // Don't render anything if the context has not finalized
      }
    </>, [runtimeContext, theme]);

  return (
    <AuthWrapper>
      <RuntimeConfigContext.Provider value={{ runtimeContext, setRuntimeContext }}>
        {children}
      </RuntimeConfigContext.Provider>
    </AuthWrapper>
  );
};

export default Auth;