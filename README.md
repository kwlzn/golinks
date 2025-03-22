# GoLinks

A simple go links service for URL redirection.

## Features

- Create short, memorable links (e.g., `go/docs`) that redirect to longer URLs
- Web interface to manage links
- API endpoints for programmatic access
- SQLite (development) or PostgreSQL (production) database for storage

## Setup

### Prerequisites

- Python 3.8+
- `uv` - Fast Python package installer and resolver (https://github.com/astral-sh/uv)
- SQLite (built into Python) for development
- PostgreSQL (optional, for production)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd golinks
   ```

2. Setup for development (SQLite):
   ```
   make setup-dev
   make env-dev
   make init-db
   ```

   OR

   Setup for production (PostgreSQL):
   ```
   make setup-prod
   make env-prod  # Edit .env after to set your database credentials
   make init-db
   ```

3. Run the application:

   For development:
   ```
   make run-dev  # Uses SQLite and has auto-reload enabled
   ```

   For production:
   ```
   make run-prod  # Uses PostgreSQL and has reload disabled
   ```

4. Visit `http://localhost:8000/links` to manage your go links.

### Database Configuration

The application supports two database backends:

#### SQLite (Development)
- Lightweight, file-based database
- No additional setup required
- Good for development and testing
- Set `DB_TYPE=sqlite` in your `.env` file

#### PostgreSQL (Production)
- Robust, production-ready database
- Requires PostgreSQL server
- Better performance for high traffic
- Set `DB_TYPE=postgresql` in your `.env` file
- Configure PostgreSQL connection settings in your `.env` file

### Using the Makefile

The provided Makefile includes the following targets:

- `make setup-dev` - Sets up environment for development (SQLite)
- `make setup-prod` - Sets up environment for production (PostgreSQL)
- `make env-dev` - Creates .env file for development environment
- `make env-prod` - Creates .env file for production environment
- `make init-db` - Initializes the database tables
- `make run-dev` - Runs the application with SQLite and auto-reload
- `make run-prod` - Runs the application with PostgreSQL for production
- `make clean` - Cleans up temporary files and directories
- `make all` - Runs setup, init-db, and run in sequence (using development config)

## Usage

- To create a new link, go to `http://localhost:8000/links`
- To use a link, go to `http://localhost:8000/{slug}`

### Slug Format Rules

Slugs must follow these rules:
- Must start with a letter or number
- Can only contain letters, numbers, dots, underscores, hyphens, and forward slashes
- Examples of valid slugs: `docs`, `team/engineering`, `design-system`, `api.v2`

## API Endpoints

- `GET /_api/links` - List all links
- `POST /_api/links` - Create a new link
- `GET /_api/links/{slug}` - Get a specific link
- `DELETE /_api/links/{slug}` - Delete a link

## Production Deployment

For production deployment, consider:

1. Setting up NGINX or Apache as a reverse proxy
2. Using a more robust PostgreSQL setup
3. Implementing proper authentication for managing links