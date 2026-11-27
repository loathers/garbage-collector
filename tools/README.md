# SoCP updater

Requires Node 24 and Git with a configured commit identity.

```sh
yarn install --immutable
yarn updateSocp --dry-run
yarn updateSocp
```

By default, checks the current KoL day and commits a new reward on
`socp-{itemid}`, based on the latest remote `main`. Does not push or open a PR.
The reward-data migration must be merged into `main` first.

| Argument            | Purpose                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `--dry-run`         | Report the proposed addition without creating a branch.                                        |
| `--write`           | Edit the checked-out data file for the workflow; requires latest `main` and a clean data file. |
| `--remote NAME`     | Remote containing `main`; defaults to `origin`.                                                |
| `--date YYYY-MM-DD` | Check the KoL game day corresponding to this calendar date.                                    |
| `--help`, `-h`      | Show usage.                                                                                    |

`--dry-run` and `--write` are mutually exclusive.

No custom environment variables or secrets are required. GitHub Actions supplies:

- `GITHUB_TOKEN`: used automatically by the PR action.
- `GITHUB_OUTPUT`: receives step outputs from `--write`.

The workflow runs at **03:45 UTC** (10:45 PM EST / 11:45 PM EDT), or manually via
**Actions → Update SoCP rewards → Run workflow**. Enable **Settings → Actions →
General → Workflow permissions → Allow GitHub Actions to create and approve pull
requests**. The workflow must be on `main` to run on schedule.

Checks: `yarn checkTools && yarn testSocp`.
