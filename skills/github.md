# Update the public GitHub repository

Push the code in the private repository
https://github.com/liuxiaowen/topmsv_private.git to the public repository
https://github.com/toppic-suite/topmsv.git.

The public repository is cloned into a temporary `github_update` directory,
the private repository is added as the `upstream` remote, the public `main`
branch is fast-forwarded to the private one, the branch and the tags are
pushed, and the temporary directory is removed.

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

- The first run into an empty public repository adopts the private history
  outright. Later runs fast-forward the public `main` branch; only when
  someone has committed directly to the public repository does
  `git merge --no-edit upstream/main` create a merge commit, and any
  conflicts must be resolved before pushing.
- Pushing to https://github.com/toppic-suite/topmsv.git requires write
  access to the toppic-suite organization.
