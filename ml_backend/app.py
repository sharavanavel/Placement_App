import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 1. Expanded Dataset (Added more '0' cases for low CGPA)
# [CGPA, Aptitude, Projects, Internships]
X = np.array([
    [9.0, 85, 3, 2], [8.5, 78, 2, 1], [7.0, 65, 1, 0], 
    [6.5, 60, 0, 0], [8.0, 75, 2, 1], [9.2, 90, 4, 2], 
    [7.5, 70, 1, 1], [6.0, 55, 0, 0], [5.5, 50, 0, 0],
    [6.8, 62, 1, 0], [7.2, 68, 0, 1]
])

# 1 = Placed, 0 = Not Placed
y = np.array([1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0])

# 2. Feature Scaling (The Secret Sauce)
# This keeps CGPA and Aptitude on the same playing field
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 3. Train Model
model = LogisticRegression()
model.fit(X_scaled, y)

print("✅ ML Model trained successfully!")

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Extract features from request
        cgpa = float(data.get('cgpa', 0))
        aptitude = float(data.get('aptitude', 0))
        projects = int(data.get('projects', 0))
        internships = int(data.get('internships', 0))
        
        # Validate input
        if cgpa < 0 or cgpa > 10:
            return jsonify({'error': 'CGPA must be between 0 and 10'}), 400
        if aptitude < 0 or aptitude > 100:
            return jsonify({'error': 'Aptitude must be between 0 and 100'}), 400
        if projects < 0 or projects > 10:
            return jsonify({'error': 'Projects must be between 0 and 10'}), 400
        if internships < 0 or internships > 10:
            return jsonify({'error': 'Internships must be between 0 and 10'}), 400
        
        # Prepare and Scale User Data
        # IMPORTANT: Use the same scaler used for training
        user_data = np.array([[cgpa, aptitude, projects, internships]])
        user_data_scaled = scaler.transform(user_data)
        
        # Prediction
        probability = model.predict_proba(user_data_scaled)[0][1]
        placement_chance = probability * 100
        
        # Output (same logic as user's code)
        if placement_chance > 80:
            category = 'high'
            message = "High chances of placement 🚀"
        elif placement_chance > 50:
            category = 'moderate'
            message = "Moderate chances 👍"
        else:
            category = 'low'
            message = "Low chances ⚠️ Focus on projects and skills"
        
        return jsonify({
            'placement_chance': round(placement_chance, 2),
            'category': category,
            'message': message,
            'input': {
                'cgpa': cgpa,
                'aptitude': aptitude,
                'projects': projects,
                'internships': internships
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'trained'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
