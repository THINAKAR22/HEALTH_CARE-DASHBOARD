import os
from dotenv import load_dotenv

# Load environment variables (for local development)
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.environ.get('RDS_HOST', 'localhost'),
    'user': os.environ.get('RDS_USER', 'admin'),
    'password': os.environ.get('RDS_PASSWORD', 'password'),
    'database': os.environ.get('RDS_DB', 'healthwatch'),
    'port': 3306
}

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Disease thresholds for risk prediction
RISK_THRESHOLDS = {
    'LOW': 100,
    'MODERATE': 500,
    'HIGH': 1000
}