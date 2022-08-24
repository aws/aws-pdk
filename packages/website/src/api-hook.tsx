import { Configuration, DefaultApi } from 'api-typescript';
import { useContext } from 'react';
import { addJsonContentTypeHeaderMiddleware, sigv4SignMiddleware } from './api-client-middleware/sigv4-middleware';
import { RuntimeConfigContext } from './Auth';

export const useApi = () => {
  const { runtimeContext } = useContext(RuntimeConfigContext);
  const apiUrl = runtimeContext.apiUrl;
  return new DefaultApi(new Configuration({
    basePath: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
    fetchApi: window.fetch.bind(window),
    middleware: [
      addJsonContentTypeHeaderMiddleware,
      sigv4SignMiddleware(runtimeContext.region),
    ],
  }));
};