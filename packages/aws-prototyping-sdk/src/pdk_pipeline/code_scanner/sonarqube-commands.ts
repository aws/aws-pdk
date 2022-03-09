// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SonarCodeScannerProps } from "./sonar-code-scanner";

const cube = (path: string, action: string = "GET", args?: string) =>
  `curl -X ${action} -u $SONARQUBE_TOKEN: "$SONARQUBE_ENDPOINT${path}" ${
    args || ""
  }`;

const setupSonarqubeQualityGates = (
  defaultProfileOrGateName: string,
  specificProfileOrGateName?: string
) => [
  `export DEFAULT_GATE=\`${cube(
    `/api/qualitygates/search?gateName=${defaultProfileOrGateName}`
  )}\``,
  `export SPECIFIC_GATE=\`${cube(
    `/api/qualitygates/search?gateName=${specificProfileOrGateName}`
  )}\``,
  `if [[ "$(echo $SPECIFIC_GATE | jq .errors)" == "null" && "$(echo $SPECIFIC_GATE | jq '.results | length')" -gt 0 ]]; then export GATE_NAME=${specificProfileOrGateName}; else export GATE_NAME=${defaultProfileOrGateName}; fi`,
  `${cube(
    "/api/qualitygates/select?projectKey=$PROJECT_NAME&gateName=$GATE_NAME",
    "POST"
  )}`,
];

const setupSonarqubeQualityProfiles = (
  defaultProfileOrGateName: string,
  specificProfileOrGateName?: string
) => [
  `export DEFAULT_PROFILE=\`${cube(
    `/api/qualityprofiles/search?qualityProfile=${defaultProfileOrGateName}`
  )} | jq .profiles\``,
  `export SPECIFIC_PROFILE=\`${cube(
    `/api/qualityprofiles/search?qualityProfile=${specificProfileOrGateName}`
  )} | jq .profiles\``,
  `export MERGED_PROFILES=\`jq --argjson arr1 "$DEFAULT_PROFILE" --argjson arr2 "$SPECIFIC_PROFILE" -n '$arr1 + $arr2 | group_by(.language) | map(.[-1])'\``,
  `echo $MERGED_PROFILES | jq -c '.[]' | while read i; do ${cube(
    "/api/qualityprofiles/add_project?project=$PROJECT_NAME&language=`echo $i | jq -r .language`&qualityProfile=`echo $i | jq -r .name`",
    "POST"
  )}; done`,
];

const setupSonarqubePermissions = (authorizedGroup?: string) =>
  !authorizedGroup
    ? []
    : [
        "admin",
        "codeviewer",
        "issueadmin",
        "securityhotspotadmin",
        "scan",
        "user",
      ].map(
        (p) =>
          `${cube(
            `/api/permissions/add_group?projectKey=$PROJECT_NAME&groupName=${authorizedGroup}&permission=${p}`,
            "POST"
          )}`
      );

const setupSonarqubeProject = ({
  sonarqubeTags,
  sonarqubeAuthorizedGroup,
  sonarqubeDefaultProfileOrGateName,
  sonarqubeSpecificProfileOrGateName,
}: SonarCodeScannerProps) => {
  return [
    ...setupSonarqubePermissions(sonarqubeAuthorizedGroup),
    `${cube(
      "/api/project_branches/rename?project=$PROJECT_NAME&name=mainline",
      "POST"
    )}`,
    `${cube(
      `/api/project_tags/set?project=$PROJECT_NAME&tags=${[
        sonarqubeAuthorizedGroup,
        ...(sonarqubeTags || []),
      ].join(",")}`,
      "POST"
    )}`,
    ...setupSonarqubeQualityProfiles(
      sonarqubeDefaultProfileOrGateName,
      sonarqubeSpecificProfileOrGateName
    ),
    ...setupSonarqubeQualityGates(
      sonarqubeDefaultProfileOrGateName,
      sonarqubeSpecificProfileOrGateName
    ),
  ].join(";");
};

export const generateSonarqubeReports = () => [
  cube(
    "/api/bitegarden/report/pdf_issues_breakdown?resource=$PROJECT_NAME&branch=mainline",
    "GET",
    "--output reports/prototype-issues-report.pdf"
  ),
  cube(
    "/api/bitegarden/report/pdf?resource=$PROJECT_NAME&branch=mainline",
    "GET",
    "--output reports/prototype-executive-report.pdf"
  ),
  cube(
    "/api/security_reports/download?project=$PROJECT_NAME",
    "GET",
    "--output reports/prototype-security-report.pdf"
  ),
];

export const createSonarqubeProject = (props: SonarCodeScannerProps) => [
  `CREATE_PROJECT_OUTPUT=\`${cube(
    "/api/projects/create?name=$PROJECT_NAME&project=$PROJECT_NAME&visibility=private",
    "POST"
  )}\``,
  `if [[ "$(echo $CREATE_PROJECT_OUTPUT | jq .errors)" == "null" ]]; then ${setupSonarqubeProject(
    props
  )}; fi;`,
  "mkdir -p reports",
];

export const sonarqubeScanner = () =>
  [
    "npx sonarqube-scanner -Dsonar.login=$SONARQUBE_TOKEN",
    "-Dsonar.projectKey=$PROJECT_NAME",
    "-Dsonar.projectName=$PROJECT_NAME",
    "-Dsonar.projectVersion=`git rev-parse --short HEAD`",
    "-Dsonar.branch.name=mainline",
    "-Dsonar.host.url=$SONARQUBE_ENDPOINT",
    "-Dsonar.cfn.nag.reportFiles=reports/cfn-nag-report.json",
    "-Dsonar.dependencyCheck.htmlReportPath=reports/dependency-check-report.html",
  ].join(" ");
