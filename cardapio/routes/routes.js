import { Router } from 'express';
const router = Router();
import * as controller from '../controllers/controller.js';

router.get('/', controller.home);
router.get('/carrinho', controller.carrinho);
router.post('/carrinho/adicionarNoCarrinho', controller.adicionarNoCarrinho);
router.get('/administrator/adicionar', controller.renderAdicionarProduto);  // Rota GET para exibir o formulário
router.post('/administrator/adicionar', controller.adicionarItem);
router.get('/administrator/atualizar/:id', controller.renderEditarProduto);  // Rota POST para adicionar o produto
router.post('/administrator/atualizar/:id', controller.editarItem);
router.get('/administrator/remover/:id', controller.deletarItem);

export default router;