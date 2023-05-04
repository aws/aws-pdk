/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NorthStarThemeProvider } from '@aws-northstar/ui';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Auth from './Auth';
import reportWebVitals from './reportWebVitals';

createRoot(document.getElementById('root')!)
  .render(
    <React.StrictMode>
      <NorthStarThemeProvider>
        <BrowserRouter>
          <Auth>
            <App />
          </Auth>
        </BrowserRouter>
      </NorthStarThemeProvider>
    </React.StrictMode>,
  );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
