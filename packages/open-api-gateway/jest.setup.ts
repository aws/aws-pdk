module.exports = () => {
  // Disable post synthesis for all tests, given generated code is synthesized early, during the construction of the
  // project.
  // See https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/util/synth.ts#L33
  process.env.PROJEN_DISABLE_POST = "true";
};
