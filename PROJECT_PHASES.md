# Project Phases Roadmap

## Phase 1 - UI/UX and Frontend Quality

### Goal
Ship a clean, accessible, mobile-first UI with consistent design patterns.

### Skills to use
- frontend-design-ui-ux
- quasar-skilld
- vue-expert
- lighthouse-scanner
- frontend-testing

### Work items
- Define design tokens (colors, spacing, typography, radius, shadows).
- Standardize shared component states (hover, focus, loading, error, disabled).
- Improve key flows:
  - Login flow
  - Kits list/detail flow
  - Inspection submission flow
  - Incident report flow
- Add frontend tests:
  - Vitest unit tests for stores/composables
  - Component tests for auth and forms
- Run Lighthouse checks and fix accessibility/performance regressions.

### Deliverables
- Reusable UI patterns in frontend components.
- Test coverage for critical user flows.
- Lighthouse baseline report with tracked improvements.

### Done definition
- No major a11y blockers on core pages.
- Core flows work on mobile and desktop.
- Critical frontend tests pass in CI.

---

## Phase 2 - CI/CD and Docker Hardening

### Goal
Make builds reliable, secure, and repeatable with automated checks.

### Skills to use
- devops
- devops-cicd
- devops-deployment

### Work items
- Add CI pipeline stages:
  - Lint
  - Test
  - Build
  - Security scan
- Validate Docker configuration in CI (`docker compose config`).
- Add container security tooling:
  - Trivy image scan
  - Hadolint Dockerfile lint
- Harden images:
  - Non-root runtime user
  - Smaller base images where possible
  - Proper `.dockerignore`
  - Pinned versions for important dependencies
- Add branch protections requiring successful CI.

### Deliverables
- GitHub Actions workflow for frontend/backend checks.
- Security scan reports for containers.
- Hardened Docker images and compose validation.

### Done definition
- Every PR runs quality + security gates.
- Build artifacts are reproducible.
- No critical container vulnerabilities remain untriaged.

---

## Phase 3 - Kubernetes Readiness and Deployment

### Goal
Prepare safe, observable, and scalable deployment to Kubernetes.

### Skills to use
- devops
- devops-deployment
- devops-cicd
- database-security

### Work items
- Create Helm charts for backend and frontend.
- Add Kubernetes health probes:
  - Readiness
  - Liveness
- Define resources:
  - CPU/memory requests and limits
- Manage secrets/config safely with Kubernetes Secrets and env config.
- Set up environment strategy:
  - dev namespace
  - staging namespace
  - prod namespace
- Add observability:
  - Centralized logs
  - Error tracking (for example Sentry)
  - Basic uptime and alerting

### Deliverables
- Helm-based deployment manifests.
- Environment-specific values files.
- Deployment runbook and rollback notes.

### Done definition
- Staging deploy is automated and repeatable.
- Health probes and alerts are active.
- Production promotion process is documented and tested.

---

## Suggested Execution Order
1. Complete Phase 1 first (user impact and UX quality).
2. Move to Phase 2 (delivery safety and automation).
3. Finish with Phase 3 (scalable deployment foundation).

## Immediate Next Step
Start with Phase 1 and prioritize login, kits, inspections, and incidents screens as the first UI/UX sprint.
