---
title: ERR_OUT_OF_RANGE error
tags: error, err-out-of-range, dist
packages: aws-prototyping-sdk
---

# I get `ERR_OUT_OF_RANGE` error while working on PDK

## The error

```bash
[...totyping-sdk] Error: Command (npm pack "/Users/<user>/projects/aws/aws-prototyping-sdk/packages/aws-prototyping-sdk") failed with status 1:
[...totyping-sdk] #STDERR> npm ERR! code ERR_OUT_OF_RANGE
[...totyping-sdk] #STDERR> npm ERR! The value of "length" is out of range. It must be >= 0 && <= 2147483647. Received 3411173948
[...totyping-sdk] #STDERR>
[...totyping-sdk] #STDERR> npm ERR! A complete log of this run can be found in:
[...totyping-sdk] #STDERR> npm ERR!     /Users/<user>/.npm/_logs/2022-08-21T10_56_27_554Z-debug-0.log
[...totyping-sdk] #STDERR>
[...totyping-sdk] #STDOUT>
[...totyping-sdk]     at ChildProcess.<anonymous> (/Users/<user>/projects/aws/aws-prototyping-sdk/node_modules/jsii-pacmak/lib/util.js:175:27)
[...totyping-sdk]     at Object.onceWrapper (node:events:642:26)
[...totyping-sdk]     at ChildProcess.emit (node:events:527:28)
[...totyping-sdk]     at maybeClose (node:internal/child_process:1090:16)
[...totyping-sdk]     at Socket.<anonymous> (node:internal/child_process:449:11)
[...totyping-sdk]     at Socket.emit (node:events:527:28)
[...totyping-sdk]     at Pipe.<anonymous> (node:net:715:12)
[...totyping-sdk] Task "build » package » package-all » package:js" failed when executing "jsii-pacmak -v --target js" (cwd: /Users/<user>/projects/aws/aws-prototyping-sdk/packages/aws-prototyping-sdk)
error Command failed with exit code 1.
```

## Solution

Delete the `dist` folder in `packages/aws-prototyping-sdk`.
