import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import RISK_THRESHOLDS


# =====================================================
# Generate Improved Synthetic Dataset
# =====================================================
def generate_sample_data(n_samples=2000):
    np.random.seed(42)

    regions = ['North', 'South', 'East', 'West', 'Central']
    data = []

    for _ in range(n_samples):
        region = np.random.choice(regions)

        population = np.random.randint(50000, 500000)
        cases = np.random.randint(0, 2000)
        prev_cases = np.random.randint(0, cases + 100)

        growth_rate = ((cases - prev_cases) / (prev_cases + 1)) * 100
        growth_rate = np.clip(growth_rate, -100, 500)

        # Simulate seasonal outbreak boost
        seasonal_factor = np.random.choice([0.8, 1.0, 1.2])
        cases_adjusted = int(cases * seasonal_factor)

        cases_per_100k = (cases_adjusted / population) * 100000

        # Risk labeling logic
        if cases_adjusted < RISK_THRESHOLDS['LOW']:
            risk = 'Low'
        elif cases_adjusted < RISK_THRESHOLDS['MODERATE']:
            risk = 'Moderate'
        else:
            risk = 'High'

        data.append({
            'region': region,
            'population': population,
            'cases': cases_adjusted,
            'prev_cases': prev_cases,
            'growth_rate': growth_rate,
            'cases_per_100k': cases_per_100k,
            'risk': risk
        })

    return pd.DataFrame(data)


# =====================================================
# Train Model
# =====================================================
def train_model():
    print("Generating enhanced training data...")
    df = generate_sample_data()

    # Encode region
    le_region = LabelEncoder()
    df['region_encoded'] = le_region.fit_transform(df['region'])

    # Encode target
    le_risk = LabelEncoder()
    df['risk_encoded'] = le_risk.fit_transform(df['risk'])

    features = [
        'cases',
        'growth_rate',
        'cases_per_100k',
        'population',
        'region_encoded'
    ]

    X = df[features]
    y = df['risk_encoded']

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training RandomForest model...")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        class_weight="balanced",
        random_state=42
    )

    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"\nModel Accuracy: {accuracy:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, model.predict(X_test)))

    # Feature importance (great for hackathon demo)
    print("\nFeature Importance:")
    for feature, importance in zip(features, model.feature_importances_):
        print(f"{feature}: {importance:.4f}")

    # Save everything
    model_dir = os.path.dirname(os.path.abspath(__file__))

    joblib.dump(model, os.path.join(model_dir, 'outbreak_model.pkl'))
    joblib.dump(le_region, os.path.join(model_dir, 'le_region.pkl'))
    joblib.dump(le_risk, os.path.join(model_dir, 'le_risk.pkl'))

    print("\nModel and encoders saved successfully!")

    return model, le_region, le_risk


if __name__ == "__main__":
    train_model()