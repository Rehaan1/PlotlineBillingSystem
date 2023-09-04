# Plotline Online Billing Service

### Microservice Architecture

1. Authentication Microservice
2. Commerce Microservice
3. Orders and Billings Microservice

## Backend Documentation For the Amigos :cowboy_hat_face:: https://documenter.getpostman.com/view/14038453/2s9Y5TzQF4

## Deployed Link (Deployed on GCP :cloud: Compute Instance) : Deployment Server Now Closed

## Steps to Start System in Local Machine :computer:
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
- PROJECT_ID (GCP Project ID for storing invoice)
- BUCKET_NAME (GCP Bucket Name for storing invoice)

4. Run 

``` ./setup.sh ```

If unable to execute, give necessary executable permission. eg. ``` chmod +x image-builder.sh ``` and eg. ``` chmod +x setup.sh ```

5. On Another Terminal run the following to setup database

```./database-setup.sh <DATABASE NAME> <DB USER> ```

If unable to execute, give necessary executable permission. eg. ``` chmod +x database-setup.sh ```

6. Now you can do ```docker-compose down``` and then use ```docker-compose up``` to stop and start

7. Voila! :fireworks: All's Setup

8. *Note*: To run unit tests, go to the folder of the microservice (eg. auth folder) and type ``` npm run test ```

## Invoice SneekPeek :eyes:
![invoice](https://github.com/Rehaan1/PlotlineBillingSystem/assets/38107493/26f91c62-914b-44ac-9cb0-1f6bc19a036e)


## Architecture Diagram

##### System Architecture Diagram:

![Plotline Images](https://github.com/Rehaan1/PlotlineBillingSystem/assets/38107493/c824a46f-77a4-4807-bc65-9bbd3ecb9e55)

##### Database Design
- **Note**: Items table was *Horizontal Partitioned* for faster indexed search in case of millions of rows by list on item_type to two new tables items_product and items_service

![Plotline](https://github.com/Rehaan1/PlotlineBillingSystem/assets/38107493/47681b5c-ee79-4691-a5c1-ee8ea9c8ed62)


##### Database Choice Reasons
- Database chosen was Postgres due to its strong ACID Compliance and ability to run complex queries
- Strong MVCC Support over MySQL
- Items table was horizontal partitioned for faster index search when millions of rows are there
- Pagination using timestamp instead of offset was used in get all products and services to reduce time overhead of removing unwanted pages fetched from databases
- Proper indexing was done on most queried coloumns

## Possible Improvements
1. Moving to Docker Swarm for ease of scaling and slowly migrate to Kubernetes as required

2. Adding Logging through providers like LogTail for capturing detailed Logs for Error Detection and Debugging

3. Using different Database users for read, create, update to ensure further security

4. Using Nignx further as a Load Balancer for the microservices

## Tasks :white_check_mark:
#### Pre Requirements
- [X] Start a Postgress Container using Docker Compose

- [X] Design Database Table for Authentication

- [X] Create Authentication Functionality Endpoint (Register, Login, Update, Get, Delete User)

- [X] Design Database Table for Products & Services

- [X] Create Commerce Endpoints (Add Product/Service, Get All Product, Get All Service, Get, Update, Delete Product/Service)

- [X] Design Database Table for Cart

- [X] Design Database Table for Orders

- [X] Design Database Table for Billings

- [X] Create Orders & Billings Cart Endpoint (Add, Remove, Clear Cart)

- [X] Create Orders & Billings Orders Endpoint (Get All, Get One, Confirm Order)

- [X] Create Orders & Billings Billing Endpoint (Get Bill)

- [X] Admin View



#### Authentication Endpoints :lock:

- [X] Register User

- [X] Login User

- [X] Update User

- [X] Get User Data

- [X] Delete User

- [X] Allow setting user role to Admin (Admin Only)

- [X] Unit Tests


#### Commerce Endpoints :handbag:

##### Items

- [X] Add new Product/Service (Admin Only)

- [X] Show all Products

- [X] Show all Services

- [X] Get Product/Service

- [X] Update Product/Service (Admin Only)

- [X] Delete Product/Service (Admin Only)

- [X] Unit Tests


#### Orders & Billing Endpoints :credit_card:

- [X] Add Product/Service to Cart

- [X] Remove Product/Service from Cart

- [X] Clear Cart

- [X] Calculate Total Bill of Cart

- [X] Create Orders

- [X] Get Orders of User

- [X] Get Order Detail

- [X] Get Bill for Order

- [X] Show all Orders (Admin Only)

- [X] Unit Tests

- [X] Bill Invoice
