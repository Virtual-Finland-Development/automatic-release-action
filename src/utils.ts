import * as core from '@actions/core';

/**
 * Parses list of input requirements to validated inputs map
 *
 * @param inputRequirements
 * @returns
 */
export function parseGitActionInputs(
  inputRequirements: Array<{
    name: keyof ReleasePackage['inputs'];
    fallback:
      | ReleasePackage['inputs'][keyof ReleasePackage['inputs']]
      | undefined
      | (() =>
          | ReleasePackage['inputs'][keyof ReleasePackage['inputs']]
          | undefined);
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
export function generateTagName({
  name,
  environment,
}: {
  name: string;
  environment: string;
}) {
  const date = new Date().toISOString().split('T')[0];
  return [name, date, environment].filter(Boolean).join('-');
}
