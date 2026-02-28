-- Create database
CREATE DATABASE IF NOT EXISTS healthwatch;
USE healthwatch;

-- Main disease cases table
CREATE TABLE IF NOT EXISTS disease_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    date DATE NOT NULL,
    cases INT DEFAULT 0,
    recoveries INT DEFAULT 0,
    deaths INT DEFAULT 0,
    population INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_date (date)
);

-- Sample data for testing
INSERT INTO disease_cases (region, district, date, cases, recoveries, deaths, population) VALUES
('North', 'Delhi', '2024-01-01', 150, 120, 5, 20000000),
('North', 'Delhi', '2024-01-02', 165, 130, 6, 20000000),
('North', 'Delhi', '2024-01-03', 180, 140, 7, 20000000),
('North', 'Delhi', '2024-01-04', 200, 155, 8, 20000000),
('North', 'Delhi', '2024-01-05', 190, 160, 7, 20000000),
('South', 'Bangalore', '2024-01-01', 80, 70, 2, 12000000),
('South', 'Bangalore', '2024-01-02', 85, 72, 2, 12000000),
('South', 'Bangalore', '2024-01-03', 95, 80, 3, 12000000),
('South', 'Bangalore', '2024-01-04', 110, 90, 4, 12000000),
('South', 'Bangalore', '2024-01-05', 105, 95, 3, 12000000),
('East', 'Kolkata', '2024-01-01', 200, 150, 12, 15000000),
('East', 'Kolkata', '2024-01-02', 220, 160, 14, 15000000),
('East', 'Kolkata', '2024-01-03', 240, 170, 15, 15000000),
('East', 'Kolkata', '2024-01-04', 260, 180, 16, 15000000),
('East', 'Kolkata', '2024-01-05', 250, 190, 15, 15000000),
('West', 'Mumbai', '2024-01-01', 300, 250, 20, 18000000),
('West', 'Mumbai', '2024-01-02', 320, 260, 22, 18000000),
('West', 'Mumbai', '2024-01-03', 350, 280, 24, 18000000),
('West', 'Mumbai', '2024-01-04', 380, 300, 26, 18000000),
('West', 'Mumbai', '2024-01-05', 360, 310, 25, 18000000);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin (password: admin123 - change in production)
INSERT INTO admin_users (username, password_hash, email) VALUES
('admin', 'scrypt:32768:8:1$J9Y0q7Xm2LpR4tVw$5a3e1c8b9d2f4a6c7e8b9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d', 'admin@healthwatch.com');