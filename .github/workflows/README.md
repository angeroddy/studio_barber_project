# CI/CD Workflows

This repository now includes versioned GitHub Actions workflows:

- `ci.yml`: lint + build + test gates on `push` and `pull_request`
- `security-audit.yml`: `npm audit` gate on `push`, `pull_request`, and weekly schedule
- `deploy.yml`: deployment trigger after successful `CI` on `main/master` (or manual dispatch)

## Deployment secrets

Configure the following repository secrets to enable webhook-based deployments:

- `BACKEND_DEPLOY_WEBHOOK`
- `DASHBOARD_DEPLOY_WEBHOOK`
- `FRONT_CLIENT_DEPLOY_WEBHOOK`

If a secret is missing, the deploy workflow logs a warning and skips that app.
