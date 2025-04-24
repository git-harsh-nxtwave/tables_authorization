from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for development

# Configuration
DATA_FILE = 'submissions.json'

def ensure_data_file():
    """Create the data file if it doesn't exist"""
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)

def save_submission(data):
    """Save submission data to JSON file"""
    ensure_data_file()
    
    try:
        # Read existing data
        with open(DATA_FILE, 'r') as f:
            submissions = json.load(f)
        
        # Add new submission with timestamp
        submission = {
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        submissions.append(submission)
        
        # Write back to file
        with open(DATA_FILE, 'w') as f:
            json.dump(submissions, f, indent=2)
            
        return True
    except Exception as e:
        print(f"Error saving data: {str(e)}")
        return False

@app.route('/api/submit', methods=['POST'])
def handle_submission():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'project_id' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing project_id in submission'
            }), 400
        
        # Save to JSON file
        if not save_submission(data):
            raise Exception('Failed to save data to file')
        
        return jsonify({
            'status': 'success',
            'message': 'Data saved successfully',
            'saved_levels': len([k for k in data.keys() if k.startswith('level')])
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    try:
        ensure_data_file()
        with open(DATA_FILE, 'r') as f:
            submissions = json.load(f)
        return jsonify({
            'status': 'success',
            'count': len(submissions),
            'submissions': submissions
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)