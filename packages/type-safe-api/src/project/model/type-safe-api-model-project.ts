/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Language } from "../languages";
import { ModelLanguage, ModelOptions } from "../types";

export interface TypeSafeApiModelProjectOptions {
  /**
   * Language the model is defined in
   */
  readonly modelLanguage: ModelLanguage;
  /**
   * Options for the model
   */
  readonly modelOptions: ModelOptions;
  /**
   * The languages users have specified for handler projects (if any)
   */
  readonly handlerLanguages?: Language[];
}
