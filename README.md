# automatic-release-action

Create temporal releases with github actions. This action will create a release with input name and the current date as the tag name. If the release already exists, it will be updated.

## Inputs

### `name`

Name of the app. Defaults to repository name.

### `environment`

Runtime stage / environment, e.g. dev, staging, prod. If not set, no environment will be appended to the tag.

### `githubToken`

** Required ** The GitHub token to use for the action. See [Automatic token authentication](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) for more information.

### `prerelease`

A booleanish flag to signal whether to identify the release as a prerelease. Defaults to false. See [Create a release](https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release) for more information.

## Example usage

```yaml
uses: Virtual-Finland-Development/automatic-release-action@v1.0
with:
  name: appName
  environment: dev
  githubToken: ${{ secrets.GITHUB_TOKEN }}
```

-> This will create a release with the name like `appName-2022-12-28-dev`.

## References

- [Github Actions](https://docs.github.com/en/actions/creating-actions)

- [github.com/daily-co/create-tag-action](https://github.com/daily-co/create-tag-action)

- [github.com/actions/typescript-action](https://github.com/actions/typescript-action)
