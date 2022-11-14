/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsArchitecture } from "@aws-prototyping-sdk/aws-arch";
import * as fs from "fs-extra";
import he = require("he"); // eslint-disable-line @typescript-eslint/no-require-imports
import sharp = require("sharp"); // eslint-disable-line @typescript-eslint/no-require-imports
import * as svgson from "svgson";
import traverse = require("traverse"); // eslint-disable-line @typescript-eslint/no-require-imports
import { AmazonEmberFontConfig } from "../fonts";

const XLINK_HREF = "xlink:href";

const DATAURL_SVG_BASE64 = "data:image/svg+xml;base64,";
const DATAURL_PNG_BASE64 = "data:image/png;base64,";

const AMAZON_EMBER_FONTS = Object.values(AmazonEmberFontConfig);

/**
 * Convert svg image definition from svg to png.
 *
 * This is necessary before able to convert full svg to png, as without this
 * step the nested svg images are not rendered in final png.
 * @param svgString - SVG string to convert
 * @returns Returns the converted SVG string
 * @internal
 */
export async function convertSvgImageDefsFromSvgToPng(
  svgString: string
): Promise<string> {
  // https://github.com/lovell/sharp/issues/2844
  const svg = await svgson.parse(svgString);

  const defs = (
    svg.children.find((child) => child.name === "defs")?.children || []
  ).filter((def) => {
    return (
      def.name === "image" &&
      def.attributes[XLINK_HREF]?.startsWith(DATAURL_SVG_BASE64)
    );
  });

  for (const def of defs) {
    const assetKey = def.attributes.id as string;
    const pngBuffer = await sharp(
      AwsArchitecture.resolveAssetPath(
        AwsArchitecture.formatAssetPath(assetKey, "png")
      )
    ).toBuffer();
    def.attributes[XLINK_HREF] = encodeDataUrl(pngBuffer, DATAURL_PNG_BASE64);
  }

  return svgson.stringify(svg);
}

/**
 * Convert svg value to a given output file
 * @param svgString - SVG to convert
 * @param outputFile - The output file to generate from svg, the format is inferred from file extension
 * @internal
 */
export async function convertSvg(
  svgString: string,
  outputFile: string
): Promise<void> {
  const resolvedSvg = await convertSvgImageDefsFromSvgToPng(svgString);
  await sharp(Buffer.from(resolvedSvg))
    .trim({ background: "transparent" })
    .toFile(outputFile);
}

/**
 * Extract SVG dimensions (width / height)
 * @internal
 */
export async function extractSvgDimensions(
  svgString: string
): Promise<{ width: string; height: string }> {
  const svg = await svgson.parse(svgString);

  return {
    width: svg.attributes.width,
    height: svg.attributes.height,
  };
}

/**
 * Resolve SVG fonts - which replaced font-config from dot format to html/svg font-family and styles
 * @internal
 */
export function resolveSvgFonts(svg: svgson.INode): void {
  traverse(svg).map(function (this: traverse.TraverseContext, x) {
    if (
      this.key === "font-family" &&
      this.parent &&
      AMAZON_EMBER_FONTS.includes(x)
    ) {
      const fontAttributes = marshalFontAttributes(x);
      traverse(svg).set(
        this.path,
        `${fontAttributes["font-family"]}, Arial Narrow, sans-serif`
      );
      fontAttributes["font-style"] &&
        traverse(svg).set(
          this.parent.path.concat(["font-style"]),
          fontAttributes["font-style"]
        );
      fontAttributes["font-weight"] &&
        traverse(svg).set(
          this.parent.path.concat(["font-weight"]),
          fontAttributes["font-weight"]
        );
    }
  });
}

/**
 * Resolve SVG image paths to inline base64 **Data URLs**.
 * @internal
 */
export async function resolveSvgImagesInline(svg: svgson.INode): Promise<void> {
  const imageDefs = new Map<string, svgson.INode>();

  svg = traverse(svg).forEach(function (this: traverse.TraverseContext, x) {
    if (typeof x === "object" && x.type === "element") {
      const node = x as svgson.INode;
      if (
        node.name === "image" &&
        node.attributes[XLINK_HREF]?.startsWith(AwsArchitecture.assetDirectory)
      ) {
        const {
          width,
          height,
          value,
          [XLINK_HREF]: assetPath,
          ...attributes
        } = node.attributes;

        const id = AwsArchitecture.parseAssetPath(assetPath!).assetKey;

        if (!imageDefs.has(id)) {
          imageDefs.set(id, {
            type: "element",
            name: "image",
            value,
            children: [],
            attributes: {
              id,
              width,
              height,
              [XLINK_HREF]: assetPath,
            },
          });
        }

        const useDefNode: svgson.INode = {
          type: "element",
          name: "use",
          value,
          children: [],
          attributes: {
            ...attributes,
            [XLINK_HREF]: `#${id}`,
          },
        };

        this.update(useDefNode, true);
      }
    }
  });

  for (const [, imageDef] of imageDefs.entries()) {
    const href = imageDef.attributes[XLINK_HREF];
    imageDef.attributes[XLINK_HREF] = await encodeSvgFileDataUrl(href);
  }

  svg.children.unshift({
    type: "element",
    name: "defs",
    value: "",
    attributes: {},
    children: Array.from(imageDefs.values()),
  });
}

/**
 * Encode buffer as base64 encoded **Data URL**
 * @internal
 */
export function encodeDataUrl(buffer: Buffer, prefix: string): string {
  return prefix + buffer.toString("base64");
}

/**
 * Encode string as html and base64 encoded **Data URL**
 * @internal
 */
export function encodeHtmlDataUrl(data: string, prefix: string): string {
  return encodeDataUrl(
    Buffer.from(unescape(encodeURIComponent(data)), "utf-8"),
    prefix
  );
}

/**
 * Encode SVG file as base64 encoded **Data URL**
 * @internal
 */
export async function encodeSvgFileDataUrl(svgFile: string): Promise<string> {
  const svgXml = await fs.readFile(svgFile, { encoding: "utf-8" });
  return encodeHtmlDataUrl(svgXml, DATAURL_SVG_BASE64);
}

/**
 * Decode SVG base64 encoded **Data URL** to string
 * @internal
 */
export function decodeSvgDataUrl(svgDataUrl: string): string {
  svgDataUrl = svgDataUrl.replace(DATAURL_SVG_BASE64, "");
  return decodeURIComponent(
    escape(Buffer.from(svgDataUrl, "base64").toString("utf-8"))
  );
}

interface SvgFontAttributes {
  "font-family": string;
  "font-style"?: string;
  "font-weight"?: string;
}

function marshalFontAttributes(
  fontFamily: AmazonEmberFontConfig
): SvgFontAttributes {
  const [family, style] = fontFamily.split(":");

  const families = family.split(",");
  const styles = new Set<string>(
    style.split(",").flatMap((v) => v.toLowerCase().split(" "))
  );

  const attributes: SvgFontAttributes = {
    "font-family": families.pop() as string,
  };

  for (const _style of styles) {
    switch (_style) {
      case "bold": {
        attributes["font-style"] = "bold";
        break;
      }
      case "italic": {
        attributes["font-style"] = "italic";
      }
    }
  }

  return attributes;
}

const CSS_TRANSFORM_SCALE = /scale\((?<scale>[^)]+)\)/i;

/**
 * SVG `viewBox` struct
 * @internal
 */
export interface SvgViewBox {
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Reconcile svg viewBox attribute based on root container ([g](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g)) scale.
 * @param svg Svg to reconcile
 * @returns Returns the reconciled `viewBox` attribute value, or original if no scaling available on container
 * @throws Error if svg does not define `viewBox` attribute
 * @internal
 */
export function reconcileViewBox(svg: svgson.INode): string {
  const viewBox = parseSvgViewBox(svg);
  if (viewBox == null || !viewBox.width || !viewBox.height) {
    throw new Error("Svg `viewBox` undefined or does not define dimensions");
  }
  const container = getSvgRootContainer(svg);
  if (container == null) {
    return stringifySvgViewBox(viewBox);
  }

  // let [x, y, width, height] = viewBox.split(" ").map((v) => parseFloat(v)) as [number, number, number, number];
  const scale = parseSvgTransformScale(container);
  if (scale == null) {
    return stringifySvgViewBox(viewBox);
  }

  // const [scale0, scale1] = (transformScale.split(" ")).map((v) => parseFloat(v));
  // container.attributes.comment = `scope: ${scale0} ${scale1}`

  const scaledViewBox: SvgViewBox = {
    ...viewBox,
    width: viewBox.width * (scale[0] || 1),
    height: viewBox.height * (scale[1] || scale[0] || 1),
  };

  return stringifySvgViewBox(scaledViewBox);
}

/**
 * Get SVG root container - the first "g" element
 * @internal
 */
export function getSvgRootContainer(
  svg: svgson.INode
): svgson.INode | undefined {
  return svg.children.find((child) => child.name === "g");
}

/** Parse SVG viewBox */
export function parseSvgViewBox(
  svgOrViewBox: svgson.INode | string
): SvgViewBox | undefined {
  let viewBox: string;
  if (typeof svgOrViewBox === "object") {
    viewBox = svgOrViewBox.attributes.viewBox;
  } else {
    viewBox = svgOrViewBox;
  }
  if (viewBox == null || viewBox === "") {
    return undefined;
  }
  let [x, y, width, height] = viewBox.split(" ").map((v) => parseFloat(v)) as [
    number,
    number,
    number,
    number
  ];

  return {
    x: x || 0,
    y: y || 0,
    width,
    height,
  };
}

/** Stringify SVG viewBox attribute */
export function stringifySvgViewBox(viewBox: SvgViewBox): string {
  return [viewBox.x, viewBox.y, viewBox.width, viewBox.height]
    .filter((v) => v != null)
    .join(" ");
}

/** Parse SVG transform attribute scale property */
export function parseSvgTransformScale(
  elementOrTransform: svgson.INode | string
): number[] | undefined {
  let transform: string;
  if (typeof elementOrTransform === "object") {
    transform = elementOrTransform.attributes.transform;
  } else {
    transform = elementOrTransform;
  }
  if (transform == null || transform === "") {
    return undefined;
  }

  const transformScale = transform?.match(CSS_TRANSFORM_SCALE)?.groups?.scale;
  if (transformScale == null) {
    return undefined;
  }

  return transformScale.split(" ").map((v) => parseFloat(v));
}

/**
 * Unescape SVG **text** values.
 *
 * *dot-wasm* escapes svg text ("-" -> "&#45;") and [svgson](https://github.com/elrumordelaluz/svgson/blob/e7234b645b4e344f525d4d2fde2d3f2911d3a75a/src/stringify.js#L20)
 * escapes strings that contain *&...* by wrapping in `<![CDATA[...]]>` tag which causes the
 * resulting text value in SVG and PNG files to show raw escaped value (`&#45;`).
 *
 * We expect to have the original text values rendered rather than escaped version rendered.
 *
 * @example `Diagram (hyphenated&#45;value)` => `Diagram (hyphenated-value)`
 * @internal
 */
export function unescapeSvgTextValues(svg: svgson.INode): void {
  traverse(svg).forEach(function (this: traverse.TraverseContext, x) {
    if (this.key === "value" && typeof x === "string" && x !== "") {
      if (x.includes("&")) {
        this.update(he.decode(x), true);
      }
    }
  });
}
