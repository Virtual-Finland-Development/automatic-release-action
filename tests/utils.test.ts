import { expect, test } from '@jest/globals';
import {
  ensureBoolean,
  generateTagName,
  parseGitActionInputs,
} from '../src/utils';

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
    {
      name: 'disabled',
      fallback: ' true',
      format: ensureBoolean,
    },
  ]);

  expect(inputs.name).toBe('name');
  expect(inputs.prerelease).toBe(true);
  expect(inputs.disabled).toBe(true);
});

test('test tag naming', () => {
  expect(generateTagName({ name: 'exampleApp', environment: 'dev' })).toMatch(
    new RegExp('exampleApp-\\d{4}-\\d{2}-\\d{2}-dev'),
  );
  expect(generateTagName({ name: 'exampleApp' })).toMatch(
    new RegExp('exampleApp-\\d{4}-\\d{2}-\\d{2}'),
  );
});
