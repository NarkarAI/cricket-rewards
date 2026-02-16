.PHONY: dev dev-services backend frontend test lint clean

dev-services:
	docker-compose -f docker-compose.dev.yml up -d

dev: dev-services
	@echo "MongoDB and Redis are running"
	@echo "Start backend: cd packages/backend && uvicorn app.main:app --reload --port 8000"
	@echo "Start frontend: cd packages/frontend && npm run dev"

up:
	docker-compose up --build

down:
	docker-compose down

backend:
	cd packages/backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd packages/frontend && npm run dev

test:
	cd packages/backend && python -m pytest tests/ -v

lint:
	cd packages/backend && python -m ruff check app/
	cd packages/frontend && npx next lint

clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
