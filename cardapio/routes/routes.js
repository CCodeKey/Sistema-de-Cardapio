import { Router } from 'express';
const router = Router();
import * as controller from '../controllers/controller.js';

// Usuário
router.get('/', controller.home);
router.get('/produto/:id', controller.renderProduto);
router.get('/carrinho', controller.carrinho);
router.post('/carrinho/adicionarNoCarrinho', controller.adicionarNoCarrinho);

// Compra do produto
router.get('/comprar/:id', controller.comprar);
router.get('/comprar/:id/endereco', controller.endereco);
router.get('/comprar/:id/pagamento', controller.pagamento);
router.get('/comprar/:id/confirmar', controller.confirmarCompra);
router.get('/comprar/:id/fim', controller.fimCompra);

// Status de entrega do produto
router.get('/status/prod', controller.statusProduto);

// Administrador
router.get('/administrator/p/home', controller.homeAdm);
router.get('/administrator/p/produtos', controller.renderAdicionarProduto);  // Rota GET para exibir o formulário
router.post('/administrator/p/adicionar', controller.adicionarItem);
router.post('/administrator/p/atualizar/:id', controller.editarItem);
router.get('/administrator/p/remover/:id', controller.deletarItem);
router.post('/carrinho/atualizarQuantidade', controller.atualizarQuantidade);

export default router;