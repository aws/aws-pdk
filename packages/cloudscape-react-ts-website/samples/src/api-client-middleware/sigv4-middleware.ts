/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

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
