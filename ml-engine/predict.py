import joblib

model = joblib.load("model.pkl")

score = 40
mastered = 0

result = model.predict([[score, mastered]])

print("Recommended Quiz:", result[0])