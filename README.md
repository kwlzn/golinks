# GoLinks

A dead simple go links service.

## Features

- Create short, memorable links (e.g., `go/docs`) that redirect to longer URLs.
- Dynamic parameterized links (e.g., `go/jira/ABC-123` → `https://jira.company.com/browse/ABC-123`).
- Web interface to manage links.
- API endpoints for programmatic access.
- SQLite (development) or PostgreSQL (production) database for storage.

## Caveats

- No auth (use only in environments of high trust, like your startup).

## Usage

- To manage links, use the `/links` endpoint (e.g. Enter `go/links` in a browser)
- To use a link, go to `/{slug}` (e.g. Enter `go/my-cool-link` in a browser)

### Slug Format Rules

Slugs must follow these basic rules:

- Must start with a letter or number.
- Can only contain letters, numbers, dots, underscores, hyphens, and forward slashes.
- Examples of valid slugs: `docs`, `team/engineering`, `design-system`, `api.v2`.

### Hierarchical Organization

You can use forward slashes (`/`) in your static links to create logical nested hierarchies:

```
go/team/roadmap
go/team/roadmap/2025
go/team/roadmap/2025/q1
go/team/roadmap/2025/q2
go/team/charter
```

Each static name is treated as a distinct link that can point to a specific URL. This allows you to build intuitive navigation structures that mirror your organization's information hierarchy - think of them like virtual folders.

### Dynamic Links

Dynamic links allow you to create parameterized redirects with a single link entry. For example:

1. Create a dynamic link with:
   - **Slug**: `jira`
   - **URL**: `https://jira.company.com/browse/%s`
   - Check the **Dynamic Link** box

2. Now you can use:
   - `go/jira/ABC-123` → redirects to `https://jira.company.com/browse/ABC-123`
   - `go/jira/DEF-456` → redirects to `https://jira.company.com/browse/DEF-456`

Dynamic links work by replacing the `%s` placeholder in your target URL with whatever path comes after your slug.

#### Dynamic Link Examples

| Name | Target URL with placeholder | Example usage | Redirects to |
|------|---------------------------|--------------|-------------|
| `docs` | `https://docs.company.com/%s` | `go/docs/api/v2` | `https://docs.company.com/api/v2` |
| `github` | `https://github.com/myorg/%s` | `go/github/project` | `https://github.com/myorg/project` |
| `search` | `https://google.com/search?q=%s` | `go/search/golinks` | `https://google.com/search?q=golinks` |

#### Priority and Relationship with Static Hierarchies

Static links take precedence over dynamic ones. This is particularly important when combining hierarchical organization with dynamic links. For example, if these both exist:

- A static link `jira/roadmap` pointing to a specific roadmap page
- A dynamic link `jira` with the `%s` placeholder

Then:

- `go/jira/roadmap` will use the static link to the specific roadmap page
- `go/jira/ABC-123` will use the dynamic link, replacing `%s` with `ABC-123`

This allows you to build logical hierarchies for common paths while letting the dynamic link handle all other cases. You can create as many static links in a hierarchy as needed and the system will only use the dynamic link when no matching static link is found.

## Setup

### Prerequisites

- Python 3.10+
- `uv` - Fast Python package installer and resolver (https://github.com/astral-sh/uv)
- SQLite (for local development)
- PostgreSQL (optional, for test/production deployments)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/kwlzn/golinks
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

3. If upgrading from a previous version, run the schema update script:

   ```
   python update_schema.py
   ```

4. Run the application:

   For development:

   ```
   make run-dev  # Uses SQLite and has auto-reload enabled
   ```

   For production:

   ```
   make run-prod  # Uses PostgreSQL and has reload disabled
   ```

5. Point the `go` DNS name for your search domain to this site.
6. Visit `http://go/links` to manage your go links - then use e.g. `go/<name>` in your browser to quickly get to links.

### Database Configuration

The application supports two database backends:

#### SQLite (Development)
- Lightweight, file-based database
- Good for development and testing
- Set `DB_TYPE=sqlite` in your `.env` file
- No additional setup required

#### PostgreSQL (Production)
- Robust, production-ready database
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
