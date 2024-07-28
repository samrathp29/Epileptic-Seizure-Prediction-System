from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from scipy.signal import butter, lfilter
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load the pre-trained model
model = tf.keras.models.load_model('seizure_prediction_model.h5')

def preprocess_eeg(eeg_data, fs=256):
    # Apply bandpass filter (1-50 Hz)
    nyq = 0.5 * fs
    low = 1 / nyq
    high = 50 / nyq
    b, a = butter(3, [low, high], btype='band')
    filtered_eeg = lfilter(b, a, eeg_data)
    
    # Normalize the data
    normalized_eeg = (filtered_eeg - np.mean(filtered_eeg)) / np.std(filtered_eeg)
    
    return normalized_eeg

def predict_seizure(eeg_data):
    preprocessed_eeg = preprocess_eeg(eeg_data)
    
    # Reshape the data to match the input shape of the model
    input_data = preprocessed_eeg.reshape(1, -1, 1)
    
    # Make prediction
    prediction = model.predict(input_data)
    
    return prediction[0][0]

@app.route('/upload', methods=['POST'])
def upload_eeg():
    data = request.json['eegData']
    eeg_array = np.array(data)
    
    seizure_probability = predict_seizure(eeg_array)
    
    # Determine if it's a seizure based on a threshold
    is_seizure = seizure_probability > 0.5
    
    if is_seizure:
        log_seizure()
    
    return jsonify({
        'seizureProbability': float(seizure_probability),
        'isSeizure': bool(is_seizure)
    })

def log_seizure():
    with open('seizure_log.json', 'r+') as f:
        try:
            log = json.load(f)
        except json.JSONDecodeError:
            log = []
        
        log.append({
            'timestamp': datetime.now().isoformat(),
            'details': 'Seizure detected'
        })
        
        f.seek(0)
        json.dump(log, f, indent=4)
        f.truncate()

@app.route('/seizure_log', methods=['GET'])
def get_seizure_log():
    with open('seizure_log.json', 'r') as f:
        log = json.load(f)
    return jsonify(log)

if __name__ == '__main__':
    app.run(debug=True)
