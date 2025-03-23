import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, HttpUrl, field_validator


class LinkBase(BaseModel):
    slug: str
    url: str
    username: str
    is_dynamic: bool = False
    
    @field_validator('slug')
    def validate_slug(cls, v):
        # Check if slug starts with alphanumeric character
        if not re.match(r'^[a-zA-Z0-9]', v):
            raise ValueError('Slug must start with an alphanumeric character')
        
        # Check if slug contains only allowed characters
        if not re.match(r'^[a-zA-Z0-9._\-/]+$', v):
            raise ValueError('Slug can only contain alphanumeric characters, dots, underscores, hyphens, and forward slashes')
        
        return v
        
    @field_validator('url')
    def validate_url(cls, v, values):
        # If is_dynamic is True, validate that URL contains %s placeholder
        if values.data.get('is_dynamic', False) and '%s' not in v:
            raise ValueError('Dynamic links must contain a %s placeholder in the URL')
            
        return v


class LinkCreate(LinkBase):
    pass


class LinkResponse(LinkBase):
    id: int
    created_at: datetime
    
    model_config = {
        "from_attributes": True  # Replaces orm_mode in Pydantic v2
    }

    
class LinkSearch(BaseModel):
    query: str