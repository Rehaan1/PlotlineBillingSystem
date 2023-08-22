#!/bin/bash

# Build Docker image for auth service
docker build -t plotlinebilling/auth-service ../auth

# Build Docker image for commerce service
docker build -t plotlinebilling/commerce-service ../commerce
