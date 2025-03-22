.PHONY: setup setup-dev setup-prod run-dev run-prod init-db clean

# Default Python executable
PYTHON ?= python

# Ensure virtual environment exists
ensure-venv:
	@if [ ! -d .venv ]; then \
		echo "Creating virtual environment..."; \
		uv venv; \
	fi

# Target for setting up development environment (SQLite)
setup-dev: ensure-venv
	uv pip install -r requirements.txt
	@echo "Development environment (SQLite) setup complete"

# Target for setting up production environment (PostgreSQL)
setup-prod: ensure-venv
	uv pip install -r requirements.txt -E postgres
	@echo "Production environment (PostgreSQL) setup complete"

# Default setup target (uses development environment)
setup: setup-dev

# Create or update .env file for development (SQLite)
env-dev:
	@echo "ENV=development" > .env
	@echo "DB_TYPE=sqlite" >> .env
	@echo "SQLITE_FILE=golinks.db" >> .env
	@echo "Development environment variables written to .env"

# Create or update .env file for production (PostgreSQL)
env-prod:
	@echo "ENV=production" > .env
	@echo "DB_TYPE=postgresql" >> .env
	@echo "POSTGRES_USER=postgres" >> .env
	@echo "POSTGRES_PASSWORD=postgres" >> .env
	@echo "POSTGRES_SERVER=localhost" >> .env
	@echo "POSTGRES_PORT=5432" >> .env
	@echo "POSTGRES_DB=golinks" >> .env
	@echo "Production environment variables written to .env (please update with your actual PostgreSQL credentials)"

# Target for initializing the database
init-db: ensure-venv
	uv run python init_db.py

# Target for running the application in development mode (SQLite)
run-dev: ensure-venv env-dev
	uv pip install --quiet uvicorn
	uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Target for running the application in production mode (PostgreSQL)
run-prod: ensure-venv env-prod
	uv pip install --quiet uvicorn
	uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Default run target (uses development mode)
run: run-dev

# Target for cleaning up
clean:
	rm -rf __pycache__
	rm -rf */__pycache__
	rm -rf .uv
	rm -rf .venv
	rm -f golinks.db

# Default target to run when no arguments are passed to make
all: setup init-db run