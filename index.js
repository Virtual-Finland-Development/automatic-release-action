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
    existingRef = await octokit.git.getRef({
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
    return await octokit.git.updateRef(refInfo);
  } else {
    return await octokit.git.createRef({
      ...refInfo,
      ref: `refs/tags/${tagName}`,
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

    core.info(JSON.stringify(inputs));

    const octokit = github.getOctokit(inputs.githubToken);
    core.info('BAH');

    core.info(JSON.stringify(octokit));
    core.info('BAH>ZAR');

    core.info(JSON.stringify(octokit.git));
    const repositoryContext = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };

    // Crate a release tag for the latest commit
    const tagName = generateTagName(inputs);
    core.info(JSON.stringify(tagName));
    // Create new tag ref
    await resolveTagRef(octokit, repositoryContext, tagName, inputs.githubSHA);

    /*  // Create release
    const release = await octokit.repos.createRelease({
      ...repositoryContext,
      tag_name: tagName,
      name: tagName,
      body: `Release for ${tagName}`,
    }); */
  } catch (error) {
    core.setFailed(error.message);
  }
}

runAction();
