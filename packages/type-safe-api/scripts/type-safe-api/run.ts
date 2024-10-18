#!/usr/bin/env node
import { parse } from "ts-command-line-args";
import generateMockData from "./custom/mock-data/generate-mock-data";
import parseOpenapiSpec from "./parser/parse-openapi-spec";
import generate from "./generators/generate-next";
import generateAsyncapiSpec from "./custom/generate-asyncapi-spec/generate-asyncapi-spec";
import copyGradleWrapper from "./custom/gradle-wrapper/copy-gradle-wrapper";
import copyAsyncSmithyTransformer from "./custom/smithy-async-transformer/copy-transformer";
import * as path from "path";

interface SubCommandArgs {
  readonly command: string;
}

void (async () => {
  const subCommandArgs = parse<SubCommandArgs>({
    command: { type: String, defaultOption: true },
  }, { stopAtFirstUnknown: true });

  const argv = (subCommandArgs as any)._unknown as string[];

  const rootScriptDir = path.resolve(__dirname);

  switch (subCommandArgs.command) {
    case "generate-mock-data":
      return await generateMockData(argv);
    case "parse-openapi-spec":
      return await parseOpenapiSpec(argv);
    case "generate-asyncapi-spec":
      return await generateAsyncapiSpec(argv);
    case "generate":
      return await generate(argv, rootScriptDir);
    case "copy-gradle-wrapper":
      return await copyGradleWrapper(argv, rootScriptDir);
    case "copy-async-smithy-transformer":
      return await copyAsyncSmithyTransformer(argv, rootScriptDir);
    default:
      throw new Error(`Unknown subcommand ${subCommandArgs.command}`);
  }
})();
