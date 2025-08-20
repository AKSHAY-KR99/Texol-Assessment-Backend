const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const { verifyAuthToken, authorizeRoles } = require('../middlewares/authMiddleware');


router.get('/list', verifyAuthToken, authorizeRoles('customer'), (req, res) => {
    const userId = req.user.id; // assume JWT middleware sets this

    const sql = `
    SELECT 
  ci.cart_item_id,
  ci.quantity,
  p.product_id,
  p.name,
  p.price,
  p.image_url
FROM cart c
JOIN cart_items ci ON c.cart_id = ci.cart_id
JOIN products p ON ci.product_id = p.product_id
WHERE c.user_id = ?;
  `;
    pool.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).send({ error: err.message });
        let total = 0;
        results.forEach(item => {
            total += item.quantity * item.price;
        });
        res.status(200).send({ items: results, total });
    });
});

router.post('/add', verifyAuthToken, authorizeRoles('customer'), (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // ensure cart exists
    const findCart = "SELECT cart_id FROM cart WHERE user_id = ?";
    pool.query(findCart, [userId], (err, cartResult) => {
        if (err) return res.status(500).json({ error: err.message });

        let cartId;
        if (cartResult.length === 0) {
            // create new cart
            pool.query("INSERT INTO cart (user_id) VALUES (?)", [userId], (err, insertResult) => {
                if (err) return res.status(500).json({ error: err.message });
                cartId = insertResult.insertId;
                insertOrUpdate(cartId);
            });
        } else {
            cartId = cartResult[0].cart_id;
            insertOrUpdate(cartId);
        }

        function insertOrUpdate(cartId) {
            const checkItem = "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?";
            pool.query(checkItem, [cartId, productId], (err, itemResult) => {
                if (err) return res.status(500).json({ error: err.message });

                if (itemResult.length > 0) {
                    const updateSql = "UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?";
                    pool.query(updateSql, [quantity, itemResult[0].cart_item_id], (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ message: "Item quantity updated" });
                    });
                } else {
                    const insertSql = "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)";
                    pool.query(insertSql, [cartId, productId, quantity], (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ message: "Item added to cart" });
                    });
                }
            });
        }
    });
});

router.put('/update/:id', verifyAuthToken, authorizeRoles('customer'), (req, res) => {
    const { quantity } = req.body;
    const cartItemId = req.params.id;

    const sql = "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?";
    pool.query(sql, [quantity, cartItemId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Cart item not found" });
        }
        res.status(200).send({ message: "Cart item updated" });
    });
});

router.delete('/remove/:id', verifyAuthToken, authorizeRoles('customer'), (req, res) => {
    const cartItemId = req.params.id;
    const sql = "DELETE FROM cart_items WHERE cart_item_id = ?";
    pool.query(sql, [cartItemId], (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Cart item not found" });
        }
        res.send({ message: "Item removed from cart" });
    });
});

router.post('/checkout', verifyAuthToken, authorizeRoles('customer'), (req, res) => {
    const userId = 1;

    const getCartSql = `
    SELECT 
      ci.cart_item_id,
      ci.quantity,
      p.product_id,
      p.name,
      p.price,
      p.stock,
      p.image_url
    FROM cart c
    JOIN cart_items ci ON c.cart_id = ci.cart_id
    JOIN products p ON ci.product_id = p.product_id
    WHERE c.user_id = ?;
  `;

    pool.query(getCartSql, [userId], (err, cartItems) => {
        if (err) return res.status(500).json({ error: err.message });
        if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

        let total = 0;
        for (let item of cartItems) {
            if (item.quantity > item.stock) {
                return res.status(400).json({ message: `${item.name} is out of stock` });
            }
            total += item.quantity * item.price;
        }

        // 1. Create order
        pool.query("INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'pending')",
            [userId, total],
            (err, orderResult) => {
                if (err) return res.status(500).json({ error: err.message });
                const orderId = orderResult.insertId;

                // 2. Insert order_items and update stock
                let completed = 0;
                cartItems.forEach(item => {
                    pool.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                        [orderId, item.product_id, item.quantity, item.price],
                        (err) => {
                            if (err) console.error("order_items insert failed:", err.message);
                        }
                    );

                    pool.query("UPDATE products SET stock = stock - ? WHERE product_id = ?",
                        [item.quantity, item.product_id],
                        (err) => {
                            if (err) console.error("stock update failed:", err.message);
                        }
                    );

                    completed++;
                    
                    if (completed === cartItems.length) {
                        // 3. Clear the cart ONLY after all inserts/updates are done
                        pool.query("DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id = c.cart_id WHERE c.user_id = ?",
                            [userId],
                            (err) => {
                                if (err) return res.status(500).json({ error: err.message });
                                const io = req.app.get('io');
                                io.emit("newOrder", {
                                    orderId: 10,
                                    userId: req.user.email,
                                    total: 1000,
                                });
                                return res.json({ message: "Order placed successfully", orderId });
                            }
                        );
                    }
                });
            }
        );
    });
});

module.exports = router;




