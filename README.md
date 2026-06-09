# Speech Emotion Recognition (SER) System 🎙️

An end-to-end Machine Learning web application that analyzes human speech audio signals and classifies the underlying emotion (e.g., happy, sad, angry, neutral, fearful).

## 🚀 Features

- **Deep Learning Model**: A robust Convolutional Neural Network (CNN) combined with an LSTM layer, trained on the RAVDESS dataset to capture spatial acoustic features and temporal sequences.
- **FastAPI Backend**: A highly performant python API that bridges the frontend to the ML model, processing audio in real-time.
- **React Frontend**: A modern, responsive user interface built with Vite, React, and TailwindCSS.
- **In-Browser Recording**: Users can upload `.wav`/`.mp3` files or record their voice directly from the browser using the MediaRecorder API.
- **Data Visualization**: Beautiful, interactive bar charts powered by Recharts to display emotion confidence scores.
- **Supabase Integration**: Secure user authentication and a historical dashboard of past predictions, with audio files stored in Supabase Storage.

## 📁 Project Structure

- `/ml` - Jupyter notebooks and dataset folder for training the CNN+LSTM model.
- `/backend` - FastAPI server handling audio preprocessing (librosa) and model inference.
- `/database` - Supabase SQL schema for user history and Row Level Security.
- `/frontend` - React application (Vite + Tailwind).

## 🛠️ Tech Stack

- **Machine Learning**: Python, TensorFlow/Keras, Librosa, Scikit-learn
- **Backend**: FastAPI, Uvicorn
- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)

## ⚙️ Getting Started

### 1. Model Training (Phase 1)
1. Download the RAVDESS dataset.
2. Place the dataset in `ml/dataset/RAVDESS/`.
3. Run the `ml/notebooks/01_ser_model_training.ipynb` notebook to train the model.
4. The trained `.h5` model and `.pkl` label encoder will be saved to `ml/saved_models/`.

### 2. Backend Setup (Phase 2)
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Start the FastAPI server: `uvicorn main:app --reload`
4. The API will be available at `http://localhost:8000`

### 3. Database Setup (Phase 3)
1. Create a Supabase project.
2. Run the `database/schema.sql` script in the Supabase SQL Editor.
3. Ensure the `audio-uploads` bucket is public and Email auth is enabled.

### 4. Frontend Setup (Phase 4)
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env.local` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Start the development server: `npm run dev`
