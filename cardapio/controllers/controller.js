import pool from '../database/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export async function renderLogin(req, res) {
    res.render('login', {showNavbar: false});
};

export async function login(req, res) {
    const { email, password } = req.body;

    try {
        // Verifica o usuário no banco de dados
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0]; // Acessa o primeiro usuário retornado

        if (!user) {
            return res.status(401).send('Credenciais inválidas.');
        }

        // Compara a senha informada com a senha armazenada no banco de dados
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.redirect('/v/login');
        }
        
        const secretKey = process.env.SECRET_KEY;
        // Gera o token JWT com o papel do usuário
        const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '2h' });
        
        res.cookie('Authorization', token, {
            httpOnly: true,        // Garante que o cookie só seja acessado pelo servidor
            secure: process.env.NODE_ENV === 'production',  // Só usa em produção com HTTPS
            sameSite: 'None',      // Permite o envio do cookie em diferentes domínios
            maxAge: 3600000        // Expiração do cookie (1 hora)
        });

        // res.redirect('/administrator/p/home');
        res.send({ token });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).send('Erro no servidor.');
    }
}

export async function renderSignup(req, res) {
    res.render('signUp', {showNavbar: false} );
};

export async function signup(req, res) {
    const { username, email, password, role } = req.body;

    try {
        // Verifica se o usuário ou e-mail já está em uso
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).send('Esse e-mail já está em uso.');
        }

        // Faz o hash da senha
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insere o novo usuário no banco de dados
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, hashedPassword, role || 'admin']
        );

        res.redirect('/v/login');
    } catch (error) {
        console.error('Erro no signup:', error);
        res.status(500).send('Erro no servidor.', error);
    }
}

export async function home(req, res) {
    try {
        const result = await pool.query('SELECT * FROM produtos');
        const cardapio = result.rows;  // Armazena os produtos na variável cardapio
        res.render('index', { cardapio, showNavbar: true });  // Passa os produtos para o template
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
};

export async function homeAdm(req, res) {
    // try {
    //     const num = await pool.query('SELECT COUNT(*) AS quantidade_produtos FROM produtos;');
    //     const produto = num.rows[0];
    //     if (!produto) {
    //         return res.status(404).send('Produto não encontrado');
    //     }
    // } catch (error) {
    //     console.error('Erro ao buscar o numero dos produtos:', error);
    //     res.status(500).send('Erro ao buscar o numero dos produtos');
    // }


    // VER ISSO DPS - Eu to tentando mostrar na tela do ADM o numero COUNT total de produtos mas tem um bug
    res.render('homeAdministrator', {showNavbar: false});
    
    

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
        res.render('adicionarProduto', { produtos, showNavbar: false });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
};

export async function adicionarItem(req, res) {
    const { nome, preco, descricao } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : null; // Caminho da imagem

    if (!nome || !preco || !descricao) {
        return res.status(400).send('Campos obrigatórios estão faltando');
    }
    if (!req.file) {
        return res.status(400).send('Imagem não enviada');
    }    
    try {
        const result = await pool.query(
            'INSERT INTO produtos (nome, preco, descricao, imagem) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, preco, descricao, imagem]
        );
        console.log('Item adicionado:', result.rows[0]);
        res.redirect('/administrator/p/produtos'); // Redireciona após a adição do produto
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
        res.render('comprar', { produto, precoTotal, quantidade, currentStep: 'comprar' });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto');
    }
}

export function endereco(req, res) {
    res.render('endereco', { produto: { id: req.params.id }, currentStep: 'endereco' });
}

export function pagamento(req, res) {
    res.render('pagamento', { produto: { id: req.params.id }, currentStep: 'pagamento' });
}

export async function confirmarCompra(req, res) {
    const { id: produtoId } = req.params;
    const { quantidade, endereco_entrega } = req.body; // Supõe-se que o endereço seja enviado

    try {
        // Inserir pedido no banco de dados
        const result = await pool.query(
            `INSERT INTO pedidos (id_usuario, id_produto, quantidade, endereco_entrega, status)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.session.userId, produtoId, quantidade, endereco_entrega, 'Em processamento']
        );

        res.render('confirmarCompra', { produto: { id: produtoId }, currentStep: 'confirmar' });
    } catch (error) {
        console.error('Erro ao registrar pedido:', error);
        res.status(500).send('Erro ao registrar pedido');
    }
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

export async function statusProduto(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY data_pedido DESC LIMIT 1',
            [req.session.userId]
        );
        const pedido = result.rows[0];
        res.render('statusPedido', { pedido });
    } catch (error) {
        console.error('Erro ao buscar status do pedido:', error);
        res.status(500).send('Erro ao buscar status do pedido');
    }
}