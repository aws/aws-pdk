import * as fs from 'fs';

module.exports = async () => {
  fs.rmSync('./.npmrc');
  // @ts-ignore
  globalThis.__REGISTRY_PROCESS__ && globalThis.__REGISTRY_PROCESS__.kill();
};