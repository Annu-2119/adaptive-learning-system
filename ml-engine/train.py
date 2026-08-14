import os
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

dataset_path = os.path.join(BASE_DIR, "dataset.csv")
model_path = os.path.join(BASE_DIR, "model.pkl")

df = pd.read_csv(dataset_path)

X = df[["score", "mastered"]]
y = df["recommendation"]

model = DecisionTreeClassifier(random_state=42)

model.fit(X, y)

joblib.dump(model, model_path)

print("Model Trained Successfully")
print(f"Model saved to: {model_path}")