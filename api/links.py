from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from db.database import get_db, Link
from schemas.link import LinkCreate, LinkResponse, LinkSearch
from typing import List, Optional, Dict, Any

router = APIRouter()

@router.post("/links", response_model=LinkResponse)
@router.post("/links/", response_model=LinkResponse)
def create_link(link_data: LinkCreate, db: Session = Depends(get_db)):
    print(f"Creating link with data: {link_data}")
    
    existing_link = db.query(Link).filter(Link.slug == link_data.slug).first()
    if existing_link:
        print(f"Slug '{link_data.slug}' already in use")
        raise HTTPException(status_code=400, detail="Slug already in use")
    
    # Validation is already handled by Pydantic model validators
    print("Validation passed, creating link")
    
    db_link = Link(
        slug=link_data.slug,
        url=link_data.url,
        username=link_data.username
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    print(f"Link created: {db_link.slug} -> {db_link.url}")
    return db_link

@router.get("/links", response_model=List[LinkResponse])
@router.get("/links/", response_model=List[LinkResponse])
def get_links(db: Session = Depends(get_db)):
    links = db.query(Link).all()
    return links

@router.get("/links/user/{username}", response_model=List[LinkResponse])
@router.get("/links/user/{username}/", response_model=List[LinkResponse])
def get_user_links(username: str, limit: int = 10, db: Session = Depends(get_db)):
    links = db.query(Link).filter(Link.username == username).order_by(Link.created_at.desc()).limit(limit).all()
    return links


@router.get("/links/search")
@router.get("/links/search/")
def search_links(query: str = Query(..., description="Search query with * as wildcard"), db: Session = Depends(get_db)):
    # Convert the wildcard pattern to SQL LIKE pattern
    like_pattern = query.replace("*", "%")
    
    # Get the total count using SQL COUNT
    total_count = db.query(func.count(Link.id)).filter(Link.slug.like(like_pattern)).scalar()
    
    # Limit to top 10 most recent links in a single query
    limited_links = db.query(Link).filter(Link.slug.like(like_pattern)).order_by(Link.created_at.desc()).limit(10).all()
    
    # Return both the total count and the limited results
    return {
        "total_count": total_count,
        "links": limited_links
    }

@router.get("/links/{slug:path}", response_model=LinkResponse)
def get_link(slug: str, db: Session = Depends(get_db)):
    print(f"Looking up slug: {slug}")
    link = db.query(Link).filter(Link.slug == slug).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return link

@router.delete("/links/{slug:path}")
def delete_link(slug: str, db: Session = Depends(get_db)):
    print(f"Attempting to delete slug: {slug}")
    link = db.query(Link).filter(Link.slug == slug).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    print(f"Deleting link: {link.slug} -> {link.url}")
    db.delete(link)
    db.commit()
    return {"message": "Link deleted successfully"}