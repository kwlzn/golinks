from api.links import router as links_router
from db.database import get_db, Link

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException as StarletteHTTPException


app = FastAPI(title="GoLinks")
app.include_router(links_router, prefix="/_api")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and request.url.path.count('/') == 1:
        # Only handle root-level paths for GoLinks (e.g., /something)
        slug = request.url.path.strip('/')
        return templates.TemplateResponse(
            "404.html", 
            {"request": request, "slug": slug}, 
            status_code=404
        )
    # For other errors, use the default handler
    return await http_exception_handler(request, exc)

@app.get("/")
async def root():
    return RedirectResponse(url="/links", status_code=302)

@app.get("/links", response_class=HTMLResponse)
async def links_page(request: Request):
    return templates.TemplateResponse("links.html", {"request": request})

# This catch-all route must be last and handle multiple path segments
@app.get("/{path:path}")
async def redirect_to_url(path: str, request: Request, db: Session = Depends(get_db)):
    # Skip redirects for any paths that start with underscore, static, or api
    if path.startswith('_') or path.startswith('static/') or path.startswith('api/'):
        raise HTTPException(status_code=404, detail="Link not found")
    
    slug = path
    link = db.query(Link).filter(Link.slug == slug).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    return RedirectResponse(url=link.url, status_code=302)

if __name__ == "__main__":
    # Direct execution - use uvicorn directly
    # For production or with uv, use the Makefile or run:
    # uv run uvicorn main:app --host 0.0.0.0 --port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
