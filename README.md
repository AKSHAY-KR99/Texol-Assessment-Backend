# E commerce Application - Backend - Nodejs

## Features Implemented
- User registration - role based access
- Product catelog, View product
- Add product, edit product, delete product - only for admins
- Add to cart, edit cart items, remove cart items
- Place order, track order(History)
- Real time notification
    For admin - Every new checkout pop notification triggered
    For Customer - New products added by admin, pop notification triggered
- Catergory adding - admin only

## Technology Stack
- Frontend: React.js, React Router, Axios
- Backend: Express.js, Node.js, MySQL, JWT

## Setup Instructions
1. Clone the git repository (https://github.com/AKSHAY-KR99/Texol-Assessment-Backend.git)

2. Enter into project root directory

3. run the command - npm install

4. create a .env file in root directory and paste the following details

    HOST=localhost
    PORT=3306
    USER=root
    PASSWORD=root
    DATABASE=ecom

    SERVER_PORT=3000
    WT_SECRET="Klty789huio9EWReriop457HHHIIwe00bner54321sybblariZXMMLklouara"
  
  replace database configurations as per your local database

5. Then run the command - nodemon index.js
   if server running fine stop and run another commands for table creation

6. create tables
   run the command - node config/buildTables.js
   it will create all required tables in database, along with a admin user

   admin credential
   email - admin@user.com
   password - admin

7. after that close the server and run - nodemon index.js

   now backend setup ready to run on http://localhost:3000 

## API Endpoints
- Create user - http://localhost:3000/api/user/create
- User login - http://localhost:3000/api/user/login
- Get logged in user - http://localhost:3000/api/user/current_user
- Create product - http://localhost:3000/api/product/create
- List product - http://localhost:3000/api/product/list
- get individual product - http://localhost:3000/api/product/get/1
- Update produdct - http://localhost:3000/api/product/update/1
- Delete Product - http://localhost:3000/api/product/delete/7
- Add category - http://localhost:3000/api/product/category/insert
- List category - http://localhost:3000/api/product/category/list
- Add to cart - http://localhost:3000/api/cart/add
- Edit cart - http://localhost:3000/api/cart/update/3
- Remove cart - http://localhost:3000/api/cart/remove/2
- Cart Checkout - http://localhost:3000/api/cart/checkout
- View Orders - http://localhost:3000/api/orders/list

Detailed API details i attached with email as postman API collection. you can import and use it very quicky.

## Test Accounts (if applicable)
- Admin credentials
    email: admin@user.com, 
    password: admin

- Sample user credentials
    You can create a user easily from the UI

## Assumptions Made
- I actually focus core backend modules, so design are not perfect. but i can ensure that backend APIs are perfectly working.