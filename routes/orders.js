const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const { verifyAuthToken, authorizeRoles } = require('../middlewares/authMiddleware');

// ✅ Get all orders of the logged-in customer
router.get('/list', verifyAuthToken, authorizeRoles('customer'), (req, res) => {
    const userId = req.user.id; // Assuming verifyAuthToken sets req.user

    const ordersSql = `
        SELECT 
            o.order_id,
            o.total_price,
            o.status,
            o.created_at,
            oi.order_item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.name AS product_name,
            p.image_url
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, o.order_id DESC;
    `;

    pool.query(ordersSql, [userId], (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Database error", error: err });
        }

        if (results.length === 0) {
            return res.json({ success: true, orders: [] });
        }

        // ✅ Group results by order
        const orders = {};
        results.forEach(row => {
            if (!orders[row.order_id]) {
                orders[row.order_id] = {
                    order_id: row.order_id,
                    total_price: row.total_price,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                };
            }

            orders[row.order_id].items.push({
                order_item_id: row.order_item_id,
                product_id: row.product_id,
                product_name: row.product_name,
                image_url: row.image_url,
                quantity: row.quantity,
                price: row.price
            });
        });

        res.json({
            success: true,
            orders: Object.values(orders)
        });
    });
});

module.exports = router;
