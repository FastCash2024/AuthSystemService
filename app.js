import express from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from  'body-parser';
import path from 'path';
import { fileURLToPath } from 'url'; // Asegúrate de importar fileURLToPath

import connectDB from './config/db.js';

import authRoutes from './api/routes/auth.js';

import { errorHandler } from './api/middleware/errorHandler.js';

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use(cors());
// Conectar a MongoDB
connectDB();

app.use(express.json({ limit: '100mb' })); // Ajusta el límite según el tamaño de las solicitudes esperadas
app.use(express.urlencoded({ limit: '100mb', extended: true }));
// Rutas

app.use('/api/authSystem', authRoutes); // AuthAndSMS ---> LoginSIstema

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`http://localhost::${PORT}`));

                  







