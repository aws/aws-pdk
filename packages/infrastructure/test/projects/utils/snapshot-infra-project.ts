/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CloudscapeReactTsWebsiteProject } from "@aws/cloudscape-react-ts-website";
import { MonorepoTsProject } from "@aws/monorepo";
import {
  Language,
  ModelLanguage,
  TypeSafeApiProject,
} from "@aws/type-safe-api";
import { Project, ProjectOptions } from "projen";
import { synthSnapshot } from "projen/lib/util/synth";

export interface BuildOptionsProps {
  readonly typeSafeApi: TypeSafeApiProject;
  readonly cloudscapeReactTsWebsite: CloudscapeReactTsWebsiteProject;
}

export const snapshotInfrastructureProject = <
  TProject extends Project,
  TOptions extends ProjectOptions
>(
  language: Language,
  InfrastructureProject: new (opts: TOptions) => TProject,
  buildOptions: (props: BuildOptionsProps) => TOptions
) => {
  const monorepo = new MonorepoTsProject({
    name: "monorepo",
  });

  const typeSafeApi = new TypeSafeApiProject({
    parent: monorepo,
    outdir: "api",
    name: "Api",
    model: {
      language: ModelLanguage.SMITHY,
      options: {
        smithy: {
          serviceName: {
            namespace: "com.aws",
            serviceName: "Api",
          },
        },
      },
    },
    infrastructure: {
      language,
    },
  });

  const cloudscapeReactTsWebsite = new CloudscapeReactTsWebsiteProject({
    parent: monorepo,
    outdir: "website",
    name: "Website",
  });

  new InfrastructureProject({
    ...buildOptions({ typeSafeApi, cloudscapeReactTsWebsite }),
    parent: monorepo,
    outdir: "infra",
  });

  const monorepoSnapshot = synthSnapshot(monorepo);

  // Filter to only the infrastructure project we're interested in
  return Object.fromEntries(
    Object.entries(monorepoSnapshot).filter(([filePath]) =>
      filePath.startsWith("infra/")
    )
  );
};
