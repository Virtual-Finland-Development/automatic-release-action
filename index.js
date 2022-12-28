// @see: https://octokit.github.io/rest.js/v19#actions
// @see: https://github.com/actions/toolkit/tree/main/packages/github
const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Parses list of input requirements to validated inputs map
 *
 * @param {*} inputRequirements
 * @returns
 */
function parseGitActionInputs(inputRequirements) {
  return inputRequirements.reduce((acc, { name, fallback }) => {
    try {
      acc[name] =
        core.getInput(name) ||
        (typeof fallback === 'function' ? fallback() : fallback);
      if (!acc[name]) {
        throw 'raise error';
      }
    } catch (error) {
      throw new Error(`Input required and not supplied: ${name}`);
    }
    return acc;
  }, {});
}

/**
 *
 * @param inputs
 * @returns eg. exampleApp-2022-12-31-dev
 */
function generateTagName({ name, environment }) {
  const date = new Date().toISOString().split('T')[0];
  return `${name}-${date}-${environment}`;
}

/**
 *
 * @param {*} octokit
 * @param {*} repositoryContext
 * @param {*} tagName
 * @param {*} latestCommitSha
 * @returns
 */
async function resolveTagRef(
  octokit,
  repositoryContext,
  tagName,
  latestCommitSha,
) {
  const tagMessage = `Tagging ${tagName}`;
  await octokit.git.createTag({
    ...repositoryContext,
    tag: tagName,
    message: tagMessage,
    object: latestCommitSha,
    type: 'commit',
  });

  let existingRef;
  try {
    existingRef = await octokit.rest.git.getRef({
      ...repositoryContext,
      ref: tagName,
    });
  } catch (error) {
    if (error.status != 404) {
      throw error;
    }
  }

  const refInfo = {
    ...repositoryContext,
    ref: `tags/${tagName}`,
    sha: latestCommitSha,
  };

  if (existingRef) {
    return await octokit.rest.git.updateRef(refInfo);
  } else {
    return await octokit.rest.git.createRef({
      ...refInfo,
      ref: `refs/${refInfo.ref}`,
    });
  }
}

/**
 *
 * @param {*} octokit
 * @param {*} repositoryContext
 * @param {*} tagName
 */
async function resolveRelease(octokit, repositoryContext, tagName) {
  const existingRelease = await octokit.rest.repos.getReleaseByTag({
    ...repositoryContext,
    tag: tagName,
  });
  if (existingRelease) {
    await octokit.rest.repos.updateRelease({
      ...repositoryContext,
      release_id: existingRelease.data.id,
      tag_name: tagName,
      name: tagName,
      body: `Release for ${tagName}`,
    });
  } else {
    await octokit.rest.repos.createRelease({
      ...repositoryContext,
      tag_name: tagName,
      name: tagName,
      body: `Release for ${tagName}`,
    });
  }
}

/**
 * Main entry point
 */
async function runAction() {
  try {
    // Prep inputs, octokit & repository context
    const inputs = parseGitActionInputs([
      { name: 'name' },
      { name: 'environment' },
      { name: 'githubToken', fallback: () => process.env.GITHUB_TOKEN },
      { name: 'githubSHA', fallback: () => process.env.GITHUB_SHA },
    ]);

    const octokit = github.getOctokit(inputs.githubToken);
    const repositoryContext = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };

    const tagName = generateTagName(inputs);
    await resolveTagRef(octokit, repositoryContext, tagName, inputs.githubSHA);
    await resolveRelease(octokit, repositoryContext, tagName);
  } catch (error) {
    core.setFailed(error.message);
  }
}

runAction();
