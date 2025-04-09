CREATE DATABASE donations_db;

\c donations_db

CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    company_name VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    street_address TEXT NOT NULL,
    apartment TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    pan_number VARCHAR(20),
    has_indian_passport BOOLEAN NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    message TEXT,
    created_at TIMESTAMP NOT NULL
);
