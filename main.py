from flask import Flask, request, jsonify, send_from_directory
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import numpy as np
from werkzeug.utils import secure_filename
import cv2
import os
import threading
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load trained model
model = load_model('C:/Users/HP/Desktop/fyp/prototype1/models/saved_model/my_resnetkeras_model.keras')

# Configuration
HLS_SEGMENTS_DIR = 'C:/Users/HP/Desktop/fyp/realtime/server/videos/ipcam'
FRAME_PROCESS_INTERVAL = 2  # Process every 2 seconds

# Global variables for live classification
latest_classification = {
    'result': 'NormalVideos',
    'confidence': 0.0,
    'timestamp': time.time()
}

class_titles = ['Abuse', 'Arrest', 'Arson', 'Assault', 'Burglary',
                'Explosion', 'Fighting', 'NormalVideos', 'RoadAccident',
                'Robbery', 'Shooting', 'Shoplifting', 'Stealing', 'Vandalism']

def preprocess_frame(frame):
    frame = cv2.resize(frame, (64, 64))  # Resize to the model's expected input size
    img_array = img_to_array(frame)
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = preprocess_input(img_array)  # Preprocess the image
    return img_array

def process_latest_frame():
    try:
        # Get the latest .ts segment file
        ts_files = [f for f in os.listdir(HLS_SEGMENTS_DIR) if f.endswith('.ts')]
        if not ts_files:
            return None

        latest_ts = max(ts_files, key=lambda x: os.path.getctime(os.path.join(HLS_SEGMENTS_DIR, x)))
        ts_path = os.path.join(HLS_SEGMENTS_DIR, latest_ts)

        # Open the video segment
        cap = cv2.VideoCapture(ts_path)
        
        # Read the last frame from the segment
        last_frame = None
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            last_frame = frame

        cap.release()

        if last_frame is not None:
            # Process the frame
            processed_frame = preprocess_frame(last_frame)
            prediction = model.predict(processed_frame)
            predicted_class_idx = np.argmax(prediction, axis=1)[0]
            confidence = float(prediction[0][predicted_class_idx])
            
            return {
                'result': class_titles[predicted_class_idx],
                'confidence': confidence,
                'timestamp': time.time()
            }

    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        return None

def background_processor():
    while True:
        try:
            result = process_latest_frame()
            if result:
                global latest_classification
                latest_classification = result
                print(f"New classification: {result['result']} (confidence: {result['confidence']:.2f})")
        except Exception as e:
            print(f"Error in background processor: {str(e)}")
        time.sleep(FRAME_PROCESS_INTERVAL)

# Start background processing thread
processing_thread = threading.Thread(target=background_processor, daemon=True)
processing_thread.start()

@app.route('/health')
def health_check():
    return jsonify({'status': 'OK'})

@app.route('/live-classification')
def get_live_classification():
    return jsonify(latest_classification)

@app.route('/classify', methods=['POST'])
def classify():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Initialize frame predictions list
    frame_predictions = []

    # Check if the uploaded file is a video or an image
    if filename.lower().endswith(('mp4', 'avi', 'mov', 'mkv')):
        # Process video frame by frame
        cap = cv2.VideoCapture(file_path)
        frame_count = 0

        # Process the video frame by frame
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            # Analyze every 10th frame for efficiency
            if frame_count % 10 == 0:
                processed_frame = preprocess_frame(frame)
                prediction = model.predict(processed_frame)
                predicted_class = np.argmax(prediction, axis=1)[0]
                frame_predictions.append(predicted_class)

        cap.release()
    else:
        # Process the image as a single frame
        image = cv2.imread(file_path)
        processed_frame = preprocess_frame(image)
        prediction = model.predict(processed_frame)
        predicted_class = np.argmax(prediction, axis=1)[0]
        frame_predictions.append(predicted_class)

    os.remove(file_path)  # Delete the uploaded file after processing

    # Determine the class for the video
    if frame_predictions:
        # Check if all frames are classified as "NormalVideos"
        if all(predicted_class == class_titles.index("NormalVideos") for predicted_class in frame_predictions):
            result = "NormalVideos"
        else:
            # Take the most common non-"NormalVideos" class
            non_normal_classes = [pred for pred in frame_predictions if pred != class_titles.index("NormalVideos")]
            most_common_class = max(set(non_normal_classes), key=non_normal_classes.count)
            result = class_titles[most_common_class]
    else:
        result = 'Unable to classify the content.'

    return jsonify({'result': result}), 200

# Serve React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists("frontend/build/" + path):
        return send_from_directory('frontend/build', path)
    else:
        return send_from_directory('frontend/build', 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)