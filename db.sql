CREATE DATABASE donations_db;

\c donations_db

CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP NOT NULL
);
