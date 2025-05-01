import json
from datetime import datetime
import os

# Configuration
DATA_FILE = 'log/submissions.json'

def ensure_data_file():
    """Create the log directory and data file if they don't exist"""
    os.makedirs('log', exist_ok=True)  # Create log directory if missing
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)

def save_submission(data):
    """Save submission data to JSON file"""
    ensure_data_file()
    
    try:
        with open(DATA_FILE, 'r') as f:
            submissions = json.load(f)
        
        submission = {
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        submissions.append(submission)
        
        with open(DATA_FILE, 'w') as f:
            json.dump(submissions, f, indent=2)
            
        return True
    except Exception as e:
        print(f"Error saving data: {str(e)}")
        return False