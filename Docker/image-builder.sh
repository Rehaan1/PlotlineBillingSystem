#!/bin/bash

# Build Docker image for auth service
docker build -t plotlinebilling/auth-service ../auth

# Build Docker image for commerce service
docker build -t plotlinebilling/commerce-service ../commerce

# Build Docker image for orders and billings service
docker build -t plotlinebilling/orders-billings ../orders-billings

# Build Docker image for Nginx
docker build -t plotlinebilling/nginx ../nginx