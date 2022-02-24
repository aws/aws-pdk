// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface GreeterProps {
  readonly greetee: string;
}

/**
 * Example class
 */
export class Greeter {
  private readonly greetee: string;

  public constructor(props: GreeterProps) {
    this.greetee = props.greetee;
  }

  public greet(): string {
    return `Hello, ${this.greetee}!`;
  }
}
