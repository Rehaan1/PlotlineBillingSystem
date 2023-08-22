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


# Create the 'items' table and partition horizontally as per item_type
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS items 
    ( item_id UUID DEFAULT uuid_generate_v4(), 
    name VARCHAR (100), 
    image TEXT, 
    detail TEXT, 
    price NUMERIC(10,2), 
    quantity INTEGER, 
    item_type VARCHAR(20) CHECK (item_type IN ('product', 'service')),
    PRIMARY KEY (item_id, item_type), 
    CONSTRAINT unique_item_id_type UNIQUE (item_id, item_type) 
)  PARTITION BY LIST (item_type);"


# Create the 'items_product' partitioned table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE TABLE items_product PARTITION OF 
    items FOR VALUES IN ('product');"

# Create the 'items_service' partitioned table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE TABLE items_service PARTITION OF 
    items FOR VALUES IN ('service');"


# Create the 'product_tax' table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE TABLE product_tax (
    product_tax_id UUID DEFAULT uuid_generate_v4(),
    item_id UUID,
    item_type VARCHAR(20) CHECK (item_type IN ('product', 'service')),
    PA NUMERIC(10, 2),
    PB NUMERIC(10, 2),
    PC NUMERIC(10, 2) DEFAULT 200,
    FOREIGN KEY (item_id, item_type) REFERENCES items(item_id, item_type) ON DELETE CASCADE,
    PRIMARY KEY (product_tax_id)
);"

# Create the 'item_id index on product_tax' table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE INDEX idx_item_id_product_tax ON product_tax(item_id);"

# Create the 'product_tax' table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE TABLE service_tax (
    service_tax_id UUID DEFAULT uuid_generate_v4(),
    item_id UUID,
    item_type VARCHAR(20) CHECK (item_type IN ('service')),
    SA NUMERIC(10, 2),
    SB NUMERIC(10, 2),
    SC NUMERIC(10, 2) DEFAULT 100,
    FOREIGN KEY (item_id, item_type) REFERENCES items(item_id, item_type) ON DELETE CASCADE,
    PRIMARY KEY (service_tax_id)
);"

# Create the 'item_id index on product_tax' table
psql -h $HOST -p $PORT -U $USERNAME -d $DB_NAME -c "CREATE INDEX idx_item_id_service_tax ON service_tax(item_id);"
