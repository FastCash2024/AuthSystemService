import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import authRoutes from './api/routes/auth.js';
import { errorHandler } from './api/middleware/errorHandler.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

connectDB();

app.use('/api/authSystem', authRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(errorHandler);

io.on('connection', (socket) => {
    console.log(`Nuevo cliente conectado: ${socket.id}`);

    socket.on('registerSession', (userId) => {
        console.log(`Usuario ${userId} registrado en socket ${socket.id}`);
        socket.join(userId); // Agrupa las conexiones por usuario
    });

    socket.on('logout', (userId) => {
        console.log(`⚠ Usuario ${userId} cerró sesión.`);
        io.to(userId).emit('sessionExpired', { message: 'Tu sesión ha sido cerrada en otro dispositivo.' });
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Servidor corriendo en: http://localhost:${PORT}`));
