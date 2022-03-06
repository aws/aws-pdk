import * as pdk_projen from "aws-prototyping-sdk/src/pdk_projen/index";
import * as fs from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser"
import { JsiiProject } from "projen/lib/cdk";
import { Release } from "projen/lib/release";
import { DependencyType } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { PythonProject } from "projen/lib/python";
import { JavaProject } from "projen/lib/java";

const resolveDependencies = (project: NodeProject): NodeProject => {
  // resolutions
  project.addFields({
    resolutions: {
      "ansi-regex": "^5.0.1",
      underscore: "^1.12.1",
      "deep-extend": "^0.5.1",
      debug: "^2.6.9",
    },
  });

  return project;
};

const configureMonorepo = (monorepo: pdk_projen.NxMonorepoProject): pdk_projen.NxMonorepoProject => {
  // Compile pdk as we depend on it in order to bootstrap this repo
  monorepo.defaultTask?.prependExec("cd packages/aws-prototyping-sdk && $(if [ ! -d lib ]; then npx projen compile > /dev/null; fi;)");

  monorepo.addTask("prepare", {
    exec: "husky install",
  });

  const gitSecretsScanTask = monorepo.addTask("git-secrets-scan", {
    exec: "./scripts/git-secrets-scan.sh",
  });

  // Commit lint and commitizen settings
  monorepo.addFields({
    config: {
      commitizen: {
        path: "./node_modules/cz-conventional-changelog",
      },
    },
    commitlint: {
      extends: ["@commitlint/config-conventional"],
    },
  });

  // Update .gitignore
  monorepo.gitignore.exclude(
      "/.tools/",
      "/.idea/",
      ".tmp",
      "LICENSE-THIRD-PARTY",
      ".DS_Store",
      "build"
  );

  resolveDependencies(monorepo);

  monorepo.testTask.spawn(gitSecretsScanTask);

  return monorepo;
};

const configureAwsPrototypingSdk = (project: JsiiProject): JsiiProject => {
  new Release(project, {
    versionFile: "package.json", // this is where "version" is set after bump
    task: project.buildTask,
    branch: "mainline",
    artifactsDirectory: project.artifactsDirectory,
  });

  project.gitignore.exclude("samples");

  // Update npmignore
  [
    "/.gitattributes",
    "/.prettierignore",
    "/.prettierrc.json",
    "/.tmp/",
    "/build/",
    "/docs/",
    "/scripts/",
  ].forEach((s) => project.addPackageIgnore(s));

  // OSS requirements
  const generateAttributionTask = project.addTask("generate:attribution", {
    exec: "cd .tmp && generate-attribution && mv oss-attribution/attribution.txt ../LICENSE-THIRD-PARTY",
  });

  const licenseCheckerTask = project.addTask("license:check", {
    exec: "cd .tmp && license-checker --summary --production --onlyAllow 'MIT;Apache-2.0;Unlicense;BSD;BSD-2-Clause;BSD-3-Clause;ISC;'",
  });

  // task extensions
  project.packageTask.reset();

  // license-checker and attribute-generator requires deps not to be hoisted. This is a workaround for: https://github.com/yarnpkg/yarn/issues/7672
  project.packageTask.exec("./scripts/copy-samples.sh");
  project.packageTask.exec("mkdir -p .tmp && cd .tmp && ln -s -f ../../../node_modules . && ln -s -f ../package.json package.json");
  project.packageTask.spawn(licenseCheckerTask);
  project.packageTask.spawn(generateAttributionTask);
  project.packageTask.exec("if [ ! -z ${CI} ]; then mkdir -p dist && rsync -a . dist --exclude .git --exclude node_modules; fi");
  project.packageTask.spawn(project.tasks.tryFind("package-all")!);
  project.packageTask.exec("rm -rf .tmp");

  project.addTask("clean", {
    exec: "rm -rf dist build lib samples test-reports coverage LICENSE-THIRD-PARTY",
  });

  // jsii requires peer deps not to be hoisted. This is a workaround for: https://github.com/yarnpkg/yarn/issues/7672
  // TODO: make this more robust as this assumes all deps default to the root node_modules
  project.preCompileTask.exec(`rm -rf node_modules && mkdir node_modules && cd node_modules && ${project.deps.all
      .filter(d => d.type === DependencyType.PEER)
      .map(d => `cp -R ../../../node_modules/${d.name} .`)
      .join(" && ")}`);
  project.postCompileTask.exec("rm -rf node_modules");

  // Generate docs for each supported language into a micro-site
  const buildDocsTask = project.addTask("build:docs", {
    exec: "./scripts/build-docs.sh",
  });
  buildDocsTask.prependSpawn(project.preCompileTask);
  project.tasks.tryFind("release:mainline")?.spawn(buildDocsTask);

  // This is need until https://github.com/aws/jsii/issues/3408 is resolved
  project.tasks.tryFind("package:python")?.exec("chmod +x ./scripts/python-package-hack.sh && ./scripts/python-package-hack.sh");

  // eslint extensions
  project.eslint?.addPlugins("header");
  project.eslint?.addRules({
    "header/header": [
      2,
      "line",
      [
        " Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.",
        " SPDX-License-Identifier: Apache-2.0",
      ],
      2,
    ],
  });
  project.eslint?.addRules({
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
  });

  // resolutions
  project.addFields({
    resolutions: {
      "ansi-regex": "^5.0.1",
      underscore: "^1.12.1",
      "deep-extend": "^0.5.1",
      debug: "^2.6.9",
    },
  });

  resolveDependencies(project);

  return project;
};

const configureSampleTs = (project: TypeScriptProject): TypeScriptProject => {
  project.package.addField("private", true);

  project.eslint?.addRules({
    "import/no-extraneous-dependencies": "off",
  });

  return project;
}

const configureSamplePy = (project: PythonProject): PythonProject => {
  // Re-deploy any changes to dependant local packages
  project.tasks.tryFind("install")?.reset();
  project.preCompileTask.exec("pip install --upgrade pip");
  project.preCompileTask.exec("pip install -r requirements.txt --force-reinstall");
  project.preCompileTask.exec("pip install -r requirements-dev.txt");

  return project;
}

const configureSampleJava = (project: JavaProject): JavaProject => {
  project.testTask.exec("mvn test");

  project.deps.postSynthesize = () => {
    const parser = new XMLParser({
      ignoreDeclaration: true
    });
    let pom = parser.parse(fs.readFileSync(`${project.outdir}/pom.xml`));

    pom.project.dependencies.dependency = [...pom.project.dependencies.dependency, {
      groupId: "software.aws.awsprototypingsdk",
      artifactId: "aws-prototyping-sdk",
      version: "0.0.0",
      scope: "system",
      systemPath: "${basedir}/../../packages/aws-prototyping-sdk/dist/java/software/aws/awsprototypingsdk/aws-prototyping-sdk/0.0.0/aws-prototyping-sdk-0.0.0.jar"
    }];

    const builder = new XMLBuilder({
      format: true
    });
    const newPom = builder.build(pom);

    fs.chmodSync(`${project.outdir}/pom.xml`, "600");
    fs.writeFileSync(`${project.outdir}/pom.xml`, newPom, { mode: "400" });
  }

  return project;
}

const monorepo = configureMonorepo(new pdk_projen.NxMonorepoProject({
  defaultReleaseBranch: "mainline",
  eslint: false,
  name: "aws-prototyping-sdk-monorepo",
  devDeps: [
    "aws-prototyping-sdk@0.0.0",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "cz-conventional-changelog",
    "husky",
  ],
  depsUpgradeOptions: {
    exclude: ["aws-prototyping-sdk"]
  }
}));

const awsPrototypingSdk = configureAwsPrototypingSdk(new JsiiProject({
  parent: monorepo,
  outdir: "packages/aws-prototyping-sdk",
  author: "AWS APJ COPE",
  authorAddress: "apj-cope@amazon.com",
  defaultReleaseBranch: "mainline",
  name: "aws-prototyping-sdk",
  docgen: false,
  keywords: ["aws", "pdk", "jsii", "projen"],
  prettier: true,
  repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
  devDeps: [
    "@nrwl/devkit",
    "aws-cdk-lib",
    "constructs",
    "eslint-plugin-header",
    "exponential-backoff",
    "jsii-docgen",
    "jsii-pacmak",
    "license-checker",
    "oss-attribution-generator",
    "standard-version@^9",
  ],
  bundledDeps: ["fast-xml-parser"],
  peerDeps: ["projen", "constructs", "aws-cdk-lib"],
  deps: ["constructs", "aws-cdk-lib"],
  publishToPypi: {
    distName: "aws_prototyping_sdk",
    module: "aws_prototyping_sdk",
  },
  publishToMaven: {
    mavenEndpoint: "https://aws.oss.sonatype.org",
    mavenGroupId: "software.aws.awsprototypingsdk",
    mavenArtifactId: "aws-prototyping-sdk",
    javaPackage: "software.aws.awsprototypingsdk",
  }
}));

configureSampleTs(new TypeScriptProject({
  parent: monorepo,
  outdir: "samples/sample-nx-monorepo",
  defaultReleaseBranch: "mainline",
  name: "sample-nx-monorepo",
  sampleCode: false,
  deps: [
    "aws-cdk-lib",
    "constructs",
    "aws-prototyping-sdk@0.0.0"
  ],
  depsUpgradeOptions: {
    exclude: ["aws-prototyping-sdk"]
  }
}));

configureSampleTs(new TypeScriptProject({
  parent: monorepo,
  outdir: "samples/sample-pdk-pipeline-ts",
  defaultReleaseBranch: "mainline",
  name: "sample-pdk-pipeline-ts",
  sampleCode: false,
  deps: [
    "aws-cdk-lib",
    "constructs",
    "aws-prototyping-sdk@0.0.0"
  ],
  depsUpgradeOptions: {
    exclude: ["aws-prototyping-sdk"]
  }
}));

const samplePdkPipelinePy = configureSamplePy(new PythonProject({
  parent: monorepo,
  outdir: "samples/sample-pdk-pipeline-py",
  authorEmail: "",
  authorName: "",
  moduleName: "infra",
  sample: false,
  name: "sample-pdk-pipeline-py",
  version: "0.0.0",
  deps: [
    "aws-cdk-lib",
    "constructs",
    "../../packages/aws-prototyping-sdk/dist/python/aws_prototyping_sdk-0.0.0-py3-none-any.whl"
  ],
}));

const samplePdkPipelineJava = configureSampleJava(new JavaProject({
  parent: monorepo,
  outdir: "samples/sample-pdk-pipeline-java",
  artifactId: 'sample-pdk-pipeline-java',
  groupId: 'sample.pdk.pipeline',
  name: "sample-pdk-pipeline-java",
  version: "0.0.0",
  sample: false,
  junit: false,
  deps: [
    "software.amazon.awscdk/aws-cdk-lib@2.15.0",
  ],
  testDeps: [
    "org.junit.jupiter/junit-jupiter-api@5.7.0",
    "org.junit.jupiter/junit-jupiter-engine@5.7.0"
  ]
}));

monorepo.addImplicitDependency(samplePdkPipelinePy, awsPrototypingSdk);
monorepo.addImplicitDependency(samplePdkPipelineJava, awsPrototypingSdk);

monorepo.synth();
