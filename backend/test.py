import requests
import json

# Define the test input JSON
test_input = {
    "timestamp": "2025-05-01T11:10:34.953604",
    "data": {
        "project_id": "kossip-helpers",
        "timestamp": "2025-05-01T05:40:34.386Z",
        "level1": {
            "dataset_id": "bq_views",
            "object_name": "fsdfsdf",
            "object_type": "VIEW",
            "query": "SELECT * FROM public.customers"
        },
        "level2": {
            "dataset_id": "dataset_id",
            "object_name": "gerg",
            "object_type": "TABLE",
            "query": "SELECT * FROM `bq_views.fsdfsdf`"
        },
        "level3": {
            "dataset_id": "dataset_id",
            "object_name": "gr",
            "object_type": "TABLE",
            "query": "SELECT * FROM `dataset_id.gerg` WHERE amount > 100"
        },
        "custom_level": {
            "dataset_id": "dataset_id",
            "object_name": "fe",
            "object_type": "TABLE",
            "query": "SELECT * FROM `dataset_id.gr` JOIN `bq_views.fsdfsdf` ON gr.id = fsdfsdf.id"
        }
    }
}

# URL of the Flask endpoint
url = "http://localhost:5000/api/convert-to-dbt"

# Send POST request
try:
    response = requests.post(url, json=test_input, headers={"Content-Type": "application/json"})
    
    # Check if the request was successful
    if response.status_code == 200:
        print("Success! Response:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: Status Code {response.status_code}")
        print(response.text)

except requests.exceptions.ConnectionError:
    print("Error: Could not connect to the Flask server. Ensure it's running on http://localhost:5000.")
except Exception as e:
    print(f"Unexpected error: {str(e)}")