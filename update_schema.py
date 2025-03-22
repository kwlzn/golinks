#!/usr/bin/env python3
from db.database import engine, Base, get_db
from sqlalchemy import Column, Integer, String, DateTime, text
from sqlalchemy.orm import Session

# Create is_dynamic column in links table if it doesn't exist
def update_schema():
    try:
        # Check if column exists
        with engine.connect() as conn:
            # Different syntax for SQLite and PostgreSQL
            if 'sqlite' in str(engine.url):
                # SQLite
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM pragma_table_info('links') 
                    WHERE name='is_dynamic'
                """))
                column_exists = result.scalar() > 0
                
                if not column_exists:
                    print("Adding is_dynamic column to links table...")
                    conn.execute(text("ALTER TABLE links ADD COLUMN is_dynamic INTEGER DEFAULT 0 NOT NULL"))
                    print("Schema updated successfully!")
                else:
                    print("The is_dynamic column already exists in the links table.")
            else:
                # PostgreSQL
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_name='links' AND column_name='is_dynamic'
                """))
                column_exists = result.scalar() > 0
                
                if not column_exists:
                    print("Adding is_dynamic column to links table...")
                    conn.execute(text("ALTER TABLE links ADD COLUMN is_dynamic INTEGER DEFAULT 0 NOT NULL"))
                    print("Schema updated successfully!")
                else:
                    print("The is_dynamic column already exists in the links table.")
    except Exception as e:
        print(f"Error updating schema: {e}")

if __name__ == "__main__":
    update_schema()