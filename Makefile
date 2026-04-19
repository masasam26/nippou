.PHONY: install lint lint-fix format format-check type-check test ci deploy

install:
	cd frontend && npm install
	cd backend && npm install

lint:
	cd frontend && npm run lint
	cd backend && npm run lint

lint-fix:
	cd frontend && npm run lint:fix
	cd backend && npm run lint:fix

format:
	cd frontend && npm run format
	cd backend && npm run format

format-check:
	cd frontend && npm run format:check
	cd backend && npm run format:check

type-check:
	cd frontend && npm run type-check
	cd backend && npm run type-check

test:
	cd frontend && npm test -- --passWithNoTests --ci
	cd backend && npm test -- --ci

ci: lint format-check type-check test

deploy:
	npx vercel --cwd frontend --prod --yes \
		--token=$(VERCEL_TOKEN)
