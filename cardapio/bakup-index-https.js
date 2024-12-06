import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import cryptoRandomString from 'crypto-random-string';
import methodOverride from 'method-override';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';

const port = process.env.PORT || 3000;
import appRouter from './routes/routes.js';

const app = express();

app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        isPix: (pagamento) => pagamento === 'pix' ? 'Pix' : 'Outro'
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join('./', 'views'));

app.use('/uploads', express.static(path.join('./','uploads')));

const secreta = cryptoRandomString({ length: 32, type: 'base64' });
console.log(secreta);

app.use(session({
    secret: secreta,
    resave: false,
    saveUninitialized: true
}));

app.use(cors({
    origin: 'http://localhost:3000', //
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
  };

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Configurando cookie-parser
app.use(cookieParser());

// Roteamento   
app.use('/', appRouter);

https.createServer(options, app).listen(3000, () => {
    console.log('Servidor rodando em https://localhost:3000');
  });