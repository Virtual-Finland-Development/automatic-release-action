# automatic-release-action

Creates temporal releases with github actions

## Inputs

### `name`

Name of the app. Defaults to repository name.

### `environment`

Runtime stage / environment, e.g. dev, staging, prod. If not set, no environment will be appended to the tag.

### `githubToken`

The GitHub token to use for the action. See [Automatic token authentication](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) for more information.

## Example usage

```yaml
uses: Virtual-Finland/automatic-release-action@v1.0
with:
  name: appName
  environment: dev
  githubToken: ${{ secrets.GITHUB_TOKEN }}
```

## References

- [Github Actions](https://docs.github.com/en/actions/creating-actions)

- [github.com/daily-co/create-tag-action](https://github.com/daily-co/create-tag-action)
