-- Sober Hub MySQL schema for MySQL Workbench or a MySQL deployment.
CREATE DATABASE IF NOT EXISTS sober_hub;
USE sober_hub;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(50), password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member', membership_status VARCHAR(20) NOT NULL DEFAULT 'inactive',
  membership_plan VARCHAR(20), membership_expires_at DATETIME, email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token_hash VARCHAR(255), verification_expires_at DATETIME, reset_token_hash VARCHAR(255),
  reset_expires_at DATETIME, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS checkins (
  id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, mood VARCHAR(100) NOT NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS community_posts (
  id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS mentor_requests (
  id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS emergency_requests (
  id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Open', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, amount_cents INT NOT NULL,
  plan VARCHAR(20) NOT NULL, provider VARCHAR(50) NOT NULL DEFAULT 'demo',
  provider_reference VARCHAR(255), status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key VARCHAR(255) PRIMARY KEY, window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_checkins_user ON checkins(user_id, created_at);
CREATE INDEX idx_posts_created ON community_posts(created_at);
CREATE INDEX idx_payments_user ON payments(user_id, created_at);
CREATE INDEX idx_users_verification ON users(verification_token_hash);
CREATE INDEX idx_users_reset ON users(reset_token_hash);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
