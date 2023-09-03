# Caching

Whenever executing a build via the `pdk build` command (or any nx command), [NX](https://nx.dev/) (the underlying build system) will [cache your outputs](https://nx.dev/concepts/how-caching-works) so that subsequent builds which do not have any changes can simply be skipped and use cached results. It does this by generating a hash, based on an input set which typically comprises of:

- All the source files of your package and its dependencies
- Relevant global config
- Versions of external dependencies
- Runtime values passed in by the user
- CLI flags

After Nx computes the hash for a task, it then checks if it ran this exact computation before. First, it checks locally, and then if it is missing, and if a remote cache is configured, it checks remotely.

If Nx finds the computation, Nx retrieves it and replays it. Nx places the right files in the right folders and prints the terminal output. From the user’s point of view, the command ran the same, just a lot faster.

By default, all cached results are stored within either `.nx/cache` or `node_modules/.cache/nx`. The PDK uses sane defaults for which files to cache _i.e: build directory, cdk.out, etc_. There may be situations where certain input files or output files need to be adjusted. To do this, add the following to your `projenrc` file:

```
NxProject.ensure(<construct>).setTarget(
      "build", // target to configure cache for
      {
        inputs: [
          { "fileset": "{workspaceRoot}/<some-file>" }, // generate a new hash if <some-file> changes   
          { "runtime": "node -v" }, // generate a new hash if the node runtime changes
        ],
        outputs: [
          "{projectRoot}/<some-other-file>", // store <some-other-file> in cache results
        ],
      },
      true
    );
```