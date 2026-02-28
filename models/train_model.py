import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RISK_THRESHOLDS

def generate_sample_data(n_samples=1000):
    """Generate sample data for training"""
    np.random.seed(42)
    
    regions = ['North', 'South', 'East', 'West', 'Central']
    data = []
    
    for _ in range(n_samples):
        region = np.random.choice(regions)
        cases = np.random.randint(0, 1500)
        prev_cases = np.random.randint(0, cases + 100)
        growth_rate = ((cases - prev_cases) / (prev_cases + 1)) * 100
        
        # Create risk label based on cases
        if cases < RISK_THRESHOLDS['LOW']:
            risk = 'Low'
        elif cases < RISK_THRESHOLDS['MODERATE']:
            risk = 'Moderate'
        else:
            risk = 'High'
        
        data.append({
            'region': region,
            'cases': cases,
            'prev_cases': prev_cases,
            'growth_rate': growth_rate,
            'risk': risk
        })
    
    return pd.DataFrame(data)

def train_model():
    """Train the RandomForest model for outbreak prediction"""
    print("Generating training data...")
    df = generate_sample_data()
    
    # Feature engineering
    df['cases_per_growth'] = df['cases'] * (1 + df['growth_rate'] / 100)
    
    # Encode categorical variables
    le_region = LabelEncoder()
    df['region_encoded'] = le_region.fit_transform(df['region'])
    
    # Prepare features and target
    features = ['cases', 'growth_rate', 'cases_per_growth', 'region_encoded']
    X = df[features]
    
    # Encode target
    le_risk = LabelEncoder()
    y = le_risk.fit_transform(df['risk'])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    print("Training RandomForest model...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    accuracy = model.score(X_test, y_test)
    print(f"Model accuracy: {accuracy:.2f}")
    
    # Save model and encoders
    model_dir = os.path.dirname(os.path.abspath(__file__))
    joblib.dump(model, os.path.join(model_dir, 'outbreak_model.pkl'))
    joblib.dump(le_region, os.path.join(model_dir, 'le_region.pkl'))
    joblib.dump(le_risk, os.path.join(model_dir, 'le_risk.pkl'))
    
    print(f"Model saved to {os.path.join(model_dir, 'outbreak_model.pkl')}")
    return model, le_region, le_risk

if __name__ == "__main__":
    train_model()