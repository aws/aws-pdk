/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
// instantiate log4js when app is initialized
import { configure as configureLog4js } from "log4js";
import * as log4jsSettings from "./.log4jsrc.json";

configureLog4js(log4jsSettings);

export * from "./construct";
export * from "./project";
