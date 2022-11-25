/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * Graph font family
 * @internal
 */
export const FONT_FAMILY = "Roboto Condensed";

enum FontWeights {
  LIGHT = 300,
  REGULAR = 400,
  BOLD = 700,
}

enum FontStyles {
  NORMAL = "normal",
  ITALIC = "italic",
}

/**
 * Graph font stylesheet
 * @internal
 */
export const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;700&display=swap";

function fontClassName(
  weight: keyof typeof FontWeights,
  style: keyof typeof FontStyles
): string {
  if (style === "NORMAL") {
    return `font_${weight.toLowerCase()}`;
  }

  return `font_${weight.toLowerCase()}_${style.toLowerCase()}`;
}

function defineGraphFont(
  weight: keyof typeof FontWeights,
  style: keyof typeof FontStyles
): { fontname: string; class: string } {
  return {
    fontname: FONT_FAMILY,
    class: fontClassName(weight, style),
  };
}

/**
 * Graph fonts
 * @internal
 */
export const GraphFonts = {
  LIGHT: defineGraphFont("LIGHT", "NORMAL"),
  LIGHT_ITALIC: defineGraphFont("LIGHT", "ITALIC"),
  REGULAR: defineGraphFont("REGULAR", "NORMAL"),
  REGULAR_ITALIC: defineGraphFont("REGULAR", "ITALIC"),
  BOLD: defineGraphFont("BOLD", "NORMAL"),
  BOLD_ITALIC: defineGraphFont("BOLD", "ITALIC"),
} as const;

/**
 * Graph font css style classes
 * @internal
 */
export const FONT_CSS_CLASSES = Object.keys(GraphFonts).reduce(
  (_css, _fontKey): string => {
    const [_weightKey, _styleKey = "NORMAL"] = _fontKey.split("_") as [
      keyof typeof FontWeights,
      keyof typeof FontStyles | undefined
    ];
    const _className = fontClassName(_weightKey, _styleKey);
    const _weight = FontWeights[_weightKey];
    const _style = FontStyles[_styleKey];

    return (
      _css +
      `\n.${_className} { font-family: "${FONT_FAMILY}", sans-serif; font-style: ${_style}; font-weight: ${_weight}; }`
    );
  },
  ""
);
