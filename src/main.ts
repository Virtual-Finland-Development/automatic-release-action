// @see: https://octokit.github.io/rest.js/v19#actions
// @see: https://github.com/actions/toolkit/tree/main/packages/github
import * as core from '@actions/core';
import * as github from '@actions/github';

/**
 * Parses list of input requirements to validated inputs map
 *
 * @param inputRequirements
 * @returns
 */
function parseGitActionInputs(
  inputRequirements: Array<{
    name: keyof ReleasePackage['inputs'];
    fallback: InputFallbackValue | (() => InputFallbackValue);
    required: boolean;
  }>,
): ReleasePackage['inputs'] {
  return inputRequirements.reduce((acc, { name, fallback, required }) => {
    try {
      acc[name] =
        core.getInput(name) ||
        (typeof fallback === 'function' ? fallback() : fallback);
      if (!acc[name] && required) {
        throw 'raise error';
      }
    } catch (error) {
      throw new Error(`Input required and not supplied: ${name}`);
    }
    return acc;
  }, {} as any);
}

/**
 *
 * @param inputs
 * @returns eg. exampleApp-2022-12-31-dev
 */
function generateTagName({
  name,
  environment,
}: {
  name: string;
  environment: string;
}) {
  const date = new Date().toISOString().split('T')[0];
  return [name, date, environment].filter(Boolean).join('-');
}

/**
 *
 * @param {*} octokit
 * @param {*} repositoryContext
 * @param {*} tagName
 * @param {*} latestCommitSha
 */
async function createTag(octokit: any, releasePackage: ReleasePackage) {
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
async function createTagRef(octokit: any, releasePackage: ReleasePackage) {
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
    await octokit.rest.git.updateRef(refInfo);
  } else {
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
async function createRelease(octokit: any, releasePackage: ReleasePackage) {
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

  core.info(`Fetching release notes..`);
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
    await octokit.rest.repos.updateRelease({
      ...releasePackage.repositoryContext,
      release_id: existingRelease.data.id,
      tag_name: releasePackage.tagName,
      name: releaseNotes.data.name,
      body: releaseNotes.data.body,
      prerelease: releasePackage.inputs.prerelease,
    });
  } else {
    await octokit.rest.repos.createRelease({
      ...releasePackage.repositoryContext,
      tag_name: releasePackage.tagName,
      name: releaseNotes.data.name,
      body: releaseNotes.data.body,
      prerelease: releasePackage.inputs.prerelease,
    });
  }
}

/**
 * Main entry point
 */
async function runAction() {
  // Prep inputs, octokit & repository context
  const inputs = parseGitActionInputs([
    {
      name: 'name',
      fallback: () => (process.env.GITHUB_REPOSITORY || '').split('/')[1],
      required: true,
    },
    { name: 'environment', fallback: '', required: false },
    {
      name: 'githubToken',
      fallback: process.env.GITHUB_TOKEN,
      required: true,
    },
    {
      name: 'githubSHA',
      fallback: process.env.GITHUB_SHA,
      required: true,
    },
    {
      name: 'prerelease',
      fallback: false,
      required: false,
    },
  ]);

  const octokit = github.getOctokit(inputs.githubToken);
  const releasePackage: ReleasePackage = {
    tagName: generateTagName(inputs),
    inputs: inputs,
    repositoryContext: {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    },
  };

  core.info(`Tagging ${releasePackage.tagName}`);
  await createTag(octokit, releasePackage);
  core.info(`Creating a reference..`);
  await createTagRef(octokit, releasePackage);
  core.info(`Creating a release..`);
  await createRelease(octokit, releasePackage);
  core.info(`Release created.`);
}

runAction().catch((error) => {
  core.setFailed(error.message);
});
