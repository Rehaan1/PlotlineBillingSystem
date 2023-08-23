# Plotline Online Billing Service

### Microservice Architecture

1. Authentication Microservice
2. Commerce Microservice
3. Orders and Billings Microservice

## Backend Documentation For the Amigos :cowboy_hat_face:: https://documenter.getpostman.com/view/14038453/2s9Y5TzQF4

## Deployed Link : 

## Steps to Start System in Local Machine
1. Go to Docker Folder

2. Create an Environment File .env 

3. In the file add the following variables and assign values to it (You can use the .env.example file)
- POSTGRES_ADMIN_USER
- POSTGRES_ADMIN_PASSWORD
- POSTGRES_DB
- POSTGRES_PORT (Keep it 5432)
- POSTGRES_HOST
- JWT_SECRET
- JWT_EXPIRY

4. Run 

``` ./image-builder.sh ```

If unable to execute, give necessary executable permission. eg. ``` chmod +x image-builder.sh ```

5. On Another Terminal run the following to setup database

```./database-setup.sh <DATABASE NAME> <DB USER> ```

If unable to execute, give necessary executable permission. eg. ``` chmod +x database-setup.sh ```

6. Now you can do ```docker-compose down``` and then use ```docker-compose up``` to stop and start

7. Voila! Alls Setup

## Architecture Diagram


## Possible Improvements


## Tasks
#### Pre Requirements
- [X] Start a Postgress Container using Docker Compose

- [X] Design Database Table for Authentication

- [X] Create Authentication Functionality Endpoint (Register, Login, Update, Get, Delete User)

- [X] Design Database Table for Products & Services

- [X] Create Commerce Endpoints (Add Product/Service, Get All Product, Get All Service, Get, Update, Delete Product/Service)

- [X] Design Database Table for Cart

- [X] Design Database Table for Orders

- [X] Design Database Table for Billings

- [ ] Create Orders & Billings Cart Endpoint (Add, Remove, Clear Cart)

- [ ] Create Orders & Billings Orders Endpoint (Get All, Get One, Confirm Order)

- [ ] Create Orders & Billings Billing Endpoint (Get Bill)

- [ ] Admin View



#### Authentication Endpoints

- [X] Register User

- [X] Login User

- [X] Update User

- [X] Get User Data

- [X] Delete User

- [ ] Allow setting user role to Admin (Admin Only)


#### Commerce Endpoints

##### Items

- [X] Add new Product/Service (Admin Only)

- [X] Show all Products

- [X] Show all Services

- [X] Get Product/Service

- [X] Update Product/Service (Admin Only)

- [X] Delete Product/Service (Admin Only)



#### Orders & Billing Endpoints

- [ ] Add Product/Service to Cart

- [ ] Remove Product/Service from Cart

- [ ] Clear Cart

- [ ] Calculate Total Bill of Cart

- [ ] Get Orders of User

- [ ] Create Orders

- [ ] Show all Orders (Admin Only)