const FETCH_ATTEMPT_COUNT = 20;
const FETCH_ATTEMPT_SLEEP_MS = 3000;

async function fetchManifest(version) {
  return await new Promise((resolve, reject) => {
    const url = `https://versions.backstage.io/v1/releases/${version}/manifest.json`;
    require('https')
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Fetch failed with status ${res.statusCode}`));
          return;
        }

        const chunks = [];
        res.on('error', reject);
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        });
      })
      .on('error', reject);
  });
}

async function getCreateAppVersion(inputVersion) {
  // This is the old flow, where versions up to 0.4.x are considered to be direct create-app versions
  const [major, minor] = inputVersion.split('.');
  if (major === '0' && ['1', '2', '3', '4'].includes(minor)) {
    return inputVersion;
  }

  // The new flow is to go look up the release manifest to grab the create-app version
  // In case the manifest isn't available yet, we'll retry for a while
  let manifest;
  for (let attempt = 1; attempt <= FETCH_ATTEMPT_COUNT; attempt++) {
    try {
      manifest = await fetchManifest(inputVersion);
      break;
    } catch (error) {
      console.error(
        `Failed attempt ${attempt} to fetch manifest for ${inputVersion}, ${error}`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, FETCH_ATTEMPT_SLEEP_MS)
      );
    }
  }
  if (!manifest) {
    throw new Error(`Gave up trying to fetch manifest for ${inputVersion}`);
  }

  const createAppEntry = manifest.packages.find(
    (p) => p.name === '@backstage/create-app'
  );
  if (!createAppEntry) {
    throw new Error(
      `Failed to look up create-app version for release ${version}`
    );
  }
  return createAppEntry.version;
}

async function main() {
  if (!process.env.RELEASE_VERSION) {
    throw new Error('RELEASE_VERSION must be set');
  }
  const inputVersion = process.env.RELEASE_VERSION;

  const createAppVersion = await getCreateAppVersion(inputVersion);
  console.log(`::set-output name=version::${createAppVersion}`);
}

main().catch((error) => {
  console.error(error.stack);
  process.exit(1);
});
