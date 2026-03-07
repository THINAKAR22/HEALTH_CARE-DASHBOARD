import os
import pymysql
import pymysql.cursors
from datetime import datetime, timedelta
import random

from config import DB_CONFIG

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

def seed_data():
    conn = get_db_connection()
    if not conn:
        print("Could not connect to database")
        return
        
    try:
        with conn.cursor() as cursor:
            # Clear old data if needed or just add new
            # cursor.execute("TRUNCATE TABLE disease_cases")
            
            regions = ['Chennai North', 'Chennai South', 'Coimbatore', 'Madurai']
            today = datetime.now()
            
            inserted = 0
            for i in range(30, -1, -1):
                date = (today - timedelta(days=i)).strftime('%Y-%m-%d')
                for region in regions:
                    cases = random.randint(50, 300)
                    recoveries = int(cases * random.uniform(0.7, 0.9))
                    deaths = int(cases * random.uniform(0.01, 0.05))
                    
                    cursor.execute("""
                        INSERT IGNORE INTO disease_cases (region, date, cases, recoveries, deaths, population)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (region, date, cases, recoveries, deaths, 5000000))
                    inserted += 1
            
            conn.commit()
            print(f"Successfully inserted {inserted} recent records.")
            
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    seed_data()
