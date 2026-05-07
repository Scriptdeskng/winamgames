.PHONY: help build up down restart logs ps api-shell web-shell db-shell clean migrate downgrade seed bootstrap reset-db wait-db admin-draw-smoke admin-integration-smoke intelli-webhook-smoke verify

COMPOSE ?= docker compose

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
		'  make clean      Stop the stack and remove volumes'

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

verify: build migrate seed admin-integration-smoke

api-shell:
	$(COMPOSE) run --rm --no-deps api sh

web-shell:
	$(COMPOSE) run --rm --no-deps web sh

db-shell:
	$(COMPOSE) exec db psql -U postgres -d winam

clean:
	$(COMPOSE) down -v --remove-orphans
