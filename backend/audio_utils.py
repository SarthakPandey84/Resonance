import librosa
import numpy as np

def extract_features(file_path, max_len=130):
    """
    Extracts MFCCs features from an audio file.
    This perfectly matches the preprocessing logic used in Phase 1 training.
    """
    # Load audio file (3s duration, offset by 0.5s to skip silence)
    y, sr = librosa.load(file_path, duration=3.0, offset=0.5, sr=22050)
    
    # 1. MFCC
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc = mfcc.T # Shape becomes (timesteps, n_mfcc)
    
    # Pad or truncate to max_len
    if mfcc.shape[0] < max_len:
        pad_width = max_len - mfcc.shape[0]
        mfcc = np.pad(mfcc, pad_width=((0, pad_width), (0, 0)), mode='constant')
    else:
        mfcc = mfcc[:max_len, :]
    
    # Reshape for the CNN+LSTM model (samples, timesteps, features)
    features = np.expand_dims(mfcc, axis=0)  # Add batch dimension
    
    return features
