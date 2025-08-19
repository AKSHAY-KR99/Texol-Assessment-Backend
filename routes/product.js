const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { verifyAuthToken, authorizeRoles } = require('../middlewares/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = '';

        if (file.fieldname === 'image_url') {
            uploadPath = 'media/image_url/';
        } else {
            return cb(new Error('Invalid fieldname'), null);
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        let { name } = req.body;

        if (!name) {
            return cb(new Error("name is required"));
        }

        name = name.replace(/\s+/g, '_');
        const now = new Date();
        const dateCreated = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
        const fileExtension = path.extname(file.originalname);
        const customFileName = `${name}_${file.fieldname}_${dateCreated}${fileExtension}`;
        cb(null, customFileName);
    }
});

const upload = multer({ storage: storage });

router.post('/category/insert', verifyAuthToken, authorizeRoles('admin'),(req, res) => {
    const { name } = req.body
    const query = `INSERT INTO categories (name) VALUES (?);`;
    pool.query(query, [name], (err, results) => {
        if (err) return res.status(500).send({ error: err.message });
        return res.status(201).send({ success: true, message: 'Categoery added successfully.' });
    });
});

router.get('/category/list', (req, res) => {
    const query = `select * from categories;`;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).send({ error: err.message });
        if (results.length === 0) return res.status(400).send({ sucess: false, message: "No catgories found" });
        return res.status(201).send({ results });
    });
});

router.post('/create', verifyAuthToken, authorizeRoles('admin'), upload.fields([{ name: 'image_url', maxCount: 1 }]), (req, res) => {
    const { name, description, price, stock, category_id } = req.body;
    const imageFile = req.files?.image_url?.[0];

    if (!name || !description || !price || !stock || !category_id || !imageFile) {
        fs.unlinkSync(imageFile)
        return res.status(400).json({
            success: false,
            message: 'All fields are required (including image upload).',
        });
    }

    if (isNaN(price) || isNaN(stock) || isNaN(category_id)) {
        fs.unlinkSync(imageFile)
        return res.status(400).json({
            success: false,
            message: 'Price, stock, and category_id must be valid numbers.',
        });
    }

    const imageUrl = imageFile.filename;

    const insertQuery = `
        INSERT INTO products (name, description, price, stock, image_url, category_id)
        VALUES (?, ?, ?, ?, ?, ?)`;

    pool.query(
        insertQuery,
        [name, description, price, stock, imageUrl, category_id],
        (err, result) => {
            if (err) {
                if (imageFile?.path && fs.existsSync(imageFile.path)) {
                    fs.unlinkSync(imageFile.path); // ✅ delete file by path
                }
                console.error('DB Error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to store product in the database.',
                    error: err,
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Product created successfully.',
                product_id: result.insertId,
            });
        }
    );
}
);

router.delete('/delete/:id', verifyAuthToken, authorizeRoles('admin'), (req, res) => {
    const productId = req.params.id;

    // 1. Get product to find image file
    pool.query("SELECT image_url FROM products WHERE product_id = ?", [productId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "DB error", error: err });
        if (results.length === 0) return res.status(404).json({ success: false, message: "Product not found" });

        const imagePath = path.join('media/image_url', results[0].image_url);

        // 2. Delete product
        pool.query("DELETE FROM products WHERE product_id = ?", [productId], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to delete product", error: err });

            // 3. Delete image file if exists
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            return res.json({ success: true, message: "Product deleted successfully" });
        });
    });
});

router.put(
    '/update/:id',
    verifyAuthToken,
    authorizeRoles('admin'),
    upload.fields([{ name: 'image_url', maxCount: 1 }]),
    (req, res) => {
        const productId = req.params.id;
        const { name, description, price, stock, category_id } = req.body;
        const imageFile = req.files?.image_url?.[0];

        // validate fields (at least one field must be provided)
        if (!name && !description && !price && !stock && !category_id && !imageFile) {
            return res.status(400).json({ success: false, message: "No fields provided to update" });
        }

        // validate numbers if provided
        if ((price && isNaN(price)) || (stock && isNaN(stock)) || (category_id && isNaN(category_id))) {
            if (imageFile?.path && fs.existsSync(imageFile.path)) {
                fs.unlinkSync(imageFile.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Price, stock, and category_id must be valid numbers.'
            });
        }

        // get existing product (to delete old image if new uploaded)
        pool.query("SELECT image_url FROM products WHERE product_id = ?", [productId], (err, results) => {
            if (err) {
                if (imageFile?.path && fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);
                return res.status(500).json({ success: false, message: "DB error", error: err });
            }
            if (results.length === 0) {
                if (imageFile?.path && fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);
                return res.status(404).json({ success: false, message: "Product not found" });
            }

            const oldImage = results[0].image_url;
            let newImage = oldImage;

            if (imageFile) {
                newImage = imageFile.filename;
            }

            // build dynamic update query
            let updateFields = [];
            let values = [];

            if (name) { updateFields.push("name = ?"); values.push(name); }
            if (description) { updateFields.push("description = ?"); values.push(description); }
            if (price) { updateFields.push("price = ?"); values.push(price); }
            if (stock) { updateFields.push("stock = ?"); values.push(stock); }
            if (category_id) { updateFields.push("category_id = ?"); values.push(category_id); }
            if (imageFile) { updateFields.push("image_url = ?"); values.push(newImage); }

            values.push(productId);

            const updateQuery = `UPDATE products SET ${updateFields.join(", ")} WHERE product_id = ?`;

            pool.query(updateQuery, values, (err, result) => {
                if (err) {
                    if (imageFile?.path && fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);
                    return res.status(500).json({ success: false, message: "Failed to update product", error: err });
                }

                // delete old image only after DB update success
                if (imageFile && oldImage && fs.existsSync(path.join("media/image_url", oldImage))) {
                    fs.unlinkSync(path.join("media/image_url", oldImage));
                }

                return res.json({ success: true, message: "Product updated successfully" });
            });
        });
    }
);

router.get('/list', (req, res) => {
    const query = `select * from products;`;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).send({ error: err.message });
        if (results.length === 0) return res.status(400).send({ sucess: false, message: "No products found" });
        return res.status(201).send({ results });
    });
});

module.exports = router;




