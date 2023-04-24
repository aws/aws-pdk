/**
 * Override CRA configuration without needing to eject.
 *
 * @see https://www.npmjs.com/package/react-app-rewired
 */
module.exports = function override(config, env) {
  config.externals = {"@aws-sdk/credential-provider-node":"{ defaultProvider: () => {} }"};
  return config;
};