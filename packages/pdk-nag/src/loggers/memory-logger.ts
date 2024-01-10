/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  INagLogger,
  NagLoggerComplianceData,
  NagLoggerErrorData,
  NagLoggerNonComplianceData,
  NagLoggerNotApplicableData,
  NagLoggerSuppressedData,
  NagLoggerSuppressedErrorData,
} from "cdk-nag";
import { ExtendedNagResult, NagResultCompliance } from "./types";

/**
 * Records nag results in memory
 */
export class MemoryLogger implements INagLogger {
  public readonly results: ExtendedNagResult[] = [];

  onCompliance(data: NagLoggerComplianceData): void {
    this.results.push({
      ...data,
      compliance: NagResultCompliance.COMPLIANT,
    });
  }
  onNonCompliance(data: NagLoggerNonComplianceData): void {
    this.results.push({
      ...data,
      compliance: NagResultCompliance.NON_COMPLIANT,
    });
  }
  onSuppressed(data: NagLoggerSuppressedData): void {
    this.results.push({
      ...data,
      compliance: NagResultCompliance.NON_COMPLIANT_SUPPRESSED,
    });
  }
  onError(data: NagLoggerErrorData): void {
    this.results.push({
      ...data,
      compliance: NagResultCompliance.ERROR,
    });
  }
  onSuppressedError(data: NagLoggerSuppressedErrorData): void {
    this.results.push({
      ...data,
      compliance: NagResultCompliance.ERROR_SUPPRESSED,
      suppressionReason: data.errorSuppressionReason,
    });
  }
  onNotApplicable(data: NagLoggerNotApplicableData): void {
    this.results.push({
      ...data,
      compliance: NagResultCompliance.NOT_APPLICABLE,
    });
  }
}
