/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Auth } from 'aws-amplify';
import { AwsV4Signer } from 'aws4fetch';

type FetchAPI = WindowOrWorkerGlobalScope['fetch'];

interface RequestContext {
  fetch: FetchAPI;
  url: string;
  init: RequestInit;
}

interface ResponseContext {
  fetch: FetchAPI;
  url: string;
  init: RequestInit;
  response: Response;
}

interface FetchParams {
  url: string;
  init: RequestInit;
}

interface Middleware {
  pre?(context: RequestContext): Promise<FetchParams | void>;
  post?(context: ResponseContext): Promise<Response | void>;
}

/**
 * This middleware is useful for the open-api-gateway generated typescript client, if you are using IAM/Sigv4
 * authentication. This can safely be removed from your website project if not!
 */
export const sigv4SignMiddleware = (region: string): Middleware => ({
  pre: async ({ init, url }) => {
    // Retrieve the current signed in user credentials
    const { accessKeyId, secretAccessKey, sessionToken } = await Auth.currentCredentials();
    // Sign the request
    const { url: signedUrl, headers, body, method } = await new AwsV4Signer({
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region,
      service: 'execute-api',
      url,
      body: init.body,
      headers: init.headers,
      method: init.method,
    }).sign();
    // Return the signed request
    return {
      url: signedUrl.toString(),
      init: {
        ...init,
        headers,
        body,
        method,
      },
    };
  },
});

/**
 * This middleware is useful for the open-api-gateway generated typescript client, for adding the
 * application/json content-type header to requests.
 */
export const addJsonContentTypeHeaderMiddleware: Middleware = {
  pre: async ({ init, url }) => ({
    url,
    init: {
      ...init,
      headers: {
        ...init.headers,
        'Content-Type': 'application/json',
      },
    },
  }),
};
