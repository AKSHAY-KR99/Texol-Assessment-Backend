
require('dotenv').config();
const pool = require('./config/db');
const express = require('express');
const http = require("http"); 
const port = process.env.SERVER_PORT || 3000;
const app = express();
const ip = require('ip');
const path = require('path');
const cors = require("cors");

const server = http.createServer(app);

// tracking the API calls
let ipAddress = ip.address();
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] [${ipAddress}] ${req.method} ${req.url}`);
    next();
});


const corsOptions = {
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type,Authorization"
  };



app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/media/image_url', express.static(path.join(__dirname, 'media/image_url')));


// Import Routes
const userRouter = require('./routes/userRouter');
const productRouter = require('./routes/product');
const cartRouter = require('./routes/cart')




app.use('/api/user', userRouter);
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)



server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});