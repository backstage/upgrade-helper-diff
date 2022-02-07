const spawn = require('child_process').spawn;

async function getCreateAppVersion(inputVersion) {
  // This is the old flow, where versions up to 0.4.x are considered to be direct create-app versions
  const [major, minor] = inputVersion.split('.');
  if (major === '0' && ['1', '2', '3', '4'].includes(minor)) {
    return inputVersion;
  }

  // The new flow is to go look up the release manifest to grab the create-app version
  const manifest = await new Promise((resolve, reject) => {
    const url = `https://versions.backstage.io/v1/releases/${inputVersion}/manifest.json`;
    require('https')
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Failed to fetch manifest for ${inputVersion}, ${res.statusCode}`
            )
          );
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
