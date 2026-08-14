import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

df = pd.read_csv("dataset.csv")

X = df[["score", "mastered"]]
y = df["recommendation"]

model = DecisionTreeClassifier(random_state=42)

model.fit(X, y)

joblib.dump(model, "model.pkl")

print("Model Trained Successfully")