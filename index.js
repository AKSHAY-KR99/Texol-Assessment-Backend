
require('dotenv').config();
const pool = require('./config/db');
const express = require('express');
const http = require("http");
const port = process.env.SERVER_PORT || 3000;
const app = express();
const ip = require('ip');
const path = require('path');
const cors = require("cors");
const socketIo = require('socket.io');

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*", // or your frontend URL
        methods: ["GET", "POST"]
    }
});

const connectedUsers = {
    admins: [],
    customers: []
};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // client should send role after connection
    socket.on('registerRole', (role) => {
        if (role === 'admin') {
            connectedUsers.admins.push(socket.id);
        } else if (role === 'customer') {
            connectedUsers.customers.push(socket.id);
        }
        console.log('Registered:', role, socket.id);
    });

    socket.on('disconnect', () => {
        connectedUsers.admins = connectedUsers.admins.filter(id => id !== socket.id);
        connectedUsers.customers = connectedUsers.customers.filter(id => id !== socket.id);
        console.log('Client disconnected:', socket.id);
    });
});

app.set('io', io);

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
const orderRouter = require('./routes/orders')




app.use('/api/user', userRouter);
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', orderRouter)



server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});