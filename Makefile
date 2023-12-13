SHELL = /bin/sh
docker_bin := $(shell command -v docker 2> /dev/null)
docker_compose_bin := $(shell command -v docker-compose 2> /dev/null)

.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "\n  Allowed for overriding next properties:\n\n\
		Usage example:\n\
	    	make dev"
# --- [ Main ] --------------------------------------------------------------------------------------------------

init: npm nest-build ## Инициализация проекта

# --- [ Node Keycloak ] ------------------------------------------------------------------------------------------
npm: ## install node modules
	cd app/ && npm i

dev: ## start nest app in dev mode
	cd app/ && npm run start:dev

nest-build: ## build nest app
	cd app/ && npm run build

