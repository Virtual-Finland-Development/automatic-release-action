import * as core from '@actions/core';

/**
 *
 * @param octokit
 * @param releasePackage
 */
export async function createTag(octokit: any, releasePackage: ReleasePackage) {
  core.info(`Tagging ${releasePackage.tagName} ..`);
  try {
    await octokit.rest.git.createTag({
      ...releasePackage.repositoryContext,
      tag: releasePackage.tagName,
      message: `Tagging ${releasePackage.tagName}`,
      object: releasePackage.inputs.githubSHA,
      type: 'commit',
    });
  } catch (error) {
    /* empty */
  }
}

/**
 *
 * @param octokit
 * @param releasePackage
 */
export async function createTagRef(
  octokit: any,
  releasePackage: ReleasePackage,
) {
  core.info('Preparing tag ref..');

  let existingRef;
  try {
    existingRef = await octokit.rest.git.getRef({
      ...releasePackage.repositoryContext,
      ref: `tags/${releasePackage.tagName}`,
    });
  } catch (error: any) {
    if (typeof error.status !== 'number' || error.status !== 404) {
      throw error;
    }
  }

  const refInfo = {
    ...releasePackage.repositoryContext,
    ref: `tags/${releasePackage.tagName}`,
    sha: releasePackage.inputs.githubSHA,
  };

  if (existingRef) {
    core.info('Updating existing tag ref..');
    await octokit.rest.git.updateRef(refInfo);
  } else {
    core.info('Creating new tag ref..');
    await octokit.rest.git.createRef({
      ...refInfo,
      ref: `refs/tags/${releasePackage.tagName}`,
    });
  }
}

/**
 *
 * @param octokit
 * @param releasePackage
 */
export async function createRelease(
  octokit: any,
  releasePackage: ReleasePackage,
) {
  core.info('Preparing release..');

  let existingRelease;
  try {
    existingRelease = await octokit.rest.repos.getReleaseByTag({
      ...releasePackage.repositoryContext,
      tag: releasePackage.tagName,
    });
  } catch (error: any) {
    if (typeof error.status !== 'number' || error.status !== 404) {
      throw error;
    }
  }

  const { owner, repo } = releasePackage.repositoryContext;
  const releaseNotes = await octokit.request(
    `POST /repos/${owner}/${repo}/releases/generate-notes`,
    {
      owner: owner,
      repo: repo,
      tag_name: releasePackage.tagName,
    },
  );

  if (existingRelease) {
    core.info('Updating existing release..');
    await octokit.rest.repos.updateRelease({
      ...releasePackage.repositoryContext,
      release_id: existingRelease.data.id,
      tag_name: releasePackage.tagName,
      name: releaseNotes.data.name,
      body: releaseNotes.data.body,
      prerelease: releasePackage.inputs.prerelease,
    });
  } else {
    core.info('Creating new release..');
    await octokit.rest.repos.createRelease({
      ...releasePackage.repositoryContext,
      tag_name: releasePackage.tagName,
      name: releaseNotes.data.name,
      body: releaseNotes.data.body,
      prerelease: releasePackage.inputs.prerelease,
    });
  }

  core.info('Release created!');
}
