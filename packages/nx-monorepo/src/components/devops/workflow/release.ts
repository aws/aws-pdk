/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { WorkflowActions } from "projen/lib/github/workflow-actions";
import { Job, JobPermission, JobStep } from "projen/lib/github/workflows-model";
import { BaseWorkflow, BaseWorkflowOptions } from "./base";
import { DevOpsWorkflows } from "./common";

/** @experimental */
export interface ReleaseWorkflowOptions extends BaseWorkflowOptions {
  readonly name?: string;

  readonly branch?: string;
}

/** @experimental */
export class ReleaseWorkflow extends BaseWorkflow {
  readonly branch: string;

  constructor(project: Project, options: ReleaseWorkflowOptions) {
    const branch = options.branch || DevOpsWorkflows.Constants.MAIN_BRANCH;

    super(project, options.name || "release", {
      ...options,
      env: {
        NX_BRANCH: branch,
        ...options.env,
      },
    });

    this.branch = branch;

    this.on({
      push: {
        branches: [this.branch],
      },
      workflowDispatch: {},
    });

    this.addJob("release", this._release());
    this.addJob("release_github", this._releaseGithub());
    this.addJob("release_npm", this._releaseNpm());
    this.addJob("release_maven", this._releaseMaven());
    this.addJob("release_pypi", this._releasePypi());
    this.addJob("release_docs", this._releaseDocs());
  }

  /**
   * @internal
   */
  protected _release(): Job {
    return {
      name: "Create release artifacts",
      permissions: {
        contents: JobPermission.WRITE,
      },
      runsOn: ["ubuntu-latest"],
      outputs: {
        latest_commit: {
          outputName: "latest_commit",
          stepId: "git_remote",
        },
      },
      steps: [
        ...DevOpsWorkflows.Actions.checkoutFullHistory(),
        ...DevOpsWorkflows.Actions.nxSetShas(this.branch),
        ...WorkflowActions.setGitIdentity({
          name: "github-actions",
          email: "github-actions@github.com",
        }),
        this.initAction.use(),
        ...DevOpsWorkflows.Actions.buildTask(this.project),
        ...DevOpsWorkflows.Actions.runManyTask(
          this.project,
          "release:mainline"
        ),
        ...DevOpsWorkflows.Actions.checkForMutations(),
        {
          name: "Check for new commits",
          id: "git_remote",
          run: 'echo ::set-output name=latest_commit::"$(git ls-remote origin -h ${{ github.ref }} | cut -f1)"',
        },
        {
          name: "Extract Dists",
          run: 'rsync -a . ./dist --include="*/" --include="/public/docs/dist/**" --include="/packages/*/dist/**" --exclude="*" --prune-empty-dirs',
        },
        ...DevOpsWorkflows.Actions.uploadArtifact("build-artifact", "dist", {
          if: "${{ steps.git_remote.outputs.latest_commit == github.sha }}",
        }),
      ],
    };
  }

  protected _publibCommand(dir: string, publibCmd: string): string {
    return `for d in *; do cd $d && ( [ -d "${dir}" ] && npx --package publib@latest ${publibCmd} || echo "Ignore \`basename $PWD\` - no ${dir}" ) && cd ..; done;`;
  }

  protected _releaseJobFactory(
    name: string,
    permissions: JobPermission,
    steps: JobStep[]
  ): Job {
    return {
      name: name,
      needs: ["release"],
      runsOn: ["ubuntu-latest"],
      permissions: {
        contents: permissions,
      },
      if: "needs.release.outputs.latest_commit == github.sha",
      steps: [
        ...DevOpsWorkflows.Actions.setupNode(this.project),
        ...DevOpsWorkflows.Actions.downloadArtifact("build-artifact", "dist"),
        ...steps,
      ],
    };
  }

  protected _releaseGithub(): Job {
    return this._releaseJobFactory(
      "Publish to GitHub Releases",
      JobPermission.WRITE,
      [
        {
          name: "Release",
          run: 'errout=$(mktemp); gh release create $(cat dist/releasetag.txt) -R $GITHUB_REPOSITORY -F dist/changelog.md -t $(cat dist/releasetag.txt) --target $GITHUB_REF 2> $errout && true; exitcode=$?; if [ $exitcode -ne 0 ] && ! grep -q "Release.tag_name already exists" $errout; then cat $errout; exit $exitcode; fi',
          workingDirectory: "dist/packages/aws-prototyping-sdk",
          env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
            GITHUB_REPOSITORY: "${{ github.repository }}",
            GITHUB_REF: "${{ github.ref }}",
          },
        },
      ]
    );
  }

  protected _releaseNpm(): Job {
    return this._releaseJobFactory("Publish to NPM", JobPermission.READ, [
      {
        name: "Release",
        workingDirectory: "dist/packages",
        run: this._publibCommand("dist/js", "publib-npm"),
        env: {
          NPM_DIST_TAG: "latest",
          NPM_REGISTRY: "registry.npmjs.org",
          NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
        },
      },
    ]);
  }

  protected _releaseMaven(): Job {
    return this._releaseJobFactory(
      "Publish to Maven Central",
      JobPermission.READ,
      [
        {
          uses: "actions/setup-java@v2",
          with: {
            distribution: "temurin",
            "java-version": "11.x",
          },
        },
        {
          name: "Release",
          workingDirectory: "dist/packages",
          run: this._publibCommand("dist/java", "publib-maven"),
          env: {
            MAVEN_ENDPOINT: "https://aws.oss.sonatype.org",
            MAVEN_GPG_PRIVATE_KEY: "${{ secrets.MAVEN_GPG_PRIVATE_KEY }}",
            MAVEN_GPG_PRIVATE_KEY_PASSPHRASE:
              "${{ secrets.MAVEN_GPG_PRIVATE_KEY_PASSPHRASE }}",
            MAVEN_PASSWORD: "${{ secrets.MAVEN_PASSWORD }}",
            MAVEN_USERNAME: "${{ secrets.MAVEN_USERNAME }}",
            MAVEN_STAGING_PROFILE_ID: "${{ secrets.MAVEN_STAGING_PROFILE_ID }}",
          },
        },
      ]
    );
  }

  protected _releasePypi(): Job {
    return this._releaseJobFactory("Publish to Pypi", JobPermission.READ, [
      {
        uses: "actions/setup-python@v2",
        with: {
          "python-version": "3.x",
        },
      },
      {
        name: "Release",
        workingDirectory: "dist/packages",
        run: this._publibCommand("dist/python", "publib-pypi"),
        env: {
          TWINE_USERNAME: "${{ secrets.TWINE_USERNAME }}",
          TWINE_PASSWORD: "${{ secrets.TWINE_PASSWORD }}",
        },
      },
    ]);
  }

  protected _releaseDocs(): Job {
    return {
      name: "Publish to Docs",
      needs: ["release_github"],
      runsOn: ["ubuntu-latest"],
      permissions: {
        contents: JobPermission.WRITE,
      },
      if: "needs.release.outputs.latest_commit == github.sha",
      steps: [
        ...DevOpsWorkflows.Actions.checkoutGithubPages(),
        ...DevOpsWorkflows.Actions.downloadArtifact("build-artifact", "dist"),
        ...WorkflowActions.setGitIdentity({
          name: "AWS PDK Automation",
          email: "aws-pdk+automation@amazon.com",
        }),
        {
          name: "Upload docs to Github",
          run: "zip -r docs.zip dist/public/docs/dist/docs/* && gh release upload $(cat dist/packages/aws-prototyping-sdk/dist/releasetag.txt) -R $GITHUB_REPOSITORY docs.zip && rm docs.zip",
          env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
            GITHUB_REPOSITORY: "${{ github.repository }}",
          },
        },
        {
          name: "Prepare Commit",
          run: "mv dist/public/docs/dist ${{ runner.temp }}/dist\nrsync --delete --exclude=.git --recursive ${{ runner.temp }}/dist/docs/ .\ntouch .nojekyll\ngit add .\ngit diff --cached --exit-code >/dev/null || (git commit -am 'docs: publish from ${{ github.sha }}')",
        },
        {
          name: "Push",
          run: "git push origin gh-pages:gh-pages",
        },
      ],
    };
  }
}
