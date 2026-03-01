from flask import Flask, render_template, jsonify, request, session, redirect, url_for
from flask_cors import CORS
import pymysql
from config import DB_CONFIG
import pymysql.cursors
import pandas as pd
import numpy as np
import os
import hashlib
import hmac
from datetime import datetime, timedelta
import sys

# Add project to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DB_CONFIG, SECRET_KEY, DEBUG
from utils.prediction import predict_risk

app = Flask(__name__)
app.secret_key = SECRET_KEY
CORS(app)

# Database connection function
def get_db_connection():
    try:
        connection = pymysql.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database'],
            port=DB_CONFIG['port'],
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as e:
        print("Database connection error:", e)
        return None

# Routes
@app.route('/')
def index():
    """Landing page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Main dashboard"""
    return render_template('dashboard.html')

@app.route('/admin')
def admin():
    """Admin panel - simple auth for hackathon"""
    # Simple check - in production use proper auth
    return render_template('admin.html')

@app.route('/get-data')
def get_data():
    """API endpoint to get disease data"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        with connection.cursor() as cursor:
            # Get summary data
            cursor.execute("""
                SELECT 
                    SUM(cases) as total_cases,
                    SUM(deaths) as total_deaths,
                    SUM(recoveries) as total_recoveries,
                    SUM(cases) - SUM(recoveries) as active_cases
                FROM disease_cases
                WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            """)
            summary = cursor.fetchone()
            
            # Get time series data
            cursor.execute("""
                SELECT date, SUM(cases) as cases
                FROM disease_cases
                WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY date
                ORDER BY date
            """)
            time_series = cursor.fetchall()
            
            # Get region-wise data
            cursor.execute("""
                SELECT region, 
                       SUM(cases) as total_cases,
                       AVG(cases) as avg_cases,
                       MAX(cases) as peak_cases,
                       SUM(deaths) as total_deaths
                FROM disease_cases
                WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY region
                ORDER BY total_cases DESC
            """)
            region_data = cursor.fetchall()
            
            # Get recent cases for prediction
            cursor.execute("""
                SELECT region, SUM(cases) as cases
                FROM disease_cases
                WHERE date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY region
            """)
            recent_cases = cursor.fetchall()
            
        return jsonify({
            'success': True,
            'summary': summary,
            'time_series': time_series,
            'region_data': region_data,
            'recent_cases': recent_cases
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/predict-risk', methods=['POST'])
def predict_risk_endpoint():
    """API endpoint for risk prediction"""
    data = request.json
    region = data.get('region', 'Unknown')
    cases = int(data.get('cases', 0))
    prev_cases = data.get('prev_cases')
    
    prediction = predict_risk(region, cases, prev_cases)
    return jsonify(prediction)

@app.route('/upload', methods=['POST'])
def upload_csv():
    """Handle CSV upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Please upload a CSV file'}), 400
    
    try:
        # Read CSV
        df = pd.read_csv(file)
        
        # Expected columns
        expected_cols = ['region', 'date', 'cases', 'recoveries', 'deaths']
        
        # Check if all expected columns exist
        missing_cols = [col for col in expected_cols if col not in df.columns]
        if missing_cols:
            return jsonify({'error': f'Missing columns: {missing_cols}'}), 400
        
        # Connect to database
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        with connection.cursor() as cursor:
            # Insert each row
            inserted = 0
            for _, row in df.iterrows():
                sql = """
                    INSERT INTO disease_cases (region, date, cases, recoveries, deaths)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(sql, (
                    row['region'],
                    row['date'],
                    int(row['cases']),
                    int(row['recoveries']),
                    int(row['deaths'])
                ))
                inserted += 1
            
            connection.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully inserted {inserted} records'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Create tables if they don't exist
    connection = get_db_connection()
    if connection:
        try:
            with connection.cursor() as cursor:
                # Read and execute schema
                with open('database/schema.sql', 'r') as f:
                    sql = f.read()
                    # Split by semicolon and execute each statement
                    for statement in sql.split(';'):
                        if statement.strip():
                            cursor.execute(statement)
                connection.commit()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Database initialization error: {e}")
        finally:
            connection.close()
    
    # Train model if not exists
    if not os.path.exists('models/outbreak_model.pkl'):
        print("Training ML model...")
        from models.train_model import train_model
        train_model()
    
    app.run(host='0.0.0.0', port=5000, debug=DEBUG)