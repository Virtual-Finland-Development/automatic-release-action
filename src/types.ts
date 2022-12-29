interface ReleasePackage {
  tagName: string;
  inputs: {
    name: string;
    environment: string;
    githubToken: string;
    githubSHA: string;
    prerelease: boolean;
    disabled: boolean;
  };
  repositoryContext: {
    owner: string;
    repo: string;
  };
}
