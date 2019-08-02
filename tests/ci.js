const shell = require('shelljs');
var _ = require('lodash');
var assert = require('assert');
var path = require('path');
var spawn = require('cross-spawn');
const { fixturesDir, examplesDir, spawnOpts } = require('./util');
var interfacePath = require('elmi-to-json').paths['elmi-to-json'];

var filename = __filename.replace(__dirname + '/', '');
var elmTest = 'elm-test';

function run(testFile) {
  console.log('\nClearing elm-stuff prior to run');
  shell.rm('-rf', 'elm-stuff');

  if (!testFile) {
    var cmd = [elmTest, '--color'].join(' ');

    console.log('Running: ' + cmd);
    return shell.exec(cmd, spawnOpts).code;
  } else {
    var cmd = [elmTest, testFile, '--color'].join(' ');

    console.log('Running: ' + cmd);
    return shell.exec(cmd, spawnOpts).code;
  }
}

function assertTestErrored(testfile) {
  var code = run(testfile);
  if (code !== 1) {
    console.error(
      filename +
        ': error: ' +
        (testfile ? testfile + ': ' : '') +
        'expected tests to exit with ERROR exit code, not exit code' +
        code
    );
  }
  assert.strictEqual(code, 1);
}

function assertTestIncomplete(testfile) {
  var code = run(testfile);
  if (code !== 3) {
    console.error(
      filename +
        ': error: ' +
        (testfile ? testfile + ': ' : '') +
        'expected tests to exit with INCOMPLETE exit code, not exit code' +
        code
    );
  }
  assert.strictEqual(code, 3);
}

function assertTestFailure(testfile) {
  var code = run(testfile);
  if (code < 2) {
    console.error(
      filename +
        ': error: ' +
        (testfile ? testfile + ': ' : '') +
        'expected tests to fail'
    );
  }
  assert(code >= 2);
}

function assertTestSuccess(testFile) {
  var code = run(testFile);
  if (code !== 0) {
    console.error(
      filename +
        ': ERROR: ' +
        (testFile ? testFile + ': ' : '') +
        'Expected tests to pass'
    );
  }
  assert.strictEqual(code, 0);
}

describe('ci', function() {
  this.timeout(60000);
  before(() => {
    console.log('Uninstalling old elm-test...');
    shell.exec('npm remove --ignore-scripts=false --global ' + elmTest);

    shell.echo('Installing elm-test...');
    shell.exec('npm link --ignore-scripts=false');
  });

  it('Installed elmi-to-json is valid', () => {
    var interfaceResult = spawn.sync(interfacePath, ['--help']);
    var interfaceExitCode = interfaceResult.status;

    if (interfaceExitCode !== 0) {
      console.log(
        'Failed because `elmi-to-json` is present, but `elmi-to-json --help` returned with exit code ' +
          interfaceExitCode
      );
      console.log(`stdout: ${interfaceResult.stdout.toString()}`);
      console.log(`stderr: ${interfaceResult.stderr.toString()}`);
    }
    assert.strictEqual(interfaceExitCode, 0);
  });

  it('--version flag gives version', () => {
    const exitCode = run('--version');
    assert.strictEqual(exitCode, 0);
  });

  describe('examples', () => {
    beforeEach(() => {
      shell.cd(examplesDir);
    });

    it('Running elm-test in example/application fails', () => {
      shell.cd('application');
      assertTestFailure();
    });

    it('Running all passing tests in example/application', () => {
      shell.cd('application');
      assertTestSuccess(path.join('tests', '*Pass*.elm'));
    });

    it('Running all failing tests in example/application', () => {
      shell.cd('application');
      assertTestFailure(path.join('tests', '*Fail*.elm'));
    });

    it('Running elm-test in example/package fails', () => {
      shell.cd('package');
      assertTestFailure();
    });

    it('Running all passing tests in example/package', () => {
      shell.cd('package');
      assertTestSuccess(path.join('tests', '*Pass*.elm'));
    });

    it('Running all failing tests in example/package', () => {
      shell.cd('package');
      assertTestFailure(path.join('tests', '*Fail*.elm'));
    });

    it('Running elm-test in example/application-no-tests', () => {
      shell.cd('application-no-tests');
      assertTestFailure();
    });

    it('Running elm-test in example/package-no-core passes', () => {
      shell.cd('package-no-core');
      assertTestSuccess();
    });
  });
  describe('Running tests in individual elm files', () => {
    shell.cd(fixturesDir);
    describe.only('Passing tests', () => {
      let fileCount = shell.ls('tests/Passing/').map(function(testToRun) {
        it(`${testToRun}`, () => {
          assertTestSuccess(path.join('tests', 'Passing', testToRun));
        });
      }).length;
      it('Tests have been found', () => {
        assert(fileCount > 0);
      });
    });
    describe('Failing tests', () => {
      let fileCount = shell.ls('tests/Failing').map(function(testToRun) {
        it(`${testToRun}`, () => {
          assertTestFailure(path.join('tests', 'Failing', testToRun));
        });
      }).length;

      it('Tests have been found', () => {
        assert(fileCount > 0);
      });
    });
    describe('Tests that error with a runtime exception', () => {
      let fileCount = shell
        .ls('tests/RuntimeException')
        .map(function(testToRun) {
          it(`${testToRun}`, () => {
            assertTestErrored(
              path.join('tests', 'RuntimeException', testToRun)
            );
          });
        }).length;

      it('Tests have been found', () => {
        assert(fileCount > 0);
      });
    });
  });
});
