# Update the public GitHub repository

Push the code in the private repository
https://github.com/liuxiaowen/topmsv_private.git to the public repository
https://github.com/toppic-suite/topmsv.git.

The public repository is cloned into a temporary `github_update` directory,
the private repository is added as the `upstream` remote, its `main` branch
and tags are merged in and pushed, and the temporary directory is removed.

Run these commands from a directory outside the repositories:

```bash
mkdir github_update
cd github_update
git clone https://github.com/toppic-suite/topmsv.git topmsv
cd topmsv
git remote add upstream https://github.com/liuxiaowen/topmsv_private.git
git fetch upstream --tags
git merge --no-edit upstream/main
git push --tags
git push
cd ../../
rm -rf github_update
```

Notes:

- `git merge --no-edit upstream/main` needs the private and public histories to share
  a common ancestor; resolve any conflicts before pushing.
- Pushing to https://github.com/toppic-suite/topmsv.git requires write
  access to the toppic-suite organization.
