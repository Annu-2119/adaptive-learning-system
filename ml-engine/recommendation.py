import sys
import json
import joblib
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(
    os.path.join(BASE_DIR, "model.pkl")
)

score = float(sys.argv[1])
mastered = int(sys.argv[2])
weak_topic = sys.argv[3]

features = pd.DataFrame(
    [[score, mastered]],
    columns=["score", "mastered"]
)

level = model.predict(features)[0]

response = {
    "score": score,
    "mastered": mastered,
    "weak_topic": weak_topic,
    "recommended_level": level
}

print(json.dumps(response))