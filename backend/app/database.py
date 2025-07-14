import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database path from environment variable, default to in-memory if not set
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "sqlite:///:memory:")

# Create the database directory if it doesn't exist
if SQLITE_DB_PATH and SQLITE_DB_PATH != "sqlite:///:memory:":
    db_dir = os.path.dirname(SQLITE_DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

# Use the path in the SQLAlchemy URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}" if not SQLITE_DB_PATH.startswith("sqlite://") else SQLITE_DB_PATH

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
