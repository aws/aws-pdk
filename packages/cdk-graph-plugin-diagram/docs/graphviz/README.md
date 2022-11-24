## [Graphviz](https://graphviz.org/) Provider

![alpha](https://img.shields.io/badge/status-alpha-orange.svg)

| Format | Status | Extends |
| --- | --- | --- |
| [DOT](https://graphviz.org/docs/outputs/canon/) | ![beta](https://img.shields.io/badge/status-beta-cyan.svg) | - |
| [SVG](https://graphviz.org/docs/outputs/svg/) | ![beta](https://img.shields.io/badge/status-beta-cyan.svg) | [DOT](https://graphviz.org/docs/outputs/canon/) |
| [PNG](https://graphviz.org/docs/outputs/png/) | ![beta](https://img.shields.io/badge/status-beta-cyan.svg) | [SVG](https://graphviz.org/docs/outputs/canon/) |

### Examples
| | | |
| --- | --- | --- |
| Default | Multi Stack | Staged |
| [<img src="../examples/default.png" height="200" />](../examples/diagram.png) | [<img src="../examples/multi-stack.png" height="200" />](../examples/multi-stack.png) | [<img src="../examples/staged.png" height="200" />](../examples/staged.png) |
| Focus | Verbose | |
| [<img src="../examples/focus-nohoist.png" width="200" />](../examples/focus-nohoist.png) | [<img src="../examples/verbose.png" height="200" />](../examples/verbose.png) | |
| Dark | Dark Services | Dark Verbose |
| [<img src="../examples/dark.png" height="200" />](../examples/dark.png) | [<img src="../examples/dark-services.png" height="200" />](../examples/verbose-services.png) | [<img src="../examples/dark-verbose.png" height="200" />](../examples/dark-verbose.png) |

---
### How it works

![](plugin-sequence.png)
