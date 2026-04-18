const { spawnSync } = require('child_process');
const path = require('path');

const functionsDir = path.resolve(__dirname, '..');
const manifestPath = path.join(functionsDir, 'functions.yaml');
const binary = path.join(
  functionsDir,
  'node_modules',
  'firebase-functions',
  'lib',
  'bin',
  'firebase-functions.js',
);

const result = spawnSync(process.execPath, [binary, '.'], {
  cwd: functionsDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    FUNCTIONS_MANIFEST_OUTPUT_PATH: manifestPath,
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
