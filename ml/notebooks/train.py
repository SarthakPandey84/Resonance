import os
import librosa
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout, Flatten, BatchNormalization
from keras.utils import to_categorical
import pickle
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# Define emotions based on RAVDESS filename conventions
emotion_map = {
    '01': 'neutral',
    '02': 'calm',
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',
    '07': 'disgust',
    '08': 'surprised'
}

print("Libraries loaded successfully!")
def extract_features(file_path, max_len=130):
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
    
    return mfcc

# Path to your dataset (Assuming RAVDESS Audio_Speech_Actors_01-24 dataset)
data_path = '../dataset/RAVDESS/'
X, y_labels = [], []

if os.path.exists(data_path):
    print(f"Found dataset at {data_path}. Extracting features...")
    for actor_dir in os.listdir(data_path):
        actor_path = os.path.join(data_path, actor_dir)
        if os.path.isdir(actor_path):
            for file in os.listdir(actor_path):
                if file.endswith('.wav'):
                    file_path = os.path.join(actor_path, file)
                    
                    # Extract emotion from RAVDESS filename (e.g., 03-01-01-01-01-01-01.wav)
                    emotion_code = file.split('-')[2]
                    emotion = emotion_map.get(emotion_code, 'unknown')
                    
                    features = extract_features(file_path)
                    X.append(features)
                    y_labels.append(emotion)
    print(f"Successfully extracted {len(X)} samples.")
else:
    print(f"Warning: Dataset path {data_path} not found. Please place RAVDESS dataset there.")

X = np.array(X)
y_labels = np.array(y_labels)
# Encode string labels into integers
le = LabelEncoder()
y_encoded = le.fit_transform(y_labels)
y_categorical = to_categorical(y_encoded)

# X is already in shape (samples, timesteps, features)
X_train, X_test, y_train, y_test = train_test_split(X, y_categorical, test_size=0.2, random_state=42)
print(f"X_train shape: {X_train.shape}")
print(f"X_test shape: {X_test.shape}")
print(f"y_train shape: {y_train.shape}")
model = Sequential()

# CNN Layer 1
model.add(Conv1D(256, kernel_size=5, strides=1, padding='same', activation='relu', input_shape=(X_train.shape[1], X_train.shape[2])))
model.add(BatchNormalization())
model.add(MaxPooling1D(pool_size=2, strides=2, padding='same'))
model.add(Dropout(0.3))

# CNN Layer 2
model.add(Conv1D(128, kernel_size=5, strides=1, padding='same', activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling1D(pool_size=2, strides=2, padding='same'))
model.add(Dropout(0.3))

# LSTM Layer
model.add(LSTM(128, return_sequences=False))
model.add(Dropout(0.3))

# Dense Output Layers
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(len(le.classes_), activation='softmax'))

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()
# Add Callbacks
early_stopping = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True, verbose=1)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001, verbose=1)

# Train Model
history = model.fit(
    X_train, y_train, 
    epochs=100, 
    batch_size=32, 
    validation_data=(X_test, y_test), 
    callbacks=[early_stopping, reduce_lr]
)

# Evaluate Model
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {accuracy*100:.2f}%")
# Ensure the saved_models directory exists
os.makedirs('../saved_models', exist_ok=True)

# Save model architecture and weights
model.save('../saved_models/ser_model.h5')

# Save the Label Encoder for decoding predictions in the backend
with open('../saved_models/label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)

print("Model and Label Encoder successfully saved to '../saved_models/'")