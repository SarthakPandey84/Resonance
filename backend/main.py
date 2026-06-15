import os
import pickle
import tempfile
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from audio_utils import extract_features

# We will load these globally during startup
model = None
label_encoder = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, label_encoder
    
    # Absolute path to where models should be saved by Phase 1
    model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "saved_models", "ser_model.h5")
    encoder_path = os.path.join(os.path.dirname(__file__), "..", "ml", "saved_models", "label_encoder.pkl")
    
    try:
        if os.path.exists(model_path) and os.path.exists(encoder_path):
            import tensorflow as tf
            # Load the model and label encoder
            model = tf.keras.models.load_model(model_path)
            with open(encoder_path, 'rb') as f:
                label_encoder = pickle.load(f)
            print("Successfully loaded SER model and label encoder.")
        else:
            print("WARNING: Model files not found! Phase 1 training must be completed first.")
    except Exception as e:
        print(f"Error loading model: {e}")
        
    yield
    # Cleanup resources (if any)
    model = None
    label_encoder = None

app = FastAPI(title="Speech Emotion Recognition API", lifespan=lifespan)

# Configure CORS to allow the React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace "*" with your frontend's actual URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionResponse(BaseModel):
    predicted_emotion: str
    confidence_score: float
    all_scores: dict

@app.post("/predict", response_model=PredictionResponse)
async def predict_emotion(file: UploadFile = File(...)):
    if model is None or label_encoder is None:
        raise HTTPException(
            status_code=503, 
            detail="Model is not loaded. Please ensure Phase 1 training is complete and generated the .h5 file."
        )
        
    if not file.filename.lower().endswith(('.wav', '.mp3')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Only .wav and .mp3 files are supported."
        )
    
    # Save uploaded file to a temporary location
    try:
        # Create a temp file with the same extension
        ext = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
        
        # Extract features using our audio_utils module
        features = extract_features(tmp_path)
        
        # Run inference
        predictions = model(features, training=False)[0].numpy()  # We sent a batch of 1, so take the first result
        
        # Determine the highest confidence class
        predicted_class_index = np.argmax(predictions)
        predicted_emotion = label_encoder.inverse_transform([predicted_class_index])[0]
        confidence_score = float(predictions[predicted_class_index])
        
        # Map all probabilities to their respective emotion names
        all_scores = {
            label_encoder.inverse_transform([i])[0]: float(score)
            for i, score in enumerate(predictions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")
    finally:
        # Always clean up the temporary file
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)
            
    return PredictionResponse(
        predicted_emotion=predicted_emotion,
        confidence_score=confidence_score,
        all_scores=all_scores
    )

@app.get("/health")
async def health_check():
    """Simple endpoint to verify the backend is running."""
    return {"status": "ok", "model_loaded": model is not None}
