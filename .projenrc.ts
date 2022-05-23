import * as fs from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser"
import { Project } from 'projen';
import { NodeProject } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { PythonProject } from "projen/lib/python";
import { JavaProject } from "projen/lib/java";
import { Maturity, PDKProject } from "@aws/aws-pdk-project/src/project";
import { NxMonorepoProject, TargetDependencyProject } from "@aws/aws-pdk-nx-monorepo/src";

const resolveDependencies = (project: NodeProject): NodeProject => {
  // resolutions
  project.addFields({
    resolutions: {
      "@types/prettier": "2.6.0",
      "ansi-regex": "^5.0.1",
      underscore: "^1.12.1",
      "deep-extend": "^0.5.1",
      debug: "^2.6.9",
      "minimist": "^1.2.6",
      "ejs": "^3.1.7",
      "async": "^2.6.4"
    },
  });

  return project;
};

const configureUpgradeDependenciesTask = (project: Project): any => {
  const upgradeTask = project.tasks.tryFind("upgrade");
  upgradeTask && project.addTask("upgrade-deps").spawn(upgradeTask);

  return project;
}

const configureMonorepo = (monorepo: NxMonorepoProject): NxMonorepoProject => {
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

  const upgradeDepsTask = monorepo.addTask("upgrade-deps");
  upgradeDepsTask.exec("npx nx run-many --target=upgrade-deps --all --parallel=1");
  upgradeDepsTask.exec("npx projen upgrade");

  return monorepo;
};

const configureSampleTs = (project: TypeScriptProject): TypeScriptProject => {
  project.package.addField("private", true);

  project.eslint?.addRules({
    "import/no-extraneous-dependencies": "off",
  });

  return configureUpgradeDependenciesTask(project);
}

const configureSamplePy = (project: PythonProject): PythonProject => {
  // Re-deploy any changes to dependant local packages
  project.tasks.tryFind("install")?.reset();
  project.preCompileTask.exec("pip install --upgrade pip");
  project.preCompileTask.exec("pip install -r requirements.txt --force-reinstall");
  project.preCompileTask.exec("pip install -r requirements-dev.txt");

  return configureUpgradeDependenciesTask(project);
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
      systemPath: "${basedir}/../../../../../dist/java/software/aws/awsprototypingsdk/aws-pdk-lib/0.0.0/aws-pdk-lib-0.0.0.jar"
    }];

    const builder = new XMLBuilder({
      format: true
    });
    const newPom = builder.build(pom);

    fs.chmodSync(`${project.outdir}/pom.xml`, "600");
    fs.writeFileSync(`${project.outdir}/pom.xml`, newPom, { mode: "400" });
  }

  return configureUpgradeDependenciesTask(project);
}


const monorepo = configureMonorepo(new NxMonorepoProject({
  defaultReleaseBranch: "mainline",
  eslint: false,
  name: "aws-prototyping-sdk-monorepo",
  devDeps: [
    "@aws/aws-pdk-project@0.0.0",
    "@aws/aws-pdk-nx-monorepo@0.0.0",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "cz-conventional-changelog",
    "fast-xml-parser",
    "husky",
  ],
  depsUpgradeOptions: {
    exclude: ["@aws/aws-pdk-nx-monorepo", "@aws/aws-pdk-project"]
  },
  targetDependencies: {
    upgrade: [
      {
        target: "upgrade",
        projects: TargetDependencyProject.DEPENDENCIES
      }
    ]
  },
  noHoistGlobs: [
    "**/@aws/*/aws-cdk-lib",
    "**/@aws/*/aws-cdk-lib/*",
    "**/@aws/*/projen",
    "**/@aws/*/projen/*",
    "**/@aws/*/constructs",
    "**/@aws/*/constructs/*"
  ]
}));

const pdkProject = new TypeScriptProject({
  parent: monorepo,
  outdir: "tools/@aws/aws-pdk-project",
  defaultReleaseBranch: "mainline",
  name: "@aws/aws-pdk-project",
  sampleCode: false,
  devDeps: [
    "projen",
  ],
  peerDeps: ["projen"]
});

pdkProject.package.addField("private", true);

const uberGen = new TypeScriptProject({
  parent: monorepo,
  outdir: "tools/@aws/aws-pdk-ubergen",
  defaultReleaseBranch: "mainline",
  name: "@aws/aws-pdk-ubergen",
  sampleCode: false,
  bin: {
    "ubergen": "bin/ubergen"
  },
  tsconfig: {
    include: ["**/bin/*.ts"],
    compilerOptions: {
      rootDir: ".",
      outDir: undefined
    }
  },
  gitignore: ["*.d.ts", "*.js"],
  devDeps: ["@types/fs-extra"],
  deps: ["fs-extra"]
});

uberGen.package.addField("private", true);
uberGen.postCompileTask.exec("npm link");

new TypeScriptProject({
  parent: monorepo,
  outdir: "tools/@aws/aws-pdk-docgen",
  defaultReleaseBranch: "mainline",
  name: "@aws/aws-pdk-docgen",
  sampleCode: false,
  bin: {
    "docgen": "bin/docgen"
  },
  devDeps: ["exponential-backoff", "jsii-docgen"],
  deps: ["fs-extra"]
});

uberGen.package.addField("private", true);
uberGen.postCompileTask.exec("npm link");

new PDKProject({
  parent: monorepo,
  author: "AWS APJ COPE",
  authorAddress: "apj-cope@amazon.com",
  defaultReleaseBranch: "mainline",
  name: "aws-pdk-pipeline",
  keywords: ["aws", "pdk", "jsii", "projen"],
  repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
  devDeps: [
    "projen",
    "aws-cdk-lib",
    "constructs"
  ],
  peerDeps: [
    "projen",
    "aws-cdk-lib",
    "constructs"
  ],
  maturity: Maturity.STABLE
});

const samplePdkPipelineTs = configureSampleTs(new TypeScriptProject({
  parent: monorepo,
  outdir: "packages/@aws/aws-pdk-pipeline/samples/typescript",
  defaultReleaseBranch: "mainline",
  name: "pdk-pipeline-sample-ts",
  sampleCode: false,
  deps: [
    "aws-cdk-lib",
    "constructs",
    "@aws/aws-pdk-lib@0.0.0"
  ],
}));

const samplePdkPipelinePy = configureSamplePy(new PythonProject({
  parent: monorepo,
  outdir: "packages/@aws/aws-pdk-pipeline/samples/python",
  authorEmail: "",
  authorName: "",
  moduleName: "infra",
  sample: false,
  name: "pdk-pipeline-sample-py",
  version: "0.0.0",
  deps: [
    "aws-cdk-lib",
    "constructs",
    "pyhumps",
    "../../../../../dist/python/aws_prototyping_sdk-0.0.0-py3-none-any.whl"
  ],
}));

const samplePdkPipelineJava = configureSampleJava(new JavaProject({
  parent: monorepo,
  outdir: "packages/@aws/aws-pdk-pipeline/samples/java",
  artifactId: 'pdk-pipeline-sample-java',
  groupId: 'pdk.pipeline.sample',
  name: "pdk-pipeline-sample-java",
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

const nxMonorepoProject = new PDKProject({
  parent: monorepo,
  author: "AWS APJ COPE",
  authorAddress: "apj-cope@amazon.com",
  defaultReleaseBranch: "mainline",
  name: "aws-pdk-nx-monorepo",
  keywords: ["aws", "pdk", "jsii", "projen"],
  repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
  devDeps: ["projen"],
  peerDeps: ["projen"],
  maturity: Maturity.STABLE
});

const awsPdkLib = new PDKProject({
  parent: monorepo,
  author: "AWS APJ COPE",
  authorAddress: "apj-cope@amazon.com",
  defaultReleaseBranch: "mainline",
  name: "aws-pdk-lib",
  keywords: ["aws", "pdk", "jsii", "projen"],
  repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
  devDeps: ["@aws/aws-pdk-nx-monorepo@0.0.0", "@aws/aws-pdk-pipeline@0.0.0", "@aws/aws-pdk-ubergen@0.0.0", "projen", "constructs", "aws-cdk-lib"],
  peerDeps: ["projen", "constructs", "aws-cdk-lib"],
  maturity: Maturity.STABLE,
  sampleCode: false,
  excludeTypescript: ["**/samples/**"],
  outdir: ".",
  publishToPypiConfig: {
    distName: `aws_prototyping_sdk`,
    module: `aws_prototyping_sdk`,
  },
  publishToMavenConfig: {
    mavenEndpoint: 'https://aws.oss.sonatype.org',
    mavenGroupId: 'software.aws.awsprototypingsdk',
    mavenArtifactId: `aws-pdk-lib`,
    javaPackage: `software.aws.awsprototypingsdk`,
  }
});

awsPdkLib.preCompileTask.exec("ubergen");
awsPdkLib.package.addField("ubergen", {
  "exclude": true,
  "excludeExperimentalModules": true
});
awsPdkLib.package.addField("main", "./index.js");
awsPdkLib.package.addField("types", "./index.d.ts");
awsPdkLib.package.manifest.jsii.tsc.rootDir = ".";
awsPdkLib.package.manifest.jsii.tsc.outDir = ".";

const copyDistTask = awsPdkLib.addTask("copy-dist", {
  exec: "rm -rf ../../../dist && cp -R ./dist ../../.."
});

awsPdkLib.packageTask.spawn(copyDistTask);

monorepo.addImplicitDependency(samplePdkPipelineTs, awsPdkLib);
monorepo.addImplicitDependency(samplePdkPipelinePy, awsPdkLib);
monorepo.addImplicitDependency(samplePdkPipelineJava, awsPdkLib);

nxMonorepoProject.compileTask.exec("rsync -a ./src/** ./lib --include=\"*/\" --include=\"**/*.js\" --exclude=\"*\" --prune-empty-dirs");

monorepo.synth();
