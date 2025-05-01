.DEFAULT_GOAL := all
isort = isort /com_res
black = black -S -l 120 --target-version py310 /com_res

.PHONY: up
up:
	docker compose up

.PHONY: up-all
up-all:
	docker compose up -d
	cd frontend && npx pm2 start npm --name com_res -- run dev

.PHONY: up-d
up-d:
	docker compose up -d

.PHONY: down
down:
	docker compose down

.PHONY: down-all
down-all:
	docker compose down
	npx pm2 delete com_res

.PHONY: build
build:
	docker compose build

.PHONY: build-all
build:
	docker compose build
	cd frontend && npm install

.PHONY: logs-front
logs-front:
	npx pm2 logs com_res

.PHONY: logs-back
logs-back:
	docker compose logs -f api

.PHONY: test
test:
	docker compose exec api pytest tests

.PHONY: format
format:
	docker compose run -T api $(isort)
	docker compose run -T api $(black)
