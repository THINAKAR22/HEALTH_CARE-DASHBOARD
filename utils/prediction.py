from flask import request, jsonify
import pandas as pd
import joblib
import os

# Load model + encoders (do this once at top of app.py)
model = joblib.load("models/outbreak_model.pkl")
le_region = joblib.load("models/le_region.pkl")
le_risk = joblib.load("models/le_risk.pkl")


def predict_risk():
    try:
        data = request.json

        cases = int(data["cases"])
        prev_cases = int(data["prev_cases"])
        population = int(data["population"])
        region = data["region"]

        # Calculate growth rate
        growth_rate = ((cases - prev_cases) / (prev_cases + 1)) * 100

        # Cases per 100k
        cases_per_100k = (cases / population) * 100000

        # Encode region
        region_encoded = le_region.transform([region])[0]

        # Prepare DataFrame (IMPORTANT to avoid sklearn warning)
        input_data = pd.DataFrame([{
            "cases": cases,
            "growth_rate": growth_rate,
            "cases_per_100k": cases_per_100k,
            "population": population,
            "region_encoded": region_encoded
        }])

        # Predict
        prediction = model.predict(input_data)[0]
        probability = max(model.predict_proba(input_data)[0])

        risk_label = le_risk.inverse_transform([prediction])[0]

        # Add UI color coding
        if risk_label == "Low":
            color = "green"
        elif risk_label == "Moderate":
            color = "orange"
        else:
            color = "red"

        return jsonify({
            "risk_level": risk_label,
            "confidence": round(float(probability) * 100, 2),
            "color": color
        })

    except Exception as e:
        return jsonify({"error": str(e)})