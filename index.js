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

async function createNewTagRef(
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

  return await octokit.git.createRef({
    ...repositoryContext,
    ref: `refs/tags/${tagName}`,
    latestCommitSha,
  });
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

    // Crate a release tag for the latest commit
    const tagName = generateTagName(inputs);
    // Get already existing tag refs
    const existingTagRefs = await octokit.git.listMatchingRefs({
      ...repositoryContext,
      ref: `tags/${tagName}`,
    });
    // Create new tag ref
    const newTagRef = await createNewTagRef(
      octokit,
      repositoryContext,
      tagName,
      inputs.githubSHA,
    );

    /*  // Create release
    const release = await octokit.repos.createRelease({
      ...repositoryContext,
      tag_name: tagName,
      name: tagName,
      body: `Release for ${tagName}`,
    }); */

    // Update existing tag refs to point to the new tag ref
    for (const existingTagRef of existingTagRefs.data) {
      await octokit.git.updateRef({
        ...repositoryContext,
        ref: existingTagRef.ref,
        sha: newTagRef.data.object.sha,
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

runAction();
