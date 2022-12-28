# automatic-release-action

Create temporal releases with github actions

## Inputs

### `name`

Name of the app. Defaults to repository name.

### `environment`

Runtime stage / environment, e.g. dev, staging, prod. If not set, no environment will be appended to the tag.

### `githubToken`

** Required ** The GitHub token to use for the action. See [Automatic token authentication](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) for more information.

### `prerelease`

Whether to identify the release as prerelease. Defaults to false. see [Create a release](https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release) for more information.

## Example usage

```yaml
uses: Virtual-Finland-Development/automatic-release-action@v1.0
with:
  name: appName
  environment: dev
  githubToken: ${{ secrets.GITHUB_TOKEN }}
```

## References

- [Github Actions](https://docs.github.com/en/actions/creating-actions)

- [github.com/daily-co/create-tag-action](https://github.com/daily-co/create-tag-action)

- [github.com/actions/typescript-action](https://github.com/actions/typescript-action)
