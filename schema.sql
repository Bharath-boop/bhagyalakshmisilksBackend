-- =============================================
-- Silk Saga Sarees - MySQL Database Schema
-- Run this file once in MySQL to create all tables
-- Command: mysql -u root -p saree_ecommerce < schema.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS saree_ecommerce;
USE saree_ecommerce;

-- 1. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  category_id INT,
  price       DECIMAL(10, 2) NOT NULL,
  description TEXT,
  material    VARCHAR(255),
  color       VARCHAR(255),
  stock       INT DEFAULT 0,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 3. Users table
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  phone      VARCHAR(20),
  address    TEXT,
  city       VARCHAR(100),
  state      VARCHAR(100),
  pincode    VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  product_id  INT,
  quantity    INT DEFAULT 1,
  total_price DECIMAL(10, 2),
  status      ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 5. Product Images table (multiple images per saree)
CREATE TABLE IF NOT EXISTS product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. OTP Verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  otp        VARCHAR(6)   NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  is_used    TINYINT(1)   DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
