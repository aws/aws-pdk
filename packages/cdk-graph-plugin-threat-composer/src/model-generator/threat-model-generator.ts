/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ExtendedNagResult, NagResultCompliance } from "@aws/pdk-nag";
import { orderBy, uniq } from "lodash";
import * as BASE_THREAT_MODEL from "./base-model/threat-composer-base-model.tc.json";
import { ThreatComposerApplicationDetails } from "./types";

type ThreatComposerModel = typeof BASE_THREAT_MODEL;
type ThreatComposerThreat = ThreatComposerModel["threats"][number];
type ThreatComposerMitigation = ThreatComposerModel["mitigations"][number];

interface ComplianceFindings {
  readonly compliantResources: Set<string>;
  readonly nonCompliantResources: Set<string>;
}

// Mitigation content is the CDK Nag rule name.
const NAG_RULE_MITIGATION_PREFIX = "cdk-nag rule: ";

/**
 * Options for generating a Threat Composer threat model
 */
export interface ThreatModelGeneratorOptions {
  /**
   * Details about the application to include in the threat model
   */
  readonly applicationDetails?: ThreatComposerApplicationDetails;
  /**
   * A data uri for an architecture diagram image
   */
  readonly architectureImageDataUri?: string;
}

/**
 * Generates Threat Composer threat models based on CDK Nag results
 */
export class ThreatModelGenerator {
  /**
   * Given a Threat Composer mitigation, return the CDK Nag rule associated (if any)
   */
  private getRuleFromMitigation = (
    mitigation?: ThreatComposerMitigation
  ): string | undefined => {
    if (mitigation?.content.startsWith(NAG_RULE_MITIGATION_PREFIX)) {
      return mitigation.content.split(NAG_RULE_MITIGATION_PREFIX)[1] as
        | string
        | undefined;
    }
    return undefined;
  };

  /**
   * Deduplicate suppression reasons, removing resource details if present
   */
  private prettySuppressions = (suppressions: string[]): string[] => {
    return uniq(
      suppressions.map((s) =>
        s.startsWith("[") ? s.slice(s.indexOf("] ") + 2) : s
      )
    );
  };

  /**
   * Generate a threat model from a set of cdk nag results
   */
  public generate(
    results: ExtendedNagResult[],
    options?: ThreatModelGeneratorOptions
  ): ThreatComposerModel {
    // Summarise nag results into rules and the counts of resources compliant/non-compliant
    const allApplicableRules = new Set<string>();
    const compliance: { [nagRule: string]: ComplianceFindings } = {};
    const suppressionReasons: { [nagRule: string]: string[] } = {};

    for (const result of results) {
      const rule = result.ruleOriginalName;

      if (!compliance[rule]) {
        compliance[rule] = {
          compliantResources: new Set(),
          nonCompliantResources: new Set(),
        };
      }

      // Add to the set of all applicable rules so long as the rule is applicable
      if (result.compliance !== NagResultCompliance.NOT_APPLICABLE) {
        allApplicableRules.add(rule);
      }

      if (
        [
          NagResultCompliance.NON_COMPLIANT,
          NagResultCompliance.ERROR,
          NagResultCompliance.NON_COMPLIANT_SUPPRESSED,
          NagResultCompliance.ERROR_SUPPRESSED,
        ].includes(result.compliance)
      ) {
        // Add the resource path to the compliance set
        compliance[rule].nonCompliantResources.add(result.resource.node.path);
        if (result.suppressionReason) {
          suppressionReasons[rule] = [
            ...(suppressionReasons[rule] ?? []),
            result.suppressionReason,
          ];
        }
      } else if (result.compliance === NagResultCompliance.COMPLIANT) {
        // Resource is compliant
        compliance[rule].compliantResources.add(result.resource.node.path);
      }
    }

    const mitigationsById = Object.fromEntries(
      BASE_THREAT_MODEL.mitigations.map((m) => [m.id, m])
    );
    const threatIdToMitigationIds = BASE_THREAT_MODEL.mitigationLinks.reduce(
      (byId, m) => ({
        ...byId,
        [m.linkedId]: [...(byId[m.linkedId] ?? []), m.mitigationId],
      }),
      {} as { [threatId: string]: string[] }
    );

    // Get applicable threats - ie threats where there is a mitigation which is a CDK nag rule that is applicable to this project
    const threats: ThreatComposerThreat[] = orderBy(
      BASE_THREAT_MODEL.threats,
      "numericId"
    )
      .filter((threat) => {
        const mitigationIds = threatIdToMitigationIds[threat.id] ?? [];
        return mitigationIds.find((id) => {
          const mitigationRule = this.getRuleFromMitigation(
            mitigationsById[id]
          );
          return mitigationRule && allApplicableRules.has(mitigationRule);
        });
      })
      .map((t, i) => ({
        ...t,
        // Re-map numeric ids and display order
        numericId: i + 1,
        displayOrder: i + 1,
      }));

    // Get applicable mitigations
    const mitigations = (
      orderBy(BASE_THREAT_MODEL.mitigations, "numericId")
        .map((m) => {
          const mitigationRule = this.getRuleFromMitigation(
            mitigationsById[m.id]
          );
          if (mitigationRule && compliance[mitigationRule]) {
            const { compliantResources, nonCompliantResources } =
              compliance[mitigationRule];
            const suppressions = suppressionReasons[mitigationRule];
            const compliant = compliantResources.size;
            const nonCompliant = nonCompliantResources.size;

            // We can't really warrant adding a mitigation when 0 resources are compliant and there are no suppression reasons
            if (
              compliant === 0 &&
              (!suppressions || suppressions.length === 0)
            ) {
              return undefined;
            }

            const suppressionComment = suppressions
              ? `\n\n__Suppression Reasons__:\n${this.prettySuppressions(
                  suppressions
                )
                  .map((reason) => `* ${reason}`)
                  .join("\n")}`
              : "";

            let comment = `${compliant} of ${
              compliant + nonCompliant
            } Resources Compliant.${suppressionComment}`;

            // Threat composer limits comments to 1000 chars
            if (comment.length > 1000) {
              comment = comment.slice(0, 997) + "...";
            }

            return {
              ...m,
              metadata: [
                // TODO: Consider appending to existing comments rather than overriding
                {
                  key: "Comments",
                  value: comment,
                },
              ],
            };
          }
          return undefined;
        })
        .filter((x) => x) as ThreatComposerMitigation[]
    ).map((m, i) => ({
      ...m,
      // Re-map numeric ids and display order
      numericId: i + 1,
      displayOrder: i + 1,
    }));

    // Include only mitigation links where we have threats and mitigations
    const projectThreatIds = new Set(threats.map(({ id }) => id));
    const projectMitigationIds = new Set(mitigations.map(({ id }) => id));
    const mitigationLinks = BASE_THREAT_MODEL.mitigationLinks.filter(
      (link) =>
        projectThreatIds.has(link.linkedId) &&
        projectMitigationIds.has(link.mitigationId)
    );

    const threatModel = {
      ...BASE_THREAT_MODEL,
      threats,
      mitigations,
      mitigationLinks,
      architecture: {
        ...BASE_THREAT_MODEL.architecture,
        image: options?.architectureImageDataUri ?? "",
      },
      applicationInfo: {
        ...BASE_THREAT_MODEL.applicationInfo,
        name:
          options?.applicationDetails?.name ??
          BASE_THREAT_MODEL.applicationInfo.name,
        description:
          options?.applicationDetails?.description ??
          BASE_THREAT_MODEL.applicationInfo.description,
      },
    };

    // jest interprets the "import * as" import differently, so we remove this to ensure the snapshot
    // is more realistic
    if ("default" in threatModel) {
      delete threatModel.default;
    }

    return threatModel;
  }
}
