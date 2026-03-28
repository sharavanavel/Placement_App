# Placement Prediction ML Backend

This is a Python Flask backend that provides machine learning-based placement predictions for students.

## Features

- Logistic Regression model trained on 200 synthetic student records
- Predicts placement probability based on:
  - CGPA (0-10)
  - Aptitude Score (0-100)
  - Number of Projects (0-10)
  - Number of Internships (0-10)
- RESTful API endpoint for predictions
- CORS enabled for frontend integration

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd ml_backend
pip install -r requirements.txt
```

### 2. Start the ML Backend Server

```bash
python app.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### POST /api/predict

Predict placement chances for a student.

**Request Body:**
```json
{
  "cgpa": 7.5,
  "aptitude": 75,
  "projects": 3,
  "internships": 2
}
```

**Response:**
```json
{
  "placement_chance": 85.32,
  "category": "high",
  "message": "High chances! Keep it up. 🚀",
  "input": {
    "cgpa": 7.5,
    "aptitude": 75,
    "projects": 3,
    "internships": 2
  }
}
```

### GET /api/health

Check if the server is running and the model is trained.

**Response:**
```json
{
  "status": "healthy",
  "model": "trained"
}
```

## Model Details

The model uses Logistic Regression with the following training logic:

- **Hard Filter**: If CGPA < 6.0, placement chance is 0%
- **Weighted Score Calculation**:
  - CGPA: 50% weight
  - Aptitude: 20% weight
  - Projects: 20% weight
  - Internships: 10% weight
- **Threshold**: Score > 65 indicates placement

## Categories

- **High** (>70%): Strong placement chances
- **Moderate** (40-70%): Needs improvement in projects/skills
- **Low** (<40%): Warning - Low CGPA is a major risk factor
