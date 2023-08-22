#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <DB_NAME> <USERNAME>"
    exit 1
fi

HOST="localhost"
PORT="5432"
DB_NAME="$1"
USERNAME="$2"

# Add the 'uuid-ossp' extension
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Create the 'users' table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS users (
    user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password TEXT,
    name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    role VARCHAR(10) CHECK (role IN ('user', 'admin'))
);"