import joblib
import os
import numpy as np
import pandas as pd
from pathlib import Path

# Get the directory of this file
current_dir = Path(__file__).parent
model_dir = current_dir.parent / 'models'

def load_model():
    """Load the trained model and encoders"""
    try:
        model = joblib.load(model_dir / 'outbreak_model.pkl')
        le_region = joblib.load(model_dir / 'le_region.pkl')
        le_risk = joblib.load(model_dir / 'le_risk.pkl')
        return model, le_region, le_risk
    except FileNotFoundError:
        print("Model not found. Please run train_model.py first.")
        return None, None, None

def predict_risk(region, cases, prev_cases=None):
    """
    Predict outbreak risk
    
    Args:
        region: Region name (str)
        cases: Current number of cases (int)
        prev_cases: Previous cases for growth calculation (int, optional)
    
    Returns:
        dict: Risk prediction with probability
    """
    model, le_region, le_risk = load_model()
    
    if model is None:
        # Fallback rule-based prediction if model not available
        return rule_based_prediction(cases)
    
    # Calculate growth rate
    if prev_cases and prev_cases > 0:
        growth_rate = ((cases - prev_cases) / prev_cases) * 100
    else:
        growth_rate = 0
    
    # Feature engineering
    cases_per_growth = cases * (1 + growth_rate / 100)
    
    # Encode region
    try:
        region_encoded = le_region.transform([region])[0]
    except:
        # If region not seen before, use default
        region_encoded = 0
    
    # Prepare features
    features = np.array([[cases, growth_rate, cases_per_growth, region_encoded]])
    
    # Predict
    risk_encoded = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    risk_level = le_risk.inverse_transform([risk_encoded])[0]
    confidence = float(max(probabilities) * 100)
    
    return {
        'risk_level': risk_level,
        'confidence': round(confidence, 2),
        'cases': cases,
        'growth_rate': round(growth_rate, 2)
    }

def rule_based_prediction(cases):
    """Fallback rule-based prediction"""
    from config import RISK_THRESHOLDS
    
    if cases < RISK_THRESHOLDS['LOW']:
        risk_level = 'Low'
        confidence = 85
    elif cases < RISK_THRESHOLDS['MODERATE']:
        risk_level = 'Moderate'
        confidence = 75
    else:
        risk_level = 'High'
        confidence = 90
    
    return {
        'risk_level': risk_level,
        'confidence': confidence,
        'cases': cases,
        'growth_rate': 0
    }