import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os

# Configuration for Google Sheets
SCOPE = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
CREDS_FILE = os.path.abspath("creds/spherical-jetty-419808-8c46b0ed3bd0.json")
SHEET_URL = "https://docs.google.com/spreadsheets/d/1UpEFG4kn-c8s1m3eoTAqEPbWpzg__taIFZQu63f04zs/edit"

def get_gspread_client():
    """Authorize and return a gspread client"""
    if not os.path.exists(CREDS_FILE):
        raise FileNotFoundError(f"Credentials file not found at {CREDS_FILE}")
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
    return gspread.authorize(creds)

def get_datasets_from_sheet(worksheet_name="DATASET_CONFIG"):
    """Fetch dataset IDs from specified worksheet in Google Sheet
    
    Args:
        worksheet_name: Name of the worksheet to fetch data from (default: "DATASET_CONFIG")
    
    Returns:
        List of dataset IDs from the first column of the specified worksheet
    """
    try:
        client = get_gspread_client()
        sheet = client.open_by_url(SHEET_URL)
        
        # Get the specified worksheet by name
        worksheet = sheet.worksheet(worksheet_name)
        
        # Get all values from column 1 (first column)
        dataset_ids = worksheet.col_values(1)
        
        # Remove empty values and strip whitespace
        dataset_ids = [id.strip() for id in dataset_ids if id.strip()]
        
        # Remove header if it exists (assuming first row is header)
        if len(dataset_ids) > 1:
            dataset_ids = dataset_ids[1:]
            
        return dataset_ids
    except Exception as e:
        raise Exception(f"Error fetching datasets from {worksheet_name}: {str(e)}")