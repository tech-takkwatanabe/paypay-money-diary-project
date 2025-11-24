.PHONY: init up down clean

init:
	docker compose up -d --build

up:
	docker compose up -d

down:
	docker compose down

clean:
	docker compose down -v
	rm -rf node_modules
