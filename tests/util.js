const path = require('path');

const fixturesDir = path.join(__dirname, 'fixtures');
const examplesDir = path.join(__dirname, '..', 'examples');

const elmHome = path.join(fixturesDir, 'elm-home');

const spawnOpts = {
  silent: true,
  env: Object.assign({ ELM_HOME: elmHome }, process.env),
};

module.exports = {
  fixturesDir,
  spawnOpts,
  examplesDir,
};
