import * as fs from 'fs';

/**
 * Manually apply https://github.com/cdklabs/jsii-docgen/pull/644 to speed up doc generation.
 * TODO: Remove this awful hack once the above PR has been merged!
 */
const main = () => {
  const fileToPatch = require.resolve("jsii-docgen/lib/docgen/view/documentation");

  let contents = fs.readFileSync(fileToPatch, 'utf-8');
  contents = contents.replace("await fs.copy(this.assembliesDir, workdir);", "");
  contents = contents.replace(
    "for (let dotJsii of await glob.promise(`${workdir}/**/${spec_1.SPEC_FILE_NAME}`)) {",
    "for (let dotJsii of await glob.promise(`${this.assembliesDir}/**/${spec_1.SPEC_FILE_NAME}`)) {");
  contents = contents.replace(
    "{ loose: options.loose, unknownSnippets: jsii_rosetta_1.UnknownSnippetMode.FAIL }",
    "{ loose: options.loose, unknownSnippets: jsii_rosetta_1.UnknownSnippetMode.FAIL, outdir: workdir }")
  contents = contents.replace(
    "dotJsii = path.join(packageDir, `${spec_1.SPEC_FILE_NAME}.${language}`);",
    "dotJsii = path.join(workdir, `${spec_1.SPEC_FILE_NAME}.${language}`);");
  fs.writeFileSync(fileToPatch, contents);
};

main();
