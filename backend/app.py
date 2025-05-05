import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from submission import save_submission, get_submissions
from sheet_data import get_datasets_from_sheet
from sql_to_dbt import replace_table_references
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

@app.route('/api/submit', methods=['POST', 'OPTIONS'])
def handle_submission():
    """Handle submission of level data"""
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        
        if not data or 'project_id' not in data or not data['project_id']:
            return jsonify({
                'status': 'error',
                'message': 'Missing or empty project_id in submission'
            }), 400
        
        if not save_submission(data):
            raise Exception('Failed to save data to SQL file')
        
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

@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    """Fetch dataset IDs from DATASET_CONFIG sheet"""
    try:
        dataset_ids = get_datasets_from_sheet("DATASET_CONFIG")
        return jsonify({
            'datasets': dataset_ids,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/project_ids', methods=['GET'])
def get_project_ids():
    """Fetch project IDs from PROJECT_ID_CONFIG sheet"""
    try:
        project_ids = get_datasets_from_sheet("PROJECT_ID_CONFIG")
        return jsonify({
            'project_ids': project_ids,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/submissions', methods=['GET'])
def get_submissions_endpoint():
    """Retrieve all saved submissions"""
    try:
        submissions = get_submissions()
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

@app.route('/api/convert-to-dbt', methods=['POST', 'OPTIONS'])
def convert_to_dbt_view():
    """Convert SQL queries to DBT format and save to SQL file"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({
                'status': 'error',
                'message': "Invalid input: 'data' field is required"
            }), 400
        
        input_data = data['data']
        comparisons = {}
        
        for key, level_data in input_data.items():
            if isinstance(level_data, dict) and all(field in level_data for field in ['dataset_id', 'object_name', 'object_type', 'query']):
                sql_query = level_data['query']
                dbt_code = replace_table_references(sql_query, level_data['object_type'], level_data['object_name'])
                dataset_id = level_data['dataset_id']
                object_name = level_data['object_name']
                comparisons[key] = {
                    "dataset_id": dataset_id,
                    "object_name": object_name,
                    "object_type": level_data['object_type'],
                    "original_sql": sql_query,
                    "dbt_format": dbt_code,
                    "dbt_file_path": f"models/{dataset_id}/{object_name}/{dataset_id}_{object_name}.sql",
                }
        
        response = {
            "timestamp": data["timestamp"],
            "project_id": input_data["project_id"],
            "comparisons": comparisons,
            "status": "success"
        }
        
        # Save the response to submissions.sql
        if not save_submission(response):
            raise Exception('Failed to save DBT data to SQL file')
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)