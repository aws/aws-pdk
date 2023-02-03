/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { DarkTheme } from "./dark";
import { LightTheme } from "./light";
import { Themes, Theme } from "./types";

export * from "./types";
export * from "./light";
export * from "./dark";

/** The default theme id */
export const DefaultThemeId: Themes = "light";

/** The default them definition */
export const DefaultTheme = LightTheme;

export function resolveTheme(themeId?: Themes): Theme {
  if (themeId === "dark") {
    return DarkTheme;
  }
  if (themeId === "light") {
    return LightTheme;
  }

  return DefaultTheme;
}
