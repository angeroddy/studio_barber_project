const { spawnSync } = require('node:child_process');

const maxAttempts = Number(process.env.PRISMA_MIGRATE_MAX_ATTEMPTS || 8);
const retryDelayMs = Number(process.env.PRISMA_MIGRATE_RETRY_DELAY_MS || 5000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAdvisoryLockTimeout(output) {
  const text = String(output || '');
  return (
    text.includes('P1002') &&
    text.includes('advisory lock')
  );
}

async function main() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`[migrate] Attempt ${attempt}/${maxAttempts}: prisma migrate deploy`);

    const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
      env: process.env,
      encoding: 'utf-8',
      shell: process.platform === 'win32'
    });

    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    if (result.status === 0) {
      console.log('[migrate] Migration deploy succeeded.');
      process.exit(0);
    }

    const canRetry = isAdvisoryLockTimeout(output) && attempt < maxAttempts;
    if (!canRetry) {
      console.error('[migrate] Migration deploy failed and will not be retried.');
      process.exit(result.status || 1);
    }

    console.warn(
      `[migrate] Advisory lock timeout detected. Retrying in ${retryDelayMs}ms...`
    );
    await sleep(retryDelayMs);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error('[migrate] Unexpected error during migration retry:', error);
  process.exit(1);
});
