/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import Axios from "axios";
import Amplify, { Hub } from "aws-amplify";
import { AmplifyAuthenticator, AmplifySignIn } from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";

import { AmplifyConfigType, AppSyncAuthType } from "types";
import { AuthProvider, useAuth } from "react-oidc-context";

import { useTranslation } from "react-i18next";
import { I18n } from "aws-amplify";
import { useDispatch } from "react-redux";
import LoadingText from "components/LoadingText";
import { ActionType } from "reducer/appReducer";
import Button from "components/Button";
import { WebStorageStateStore } from "oidc-client-ts";

const AMPLIFY_CONFIG_JSON = "__portal_local_";
export interface SignedInAppProps {
  oidcSignOut?: () => void;
}

const AmplifyLoginPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <AmplifyAuthenticator>
        <AmplifySignIn
          headerText={t("signin.signInToLogHub")}
          slot="sign-in"
          usernameAlias="username"
          submitButtonText={t("signin.signIn")}
          formFields={[
            {
              type: "username",
              label: t("signin.email"),
              placeholder: t("signin.inputEmail"),
              required: true,
              inputProps: { autoComplete: "off" },
            },
            {
              type: "password",
              label: t("signin.password"),
              placeholder: t("signin.inputPassword"),
              required: true,
              inputProps: { autoComplete: "off" },
            },
          ]}
        >
          <div slot="secondary-footer-content"></div>
        </AmplifySignIn>
      </AmplifyAuthenticator>
    </div>
  );
};

const SignedInApp: React.FC<SignedInAppProps> = (props: SignedInAppProps) => {
  return <div className="App"></div>;
};

const AmplifyAppRouter: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>();
  const dispatch = useDispatch();
  const onAuthEvent = (payload: any) => {
    if (payload?.data?.code === "ResourceNotFoundException") {
      window.localStorage.removeItem(AMPLIFY_CONFIG_JSON);
      window.location.reload();
    }
  };
  Hub.listen("auth", (data) => {
    const { payload } = data;
    onAuthEvent(payload);
  });
  useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData: any) => {
      dispatch({
        type: ActionType.UPDATE_USER_EMAIL,
        email: authData?.attributes?.email,
      });
      setAuthState(nextAuthState);
    });
  }, []);

  return authState === AuthState.SignedIn ? (
    <SignedInApp />
  ) : (
    <AmplifyLoginPage />
  );
};

const OIDCAppRouter: React.FC = () => {
  const auth = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function
    return auth?.events?.addAccessTokenExpiring((event) => {
      console.info("addAccessTokenExpiring:event:", event);
      auth.signinSilent();
    });
  }, [auth.events, auth.signinSilent]);

  if (auth.isLoading) {
    return (
      <div className="pd-20 text-center">
        <LoadingText text={t("loading")} />
      </div>
    );
  }

  if (auth.error) {
    if (auth.error.message.startsWith("No matching state")) {
      window.location.href = "/";
      return null;
    }
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <SignedInApp oidcSignOut={auth.removeUser} />
      </div>
    );
  }

  return (
    <div className="oidc-login">
      <div>
        <div className="title">{t("name")}</div>
      </div>
      {
        <div>
          <Button
            btnType="primary"
            onClick={() => {
              auth.signinRedirect();
            }}
          >
            {t("signin.signInToLogHub")}
          </Button>
        </div>
      }
    </div>
  );
};

const App: React.FC = () => {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [oidcConfig, setOidcConfig] = useState<any>();
  const [authType, setAuthType] = useState<AppSyncAuthType>(
    AppSyncAuthType.OPEN_ID
  );
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  I18n.setLanguage(i18n.language);

  const initAuthentication = (configData: AmplifyConfigType) => {
    dispatch({
      type: ActionType.UPDATE_AMPLIFY_CONFIG,
      amplifyConfig: configData,
    });
    setAuthType(configData.aws_appsync_authenticationType);
    if (configData.aws_appsync_authenticationType === AppSyncAuthType.OPEN_ID) {
      // Amplify.configure(configData);
      setOidcConfig({
        userStore: new WebStorageStateStore({ store: window.localStorage }),
        authority: configData.aws_oidc_provider,
        client_id: configData.aws_oidc_client_id,
        redirect_uri: configData.aws_oidc_customer_domain
          ? configData.aws_oidc_customer_domain
          : "https://" + configData.aws_cloudfront_url,
      });
    } else {
      Amplify.configure(configData);
    }
  };

  const setLocalStorageAfterLoad = () => {
    if (localStorage.getItem(AMPLIFY_CONFIG_JSON)) {
      const configData = JSON.parse(
        localStorage.getItem(AMPLIFY_CONFIG_JSON) || ""
      );
      initAuthentication(configData);
      setLoadingConfig(false);
    } else {
      const timeStamp = new Date().getTime();
      setLoadingConfig(true);
      Axios.get(`/aws-exports.json?timestamp=${timeStamp}`).then((res) => {
        const configData: AmplifyConfigType = res.data;
        localStorage.setItem(AMPLIFY_CONFIG_JSON, JSON.stringify(res.data));
        initAuthentication(configData);
        setLoadingConfig(false);
      });
    }
  };

  useEffect(() => {
    document.title = t("title");
    if (window.performance) {
      if (performance.navigation.type === 1) {
        // console.info("This page is reloaded");
        const timeStamp = new Date().getTime();
        setLoadingConfig(true);
        Axios.get(`/aws-exports.json?timestamp=${timeStamp}`).then((res) => {
          localStorage.setItem(AMPLIFY_CONFIG_JSON, JSON.stringify(res.data));
          const configData: AmplifyConfigType = res.data;
          initAuthentication(configData);
          setLoadingConfig(false);
        });
      } else {
        // console.info("This page is not reloaded");
        setLocalStorageAfterLoad();
      }
    } else {
      setLocalStorageAfterLoad();
    }
  }, []);

  if (loadingConfig) {
    return (
      <div className="pd-20 text-center">
        <LoadingText text={t("loading")} />
      </div>
    );
  }

  if (authType === AppSyncAuthType.OPEN_ID) {
    return (
      <AuthProvider {...oidcConfig}>
        <OIDCAppRouter />
      </AuthProvider>
    );
  }

  return <AmplifyAppRouter />;
};

export default App;
