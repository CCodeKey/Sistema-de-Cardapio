import pool from '../database/db.js';

export async function home(req, res) {
    try {
        const result = await pool.query('SELECT * FROM produtos');
        const cardapio = result.rows;  // Armazena os produtos na variável cardapio
        res.render('index', { cardapio });  // Passa os produtos para o template
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
};

export async function homeAdm(req, res) {
    res.render('homeAdministrator', { hideBody: true });
};

export async function renderProduto(req, res) {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        const produto = result.rows[0];
        if (!produto) {
            return res.status(404).send('Produto não encontrado');
        }
        res.render('telaProduto', { produto });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto');
    }
};

export function adicionarNoCarrinho(req, res) {
    const { id, nome, preco, descricao, quantidade } = req.body;

    // Verifica se a sessão do carrinho já foi criada; se não, cria uma nova
    if (!req.session.carrinho) {
        req.session.carrinho = [];
    }

    // Adiciona o produto ao carrinho na sessão
    // Verifica se o item já está no carrinho
    const produtoExistente = req.session.carrinho.find(item => item.id === id);
    if (produtoExistente) {
        // Se já existe, atualiza a quantidade
        produtoExistente.quantidade = parseInt(produtoExistente.quantidade) + parseInt(quantidade);
    } else {
        // Se não existe, adiciona o novo produto
        req.session.carrinho.push({ id, nome, preco, descricao, quantidade });
    }

    console.log('Carrinho:', req.session.carrinho);// Redireciona para a página inicial ou exibe uma mensagem de sucesso
    res.redirect('/');
};

export function carrinho(req, res) {
    // Obtém o carrinho da sessão ou cria um carrinho vazio se não houver nenhum
    const carrinho = req.session.carrinho || [];
    res.render('carrinho', { carrinho });
};

export async function renderAdicionarProduto(req, res) {
    try {
        const result = await pool.query('SELECT * FROM produtos');
        const produtos = result.rows;  // Armazena os produtos na variável cardapio
        res.render('adicionarProduto', { produtos });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
};

export async function adicionarItem(req, res) {
    const { nome, preco, descricao } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO produtos (nome, preco, descricao) VALUES ($1, $2, $3) RETURNING *',
            [nome, preco, descricao]
        );
        console.log('Item adicionado:', result.rows[0]);
        // res.status(201).send('Produto adicionado com sucesso!');
        res.redirect('/administrator/p/produtos')
    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        res.status(500).send('Erro ao adicionar item');
    }
}

export async function renderEditarProduto(req, res) {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        const produto = result.rows[0];
        if (!produto) {
            return res.status(404).send('Produto não encontrado');
        }
        res.render('editarProduto', { produto });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto');
    }
};

export async function editarItem(req, res) {
    const { id } = req.params;
    const { nome, preco, descricao } = req.body;

    console.log('ID do produto:', id);
    console.log('NOME do produto:', nome);
    console.log('PRECO do produto:', preco);
    console.log('DESCRICAO do produto:', descricao);

    try {
        await pool.query('UPDATE produtos SET nome = $1, preco = $2, descricao = $3 WHERE id = $4', [nome, preco, descricao, id]);
        res.redirect('/administrator/p/produtos'); // Redireciona após a edição
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).send('Erro no servidor');
    }
};

export async function deletarItem(req, res) {
    const { id } = req.params;

    // Validação do ID
    if (!id || isNaN(id)) {
        return res.status(400).send('ID inválido');
    }

    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);

        // Verifica se algum produto foi excluído
        if (result.rowCount === 0) {
            return res.status(404).send('Produto não encontrado');
        }

        // Redireciona após a exclusão
        res.redirect('/administrator/p/produtos'); // Você pode adicionar uma mensagem de sucesso se desejar
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        res.status(500).send('Erro no servidor');
    }
};

export async function comprar(req, res) {
    const produtoId = req.params.id;

    try {
        // Verifica se o carrinho está na sessão
        if (!req.session.carrinho) {
            return res.status(400).send('Carrinho não encontrado.');
        }

        // Encontra o produto no carrinho
        const produtoCarrinho = req.session.carrinho.find(item => item.id === produtoId);
        if (!produtoCarrinho) {
            return res.status(404).send('Produto não encontrado no carrinho.');
        }

        // Busca os detalhes completos do produto da base de dados
        const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [produtoId]);
        const produto = result.rows[0];

        if (!produto) {
            return res.status(404).send('Produto não encontrado na base de dados.');
        }

        // Usa a quantidade do carrinho para calcular o preço total
        const quantidade = produtoCarrinho.quantidade; // Quantidade correta do carrinho
        const precoTotal = produto.preco * quantidade;

        // Passa o preço total e a quantidade para o template
        res.render('comprar', { produto, precoTotal, quantidade });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto');
    }
}

export function comprarEndereco(req, res) {
    res.render('endereco', { produto: { id: req.params.id } });
}

export function comprarPagamento(req, res) {
    res.render('pagamento', { produto: { id: req.params.id } });
}

export function comprarConfirmar(req, res) {
    res.render('confirmarCompra', { produto: { id: req.params.id } });
}

export function fimCompra(req, res) {
    res.render('fimCompra');
}

export function atualizarQuantidade(req, res) {
    const { id, action } = req.body;

    if (!req.session.carrinho) {
        return res.status(400).send('Carrinho não encontrado.');
    }

    const produtoCarrinho = req.session.carrinho.find(item => item.id === id);
    if (!produtoCarrinho) {
        return res.status(404).send('Produto não encontrado no carrinho.');
    }

    if (action === 'increase') {
        produtoCarrinho.quantidade = parseInt(produtoCarrinho.quantidade) + 1; // Aumenta a quantidade corretamente
    } else if (action === 'decrease' && produtoCarrinho.quantidade > 1) {
        produtoCarrinho.quantidade = parseInt(produtoCarrinho.quantidade) - 1; // Diminui a quantidade, mas não abaixo de 1
    }

    console.log('Carrinho atualizado:', req.session.carrinho);
    res.redirect('/carrinho');
}