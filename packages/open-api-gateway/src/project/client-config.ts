/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ClientLanguage, DocumentationFormat } from "./languages";

/**
 * Indicates whtehr a client language is default and should be generated.
 */
export interface ClientLanguageConfig {
  readonly clientLanguage: ClientLanguage;
  readonly isDefault: boolean;
  readonly generate: boolean;
}

/**
 * Indicates whether a documentation format should be generated.
 */
export interface DocumentationFormatConfig {
  readonly documentationFormat: DocumentationFormat;
  readonly generate: boolean;
}
