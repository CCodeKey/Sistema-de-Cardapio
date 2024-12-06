import { Router } from 'express';
const router = Router();
import * as controller from '../controllers/controller.js';
import multer from 'multer';
import path from 'path' ;
import express from 'express';
const app = express();
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Configuração das imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage:storage }); // Configuração única do multer

// Usuário
router.get('/', controller.home);
router.get('/produto/:id', controller.renderProduto);
router.get('/carrinho', controller.carrinho);
router.post('/carrinho/adicionarNoCarrinho', controller.adicionarNoCarrinho);
router.post('/carrinho/atualizarQuantidade', controller.atualizarQuantidade);

// Compra do produto
router.get('/comprar/:id', controller.comprar);
router.get('/comprar/:id/endereco', controller.endereco);
router.get('/comprar/:id/pagamento', controller.pagamento);
router.get('/comprar/:id/confirmar', controller.confirmarCompra);
router.get('/comprar/:id/fim', controller.fimCompra);


// Status de entrega do produto
router.get('/status/prod', controller.statusProduto);

// Processos de Login / SignIn
router.get('/v/login', controller.renderLogin);
router.post('/v/login', controller.login);
router.get('/n/signup', controller.renderSignup);
router.post('/n/signup', controller.signup);
router.post('/logout', (req, res) => {
    res.clearCookie('Authorization'); // Remove o cookie 'Authorization'
    res.status(200).send('Logout realizado com sucesso.');
});

// Autenticação do ADM 
function verificacaoDeToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.cookies.Authorization; // Verifica cabeçalho ou cookie
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token
    const secretKey = process.env.SECRET_KEY;

    console.log('AuthHeader: ', authHeader);
    console.log('Token recebido: ', token);
    console.log();
    if (!token) {
        console.log("Token ausente !");
        console.log();
        return res.status(401).send('Token ausente.');
        // return router.get('/v/login', controller.renderLogin);
    }

    jwt.verify(token, secretKey, (err, user) => {
        console.log('Entrou no Verify');
        if (err) {
            console.log("Token invalido");
            return res.status(403).send('Token inválido.');
        }
        req.user = user;
        console.log('req-user: ', req.user);
        next();
    });
}

router.get('/administrator/p/home', verificacaoDeToken, controller.homeAdm);
router.get('/administrator/p/produtos',verificacaoDeToken, controller.renderAdicionarProduto);  // Rota GET para exibir o formulário
router.post('/administrator/p/adicionar',verificacaoDeToken, upload.single('imagem'), controller.adicionarItem);
router.post('/administrator/p/adicionar',verificacaoDeToken, controller.adicionarItem);
router.post('/administrator/p/atualizar/:id',verificacaoDeToken, controller.editarItem);
router.get('/administrator/p/remover/:id',verificacaoDeToken, controller.deletarItem);

export default router;