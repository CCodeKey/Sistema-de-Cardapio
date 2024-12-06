-- Criação da sequence para gerar IDs
CREATE SEQUENCE produtos_id_seq START 1;

-- Criação da tabela 'produtos' usando a sequence para a coluna 'id'
CREATE TABLE produtos (
    id INTEGER DEFAULT nextval('produtos_id_seq') PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT
);

-- Função para ajustar a sequence ao maior valor de 'id'
CREATE OR REPLACE FUNCTION ajustar_sequence_produtos() RETURNS TRIGGER AS $$
BEGIN
    PERFORM setval('produtos_id_seq', COALESCE((SELECT MAX(id) FROM produtos), 1));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger que chama a função após cada exclusão
CREATE TRIGGER trigger_ajustar_sequence
AFTER DELETE ON produtos
FOR EACH STATEMENT
EXECUTE FUNCTION ajustar_sequence_produtos();


ALTER TABLE produtos ADD COLUMN imagem TEXT;





-- Criando usuario ADM
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user'
);

-- Usuarios
INSERT INTO users (username, email, password, role)
VALUES 
('codekey', 'gabriel@gmail.com', '123mudar', 'admin'),
('hellenilda', 'hellen@gmail.com', '123mudar', 'admin');