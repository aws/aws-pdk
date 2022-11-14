/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { LightTheme } from "./light";
import { ThemesEnum } from "./types";

export * from "./types";
export * from "./light";

/** The default theme id */
export const DefaultThemeId = ThemesEnum.LIGHT;

/** The default them definition */
export const DefaultTheme = LightTheme;
