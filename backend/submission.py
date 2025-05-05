import json
import os
import re
from datetime import datetime
from filelock import FileLock

# Configuration
SQL_FILE = os.getenv("SQL_FILE", "log/submissions.sql")
SQL_LOCK = SQL_FILE + ".lock"

def init_sql_file():
    """Initialize submissions.sql with table creation if it doesn't exist"""
    if not os.path.exists(SQL_FILE):
        os.makedirs(os.path.dirname(SQL_FILE), exist_ok=True)
        with FileLock(SQL_LOCK):
            with open(SQL_FILE, 'w') as f:
                f.write("""
                    CREATE TABLE IF NOT EXISTS submissions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        data TEXT NOT NULL
                    );
                """)

def save_submission(data):
    """Save submission data as an INSERT statement in submissions.sql"""
    try:
        # Validate data
        if not data.get('project_id'):
            raise ValueError("Missing or empty project_id")
        # Optional: Validate comparisons for /api/convert-to-dbt
        if 'comparisons' in data:
            for key, value in data['comparisons'].items():
                required_fields = ["dataset_id", "object_name", "object_type", "original_sql", "dbt_format", "dbt_file_path"]
                for field in required_fields:
                    if not value.get(field):
                        raise ValueError(f"Missing or empty {field} in {key}")
        # Validate levels for /api/submit
        else:
            for key, value in data.items():
                if re.match(r"level\d+", key):
                    required_fields = ["dataset_id", "object_name", "object_type", "query"]
                    for field in required_fields:
                        if not value.get(field):
                            raise ValueError(f"Missing or empty {field} in {key}")

        # Initialize SQL file
        init_sql_file()

        # Prepare submission
        submission = {
            'timestamp': datetime.now().isoformat(),
            'data': json.dumps(data, ensure_ascii=False)
        }

        # Escape single quotes in JSON data for SQL
        escaped_data = submission['data'].replace("'", "''")

        # Append INSERT statement
        insert_stmt = f"INSERT INTO submissions (timestamp, data) VALUES ('{submission['timestamp']}', '{escaped_data}');\n"
        
        with FileLock(SQL_LOCK):
            with open(SQL_FILE, 'a') as f:
                f.write(insert_stmt)
            print(f"Appended submission to {SQL_FILE}")
        
        return True
    except Exception as e:
        print(f"Error saving data: {str(e)}")
        return False

def get_submissions():
    """Retrieve all saved submissions by parsing submissions.sql"""
    try:
        init_sql_file()
        submissions = []
        current_id = 1  # Simulate auto-incrementing ID
        
        with FileLock(SQL_LOCK):
            if not os.path.exists(SQL_FILE):
                return submissions
            
            with open(SQL_FILE, 'r') as f:
                lines = f.readlines()
            
            for line in lines:
                # Match INSERT statements
                if line.strip().startswith("INSERT INTO submissions"):
                    # Extract timestamp and data using regex
                    match = re.match(r"INSERT INTO submissions \(timestamp, data\) VALUES \('([^']+)',\s*'([^']*(?:''[^']*)*)'\);", line.strip())
                    if match:
                        timestamp, raw_data = match.groups()
                        # Replace escaped single quotes
                        data = raw_data.replace("''", "'")
                        submissions.append({
                            "_id": str(current_id),
                            "timestamp": timestamp,
                            "data": json.loads(data)
                        })
                        current_id += 1
        
        return submissions
    except Exception as e:
        print(f"Error retrieving submissions: {str(e)}")
        raise