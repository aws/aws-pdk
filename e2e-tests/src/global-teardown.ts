module.exports = async () => {
  // @ts-ignore
  globalThis.__REGISTRY_PROCESS__ && globalThis.__REGISTRY_PROCESS__.kill();
};