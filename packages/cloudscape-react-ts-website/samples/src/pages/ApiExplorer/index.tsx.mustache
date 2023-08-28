/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { useCognitoAuthContext } from "@aws-northstar/ui";
import ErrorMessage from "@aws-northstar/ui/components/CognitoAuth/components/ErrorMessage";
import getCredentials from "@aws-northstar/ui/components/CognitoAuth/hooks/useSigv4Client/utils/getCredentials";
import { useCallback, useContext, useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { RuntimeConfigContext } from "../../components/RuntimeContext";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const aws4Fetch = require("aws4fetch");

/**
 * Component to render the home ApiExplorer.
 */
const ApiExplorer: React.FC = () => {
  const runtimeContext = useContext(RuntimeConfigContext);
  const [apiSpec, setApiSpec] = useState();
  const [error, setError] = useState<string | undefined>();
  const { getAuthenticatedUser, region, identityPoolId, userPoolId } =
    useCognitoAuthContext();

  // Load the OpenAPI spec
  useEffect(() => {
    fetch("/api.json")
      .then((response) => {
        return response.json();
      })
      .then((_apiSpec) => {
        // Inject the server API URL
        setApiSpec({ ..._apiSpec, servers: [{ url: runtimeContext?.apiUrl }] });
      })
      .catch(() => {
        setError(
          "No OpenAPI definition detected. Ensure TypeSafeAPI is passed in to Cloudscape Website construct."
        );
      });
  }, []);

  /**
   * Interceptor which signs all requests using SigV4
   */
  const sigv4Interceptor = useCallback(async (r: any) => {
    const { accessKeyId, secretAccessKey, sessionToken } = await getCredentials(
      getAuthenticatedUser?.()!,
      region,
      identityPoolId,
      userPoolId
    );

    // Sign the request
    const {
      url: signedUrl,
      headers,
      body,
      method,
    } = await new aws4Fetch.AwsV4Signer({
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region,
      service: "execute-api",
      url: r.url,
      body: r.body,
      headers: r.headers,
      method: r.method,
    }).sign();
    // Return the signed request
    return {
      ...r,
      url: signedUrl.toString(),
      headers,
      body,
      method,
    };
  }, []);

  return error ? (
    <ErrorMessage>{error}</ErrorMessage>
  ) : apiSpec ? (
    <SwaggerUI requestInterceptor={sigv4Interceptor} spec={apiSpec} />
  ) : (
    <></>
  );
};

export default ApiExplorer;
