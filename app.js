import express from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from  'body-parser';
import twilio from 'twilio';
import path from 'path';
import { fileURLToPath } from 'url'; // Asegúrate de importar fileURLToPath

import connectDB from './config/db.js';

import authRoutes from './api/routes/auth.js';
import smsRoutes from './api/routes/smsRoutes.js';

import { errorHandler } from './api/middleware/errorHandler.js';

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use(cors());
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Conectar a MongoDB
connectDB();

app.use(express.json({ limit: '100mb' })); // Ajusta el límite según el tamaño de las solicitudes esperadas
app.use(express.urlencoded({ limit: '100mb', extended: true }));
// Rutas

app.use('/api/auth', authRoutes); // AuthAndSMS ---> LoginSIstema

// Gestion de OTP, sms
app.use('/api/sms', smsRoutes);   // AuthAndSMS ---> SMS

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`http://localhost::${PORT}`));

                  







