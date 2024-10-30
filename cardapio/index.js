import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import cryptoRandomString from 'crypto-random-string';
import methodOverride from 'method-override';

const port = process.env.PORT || 3000;

// Supondo que você esteja exportando appRouter corretamente
import appRouter from './routes/routes.js'; // Adicione a extensão .js

const app = express();

// Configurando o Handlebars como template engine
app.engine('handlebars', engine({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.set('views', path.join('./', 'views'));

// Gerar uma chave secreta
const secreta = cryptoRandomString({ length: 32, type: 'base64' });
console.log(secreta);

app.use(session({
    secret: secreta, // Use uma chave secreta forte para produção
    resave: false,
    saveUninitialized: true
}));

// Middleware para tratar dados de formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride('_method'));

// Roteamento
app.use('/', appRouter);

app.listen(port, () => {
    console.log(`Aplicação rodando em http://localhost:${port}`);
});