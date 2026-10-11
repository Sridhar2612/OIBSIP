require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db.js');
const { initInventoryWatchdog } = require('./jobs/inventoryWatchdog');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

connectDB().then(() => { initInventoryWatchdog(); });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO Client Connected]: ${socket.id}`);

  socket.on('join_order_room', (orderId) => {
    socket.join('order_' + orderId);
    console.log(`[Socket.IO] ${socket.id} joined order_${orderId}`);
  });

  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`[Socket.IO] ${socket.id} joined admin_room`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO Client Disconnected]: ${socket.id}`);
  });
});

app.set('io', io);

server.listen(PORT, () => {
  console.log('=============================================');
  console.log(`🍕 SliceCraft Server running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('=============================================');
});
