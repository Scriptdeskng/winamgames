.PHONY: help build up down restart logs ps api-shell web-shell db-shell clean migrate downgrade seed bootstrap reset-db wait-db admin-draw-smoke admin-integration-smoke intelli-webhook-smoke verify prod-build prod-up prod-rebuild-up prod-down prod-restart prod-logs prod-ps prod-wait-db prod-migrate prod-seed prod-bootstrap prod-smoke prod-intelli-webhook-smoke prod-admin-draw-smoke prod-admin-integration-smoke prod-verify prod-deploy prod-api-shell prod-web-shell prod-db-shell

COMPOSE ?= docker compose
PROD_COMPOSE ?= docker compose -f docker-compose.prod.yml --env-file .env.production

help:
	@printf '%s\n' \
		'Winam Docker commands:' \
		'  make build      Build api and web images' \
		'  make up         Start db, api, and web in detached mode' \
		'  make down       Stop the stack' \
		'  make restart    Restart the stack services' \
		'  make logs       Follow container logs' \
		'  make ps         Show running containers' \
		'  make wait-db    Wait for Postgres to accept connections' \
		'  make migrate    Run Alembic migrations' \
		'  make downgrade  Roll back one Alembic revision' \
		'  make seed       Seed default data' \
		'  make bootstrap  Migrate and seed the database' \
		'  make reset-db   Recreate the stack and reseed data' \
		'  make admin-draw-smoke  Run gameplay + admin draw lifecycle smoke test' \
		'  make admin-integration-smoke  Run the full admin API + UI integration smoke test' \
		'  make intelli-webhook-smoke  Run Intelli webhook ingestion smoke test' \
		'  make verify     Build and run the main smoke tests' \
		'  make api-shell  Open a shell in the api container' \
		'  make web-shell  Open a shell in the web container' \
		'  make db-shell   Open psql in the db container' \
		'  make clean      Stop the stack and remove volumes' \
		'Production commands:' \
		'  make prod-build    Build production images' \
		'  make prod-up       Start the production stack with existing images' \
		'  make prod-rebuild-up  Rebuild and start the production stack' \
		'  make prod-down     Stop the production stack' \
		'  make prod-restart  Restart the production stack' \
		'  make prod-logs     Follow production logs' \
		'  make prod-ps       Show production containers' \
		'  make prod-wait-db   Wait for the production Postgres container' \
		'  make prod-migrate  Run production migrations' \
		'  make prod-seed     Seed production data' \
		'  make prod-bootstrap  Migrate and seed production data' \
		'  make prod-smoke    Run production smoke tests without rebuilding' \
		'  make prod-intelli-webhook-smoke  Run the production Intelli webhook smoke test' \
		'  make prod-admin-draw-smoke  Run the production draw lifecycle smoke test' \
		'  make prod-admin-integration-smoke  Run the production admin integration smoke test' \
		'  make prod-verify   Build and run production smoke tests' \
		'  make prod-deploy   Build, migrate, seed, start, and verify the production stack' \
		'  make prod-api-shell  Open a shell in the production api container' \
		'  make prod-web-shell  Open a shell in the production web container' \
		'  make prod-db-shell   Open psql in the production db container'

build:
	$(COMPOSE) build api web

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart api web db

logs:
	$(COMPOSE) logs -f --tail=100

ps:
	$(COMPOSE) ps

wait-db:
	$(COMPOSE) up -d db >/dev/null
	@until $(COMPOSE) exec -T db pg_isready -U postgres -d winam >/dev/null 2>&1; do \
		printf '.'; \
		sleep 1; \
	done
	@printf '\n'

migrate: wait-db
	$(COMPOSE) run --rm --no-deps api alembic upgrade head

downgrade: wait-db
	$(COMPOSE) run --rm --no-deps api alembic downgrade -1

seed: wait-db
	$(COMPOSE) run --rm --no-deps api python -m scripts.seed

bootstrap: migrate seed

reset-db: clean up bootstrap

admin-draw-smoke: wait-db
	$(COMPOSE) run --rm --no-deps api python -m scripts.admin_draw_smoke_test

admin-integration-smoke: wait-db
	$(COMPOSE) run --rm --no-deps api python -m scripts.admin_integration_smoke_test

intelli-webhook-smoke: wait-db
	$(COMPOSE) run --rm --no-deps api python -m scripts.intelli_webhook_smoke_test

verify: build migrate seed intelli-webhook-smoke admin-integration-smoke

prod-build:
	$(PROD_COMPOSE) build api web

prod-up:
	$(PROD_COMPOSE) up -d

prod-rebuild-up:
	$(PROD_COMPOSE) up -d --build

prod-down:
	$(PROD_COMPOSE) down

prod-restart:
	$(PROD_COMPOSE) restart api web db

prod-logs:
	$(PROD_COMPOSE) logs -f --tail=100

prod-ps:
	$(PROD_COMPOSE) ps

prod-wait-db:
	$(PROD_COMPOSE) up -d db >/dev/null
	@until $(PROD_COMPOSE) exec -T db sh -lc 'pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' >/dev/null 2>&1; do \
		printf '.'; \
		sleep 1; \
	done
	@printf '\n'

prod-migrate: prod-wait-db
	$(PROD_COMPOSE) run --rm --no-deps api alembic upgrade head

prod-seed: prod-wait-db
	$(PROD_COMPOSE) run --rm --no-deps api python -m scripts.seed

prod-bootstrap: prod-migrate prod-seed

prod-smoke: prod-intelli-webhook-smoke prod-admin-draw-smoke prod-admin-integration-smoke

prod-intelli-webhook-smoke: prod-wait-db
	$(PROD_COMPOSE) run --rm --no-deps api python -m scripts.intelli_webhook_smoke_test

prod-admin-draw-smoke: prod-wait-db
	$(PROD_COMPOSE) run --rm --no-deps api python -m scripts.admin_draw_smoke_test

prod-admin-integration-smoke: prod-wait-db
	$(PROD_COMPOSE) run --rm --no-deps api python -m scripts.admin_integration_smoke_test

prod-verify: prod-build prod-migrate prod-seed prod-smoke

prod-deploy: prod-build prod-migrate prod-seed prod-up prod-smoke

prod-api-shell:
	$(PROD_COMPOSE) run --rm --no-deps api sh

prod-web-shell:
	$(PROD_COMPOSE) run --rm --no-deps web sh

prod-db-shell:
	$(PROD_COMPOSE) exec db sh -lc 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

api-shell:
	$(COMPOSE) run --rm --no-deps api sh

web-shell:
	$(COMPOSE) run --rm --no-deps web sh

db-shell:
	$(COMPOSE) exec db psql -U postgres -d winam

clean:
	$(COMPOSE) down -v --remove-orphans
