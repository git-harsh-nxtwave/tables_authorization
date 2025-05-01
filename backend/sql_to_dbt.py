import json
import re
import pandas as pd

# Load the manifest file
with open('target/manifest.json', 'r') as f:
    manifest = json.load(f)

# Extract all models
models = {
    details['name']: {
        'database': details.get('database'),
        'schema': details['schema'],
        'ref': f"{{{{ ref('{details['name']}') }}}}"
    }
    for key, details in manifest['nodes'].items()
    if key.startswith('model.')
}

# Extract all sources
sources = {
    f"{details['source_name']}.{details['name']}": {
        'database': details.get('database'),
        'schema': details['schema'],
        'source': f"{{{{ source('{details['source_name']}', '{details['name']}') }}}}"
    }
    for key, details in manifest['sources'].items()
    if key.startswith('source.')
}

# Prepare data for DataFrame
model_data = [
    {'table_key': model_name, 'dbt_ref': info['ref'], 'type': 'model'}
    for model_name, info in models.items()
]
source_data = [
    {'table_key': source_key, 'dbt_ref': info['source'], 'type': 'source'}
    for source_key, info in sources.items()
]

# Combine into a single DataFrame (global variable)
table_to_dbt_ref = pd.DataFrame(model_data + source_data)

# Combined function to replace table references and add DBT config
def replace_table_references(sql_query, object_type="TABLE", object_name=""):
    """
    Replace table references in SQL with DBT refs/sources and add config block.
    
    Args:
        sql_query (str): The SQL query to convert.
        object_type (str): 'TABLE' or 'VIEW' to determine materialization.
        object_name (str): Name to use as the alias in DBT config.
    
    Returns:
        str: Fully formatted DBT SQL with config block.
    """
    table_pattern = r'(FROM|JOIN)\s+([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\s*'
    
    def replace_match(match):
        clause, table = match.groups()
        table_name = table.split('.')[-1] if '.' in table else table
        
        # Step 1: Check for ref (model) with naming convention
        if '.' in table:
            schema, base_table = table.split('.', 1)
            model_name = f"{schema}_{base_table}"
            model_match = table_to_dbt_ref[
                (table_to_dbt_ref['table_key'] == model_name) & (table_to_dbt_ref['type'] == 'model')
            ]
            if not model_match.empty:
                return f"{clause} {model_match['dbt_ref'].iloc[0]} "
        
        # Step 2: Check table name alone as a model
        model_match = table_to_dbt_ref[
            (table_to_dbt_ref['table_key'] == table_name) & (table_to_dbt_ref['type'] == 'model')
        ]
        if not model_match.empty:
            return f"{clause} {model_match['dbt_ref'].iloc[0]} "
        
        # Step 3: Fallback to full name as a source
        source_match = table_to_dbt_ref[
            (table_to_dbt_ref['table_key'] == table) & (table_to_dbt_ref['type'] == 'source')
        ]
        if not source_match.empty:
            return f"{clause} {source_match['dbt_ref'].iloc[0]} "
        
        # If no match, leave unchanged
        return match.group(0)
    
    # Replace table references in the SQL query
    rewritten_sql = re.sub(table_pattern, replace_match, sql_query, flags=re.IGNORECASE)
    
    # Add DBT config with materialized and alias
    return f"{{{{ config(alias='{object_name}') }}}}\n\n{rewritten_sql}"