# Contributing

Thanks for helping with the MLM project! This document helps contributors get set up and explains the basic workflow.

Getting started

- Fork or be added as a collaborator on the repository.
- Clone the repository and install dependencies for both `backend` and `frontend`.

Prerequisites

- Node.js 18+ and npm
- Docker (optional but recommended for local Postgres + Redis)
- Git and a GitHub account

Local setup (quick)

1. Start Postgres and Redis using the provided `docker-compose.yml`:

```bash
docker-compose up -d
```

1. Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma generate
# If migrations are present and you want to apply them:
npx prisma migrate dev --name init
npm run dev
```

1. Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Workflow

- Use feature branches: `git checkout -b feat/your-feature`
- Push to origin and open a Pull Request against `main`.
- Tests/CI will run on PRs. Request a review before merging.

Code style & tests

- Keep changes small and focused. Add unit tests for new logic when possible.

Questions

- Open an issue or ping the repo owner on GitHub.

Code style

- This repo uses TypeScript, ESLint and Prettier where configured. Run linters and formatters before opening a PR:

```powershell
# from repo root for backend
cd backend
npm run lint --if-present
# from repo root for frontend
cd ..\frontend
npm run lint --if-present
```

- If no lint script exists, run `npx eslint . --ext .ts,.tsx,.js` or `npx prettier --check .` in the relevant folder.

Commit messages

- Use Conventional Commits for clarity: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` etc.
- Example: `feat(api): add admin products endpoint`

Pull request checklist

- [ ] The PR has a clear title and description explaining what and why.
- [ ] Linked issue (if applicable) and acceptance criteria are included.
- [ ] Code builds locally and CI passes.
- [ ] New code has unit/integration tests, or a TODO explaining why tests are omitted.
- [ ] All new and existing linters/formatters pass.
- [ ] Documentation updated when relevant (README, CONTRIBUTING, inline comments).

Where to run things

- Backend development: `cd backend` and run the scripts in `package.json`.
- Frontend development: `cd frontend` and run the scripts in `package.json`.

If you're unsure about style or practices, open a draft PR or an issue — discussion before implementation saves time.

## Docker Compose: secure startup

- To avoid committing secrets, set `POSTGRES_PASSWORD` locally before starting the stack. Example (PowerShell):

```powershell
# from repo root - set a secure password in the current session
$env:POSTGRES_PASSWORD = 'ReplaceWithASecureRandomPassword!'

# start services
docker-compose up -d
```

- Alternatively create a top-level `.env` (not checked in) with the following content:

```dotenv
POSTGRES_PASSWORD=ReplaceWithASecureRandomPassword!
```

- Then run:

```powershell
docker-compose up -d
```

- After the services are up, copy the backend example env and update `DATABASE_URL` if needed:

```powershell
cd backend
Copy-Item .env.example .env
# Edit .env to replace the placeholder password with your chosen value if you didn't use ${POSTGRES_PASSWORD}
```

Note: Do not commit `.env` files or real credentials to the repository. Use CI secrets or a vault for production deployments.
