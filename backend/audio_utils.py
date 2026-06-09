import librosa
import numpy as np

def extract_features(file_path):
    """
    Extracts MFCCs and Mel-Spectrogram features from an audio file.
    This perfectly matches the preprocessing logic used in Phase 1 training.
    """
    # Load audio file (3s duration, offset by 0.5s to skip silence)
    y, sr = librosa.load(file_path, duration=3.0, offset=0.5, sr=22050)
    
    # 1. MFCC
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc_mean = np.mean(mfcc.T, axis=0)
    
    # 2. Mel-Spectrogram
    mel = librosa.feature.melspectrogram(y=y, sr=sr)
    mel_mean = np.mean(mel.T, axis=0)
    
    # Concatenate features
    features = np.hstack((mfcc_mean, mel_mean))
    
    # Reshape for the CNN+LSTM model (samples, timesteps, features)
    # The model expects a sequence, here we have 1 sequence of concatenated features
    features = np.expand_dims(features, axis=0)  # Add batch dimension
    features = np.expand_dims(features, axis=2)  # Add feature/channel dimension
    
    return features
