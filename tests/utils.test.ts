import { expect, test } from '@jest/globals';
import { ensureBoolean, parseGitActionInputs } from '../src/utils';

test('test conversions', () => {
  expect(ensureBoolean('true')).toBe(true);
  expect(ensureBoolean('yes')).toBe(true);
  expect(ensureBoolean('no')).toBe(false);
});

test('test input parsers', () => {
  const inputs = parseGitActionInputs([
    {
      name: 'name',
      fallback: () => 'name',
    },
    {
      name: 'prerelease',
      fallback: 'true',
      format: ensureBoolean,
    },
  ]);

  expect(inputs.name).toBe('name');
  expect(inputs.prerelease).toBe(true);
});
