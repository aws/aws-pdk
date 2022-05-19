// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Hello } from "../src";

test("hello", () => {
  expect(new Hello().sayHello()).toBe("hello, world!");
});
