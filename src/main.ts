// @see: https://octokit.github.io/rest.js/v19#actions
// @see: https://github.com/actions/toolkit/tree/main/packages/github
import * as core from '@actions/core';
import * as github from '@actions/github';
import { createRelease, createTag, createTagRef } from './actions';
import { ensureBoolean, generateTagName, parseGitActionInputs } from './utils';

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
      format: ensureBoolean,
    },
    {
      name: 'disabled',
      fallback: false,
      required: false,
      format: ensureBoolean,
    },
  ]);

  core.info(`Debug: ${JSON.stringify(inputs)}`);
  if (inputs.disabled) {
    core.info('Action disabled, skipping...');
    return;
  }

  const octokit = github.getOctokit(inputs.githubToken);
  const releasePackage: ReleasePackage = {
    tagName: generateTagName(inputs),
    inputs: inputs,
    repositoryContext: {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    },
  };

  // Engage actions
  await createTag(octokit, releasePackage);
  await createTagRef(octokit, releasePackage);
  await createRelease(octokit, releasePackage);
}

runAction().catch((error) => {
  core.setFailed(error.message);
});
