# Synthesis

Projen defines a standard way for building software through a [fixed set of synthesis phases](https://github.com/projen/projen/blob/main/src/project.ts#L564). This is implemented via a set of hooks defined in the Project base class which all constructs extend from.

The `pdk` command which wraps the `projen` command, will execute these hooks in the following order:

- **preSynthesize()** - Calls `preSynthesize()` on itself followed by all components attached to the subject project.
- **synth()** - Calls `synth()` on all sub-projects followed by calling `synth()` on all attached components to the subject project.
- **postSynthesize()** - Calls `postSynthesize()` on all attached components followed by calling `postSytnhesize()` on the subject project. This is typically where dependencies are installed and can actually be suppressed by passing in the `--no-post` flag.

To extend the synth process, components and projects can override each of these hooks and implement their own logic.

!!!warning
    When overriding hooks, be sure to call `super.<hook>()`, else you may end up with undesirable functionality.

## Synthesizing your project

Whenever you make a change to the `.projenrc` file, you will need to re-synthesize your project(s). To do so, run the `pdk` command from the root of your monorepo. This will re-generate all managed files and will any new dependencies.

## Synthesizing your project without installing dependencies

In some instances, it may be desirable to synthesize all your files without installing any dependencies.
To do this, run the `pdk --no-post` command.
