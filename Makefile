# One front door for the project. `make` lists everything.
# The bot runs on the Mac (it needs OBS, `say` and the browser login); Docker is only for checks on a clean machine.
.DEFAULT_GOAL := help
.PHONY: help install check test typecheck start preview login-bot login-channel login-spotify rewards-check launcher docker-check

help: ## list commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-15s %s\n", $$1, $$2}'

install: ## install dependencies (Node 25)
	npm install

check: test typecheck ## tests + types, run before every commit

test: ## Vitest
	npm test

typecheck: ## tsc --noEmit
	npm run typecheck

start: ## run the bot + overlays (needs .env and tokens/)
	npm start

preview: ## demo city, no Twitch: make preview THEME=onepiece PHASE=night → :3005/town
	npm run preview -- $(or $(THEME),plain) $(or $(PHASE),day)

login-bot: ## log the bot account in (device code)
	npm run login -- bot

login-channel: ## log the broadcaster in (device code)
	npm run login -- channel

login-spotify: ## Spotify login for song requests
	npm run login:spotify

rewards-check: ## can the API manage Channel Points here?
	npm run rewards:check

launcher: ## build ~/Applications/Isamy Stream.app (bot + OBS)
	npm run launcher

docker-check: ## make check in a clean Node 25 container (no secrets copied in)
	docker build -t twitch-handler-check . && docker run --rm twitch-handler-check
