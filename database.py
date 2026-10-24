
import sqlite3
from pathlib import Path

# Store the database in the main RoadAlert project folder
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "roadalert.db"


def get_db_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT UNIQUE,
            incident_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT,
            location TEXT NOT NULL,
            evidence TEXT,
            status TEXT NOT NULL DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()
