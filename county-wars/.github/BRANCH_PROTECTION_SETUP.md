# GitHub Branch Protection Setup

To make GitHub run tests before merging pull requests, follow these steps:

## 1. Enable GitHub Actions (Already Done)
✅ Created `.github/workflows/ci.yml` - runs on every PR and push
✅ Created `.github/workflows/e2e-tests.yml` - runs E2E tests (optional)

## 2. Set Up Branch Protection Rules

### Go to your repository settings:
1. Navigate to your GitHub repository
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** or **Add branch protection rule**

### Configure the protection rule:

**Branch name pattern:** `main` (or `master` if that's your default branch)

**Protection settings to enable:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1 (or more if you have a team)
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (optional)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:** Add these exact names:
    - `frontend-tests`
    - `e2e-tests` (if you want E2E tests to be required)

- ✅ **Require conversation resolution before merging**
- ✅ **Include administrators** (applies rules to repo admins too)

### Alternative: Minimal Setup
If you want the simplest setup, just enable:
- ✅ **Require status checks to pass before merging**
- Add `frontend-tests` as a required status check

## 3. Test the Setup

1. Create a new branch: `git checkout -b test-branch`
2. Make a small change to any file
3. Commit and push: `git push origin test-branch`
4. Create a pull request on GitHub
5. Verify that the CI tests run automatically
6. The PR will be blocked from merging until tests pass

## 4. What Happens Now

- ✅ **Every pull request** will automatically run:
  - ESLint code quality checks
  - Frontend Jest tests (map loading verification)
  - Build verification
  - Optional: E2E tests

- ✅ **PRs cannot be merged** until all required checks pass
- ✅ **Tests run on every commit** pushed to a PR
- ✅ **Status badges** show test results directly in the PR

## 5. Troubleshooting

If tests fail in CI but pass locally:
- Check Node.js version (CI uses Node 18)
- Ensure all dependencies are in `package.json` 
- Check for environment-specific issues

## 6. Adding More Tests

To add more test requirements:
1. Add test scripts to `package.json`
2. Add them to the CI workflow in `.github/workflows/ci.yml`
3. Update branch protection rules to require the new checks

## Example CI Workflow Structure

```yaml
name: CI
on:
  pull_request:
    branches: [ main ]
jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run lint
    - run: npm run test:frontend  # Your new test!
    - run: npm run build
```

The workflow is already set up for you! Just enable branch protection rules in your GitHub repository settings.