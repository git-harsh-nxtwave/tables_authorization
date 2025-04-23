from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend')
CORS(app)

config = {
    "level1": {},
    "additional_levels": []
}

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/config', methods=['POST'])
def save_config():
    global config
    data = request.json
    level = data['level']
    form_data = data['data']
    is_additional = data['isAdditional']
    if not is_additional:
        config['level1'] = form_data
    else:
        config['additional_levels'].append({ f"level{level}": form_data })
    return jsonify(config)

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify(config)

if __name__ == '__main__':
    app.run(debug=True)