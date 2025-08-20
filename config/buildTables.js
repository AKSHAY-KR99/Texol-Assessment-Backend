const pool = require("./db");
const bcrypt = require("bcrypt");

const createUserTable = () => {
    const query = `CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create user table', err.message);
            return;
        }
        console.log('user table is created');
    });
};

const createCategories = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
    );`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create category table', err.message);
            return;
        }
        console.log('category table is created');
    });
};


const createProducts = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  image_url VARCHAR(255),
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create product table', err.message);
            return;
        }
        console.log('product table is created');
    });
};

const createCart = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create carts table', err.message);
            return;
        }
        console.log('carts table is created');
    });
};

const createCartItems = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES cart(cart_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
    );`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create cart_items table', err.message);
            return;
        }
        console.log('cart_items table is created');
    });
};

const createOrders = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending','shipped','delivered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create orders table', err.message);
            return;
        }
        console.log('orders table is created');
    });
};

const createOrderItems = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL, -- snapshot price at the time of order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    );`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log('failed to create order_items table', err.message);
            return;
        }
        console.log('order_items table is created');
    });
};

const createAdminUser = async () => {
    try {
        const name = "Admin";
        const email = "admin@user.com";
        const plainPassword = "admin";
        const role = "admin";

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const query = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        pool.query(query, [name, email, hashedPassword, role], (err, result) => {
            if (err) {
                console.log("Failed to create admin:", err.message);
                return;
            }
            console.log("Admin user created successfully!");
        });
    } catch (error) {
        console.error("Error creating admin:", error.message);
    }
};

createCategories();
createUserTable();
createProducts();
createCart();
createCartItems();
createOrders();
createOrderItems();
createAdminUser();