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

import { fork, ChildProcess } from "child_process";
import * as path from "path";

/**
 * Starts a local instance of Verdaccio (NPM registry).
 *
 * @return a promise of a ChildProcess.
 */
export const startLocalRegistry: () => Promise<ChildProcess> = () =>
  new Promise((resolve, reject) => {
    const pathVerdaccioModule = require.resolve("verdaccio/bin/verdaccio");
    const configPath = path.join(__dirname, "config.yaml");
    //
    process.env.VERDACCIO_HANDLE_KILL_SIGNALS = "true";
    const childFork = fork(pathVerdaccioModule, ["-c", configPath], {
      silent: false,
      detached: true,
    });

    childFork.on("message", (msg: string[]) => {
      if ("verdaccio_started" in msg) {
        resolve(childFork);
      }
    });

    childFork.on("error", (err) => {
      reject([err]);
    });

    childFork.on("exit", (err) => {
      reject([err]);
    });
  });
