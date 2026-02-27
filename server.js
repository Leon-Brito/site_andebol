const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const app = express();
app.use(session({
    secret: 'andebol_olhao', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // EM LOCALHOST TEM DE SER FALSE (se for true não funciona)
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 dia
    }
}));
// Permite que o servidor mostre ficheiros HTML, CSS e Imagens que estejam na mesma pasta
app.use(express.static(__dirname));

// Se tiveres os ficheiros numa pasta chamada 'public', usa antes esta linha:
// app.use(express.static('public'));
const porta = 3000;

// --- 1. CONFIGURAÇÃO DA BASE DE DADOS ---
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'site_andebol'
});

connection.connect(err => {
    if (err) {
        console.error('❌ Erro na BD: ' + err.stack);
        return;
    }
    console.log('✅ Base de Dados Ligada!');
});

app.use(express.json());

// --- ROTAS DE PÁGINAS ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/convocatoria', (req, res) => res.sendFile(path.join(__dirname, 'convocatoria.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
// ... (outros app.get)
app.get('/login-faturas', (req, res) => res.sendFile(path.join(__dirname, 'login-faturas.html')));
app.get('/minhas-faturas', (req, res) => res.sendFile(path.join(__dirname, 'financeiro.html')));
app.get('/convocatoria', (req, res) => res.sendFile(path.join(__dirname, 'convocatoria.html')));
// --- 3. API (FUNCIONALIDADES) ---

// Listar SÓ Jogadores (para faturas e jogos)
app.get('/api/jogadores-completo', (req, res) => {
    connection.query("SELECT id, nome, nif, morada FROM utilizadores WHERE tipo = 'jogador'", (err, rows) => {
        if(err) return res.status(500).json(err);
        res.json(rows);
    });
});

// 2. BUSCAR JOGADORES POR ESCALÃO (Para a Convocatória)
app.get('/api/jogadores/:escalao', (req, res) => {
    const escalao = req.params.escalao;
    
    // Busca jogadores que tenham este escalão associado na tabela jogador_escaloes
    const sql = `
        SELECT u.id, u.nome 
        FROM utilizadores u
        JOIN jogador_escaloes je ON u.id = je.id_jogador
        WHERE je.escalao = ?
    `;
    
    connection.query(sql, [escalao], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});
// Listar TODOS (Admins e Jogadores) para poder apagar
app.get('/api/todos-utilizadores', (req, res) => {
    connection.query("SELECT id, nome, tipo FROM utilizadores", (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});

// Ação: APAGAR Utilizador
// Rota para APAGAR utilizador
// Rota para APAGAR utilizador
app.delete('/api/utilizadores/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM utilizadores WHERE id = ?";

    // ATENÇÃO: Mudei de 'db.query' para 'connection.query'
    // Se o teu nome for 'con', usa 'con.query'
    connection.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao apagar:", err);
            return res.status(500).json({ erro: "Erro na base de dados" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: "Utilizador não encontrado" });
        }

        res.json({ mensagem: "Utilizador apagado com sucesso!" });
    });
});

// Ação: Criar Novo Utilizador (Admin ou Jogador)
// 1. CRIAR UTILIZADOR (COM MÚLTIPLOS ESCALÕES)
app.post('/api/criar-utilizador', (req, res) => {
    // Recebe nif e morada do formulário
    const { nome, email, senha, tipo, escaloes, nif, morada } = req.body; 
    
    const sqlUser = "INSERT INTO utilizadores (nome, email, senha, tipo, nif, morada) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sqlUser, [nome, email, senha, tipo, nif, morada], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        
        const idJogador = result.insertId;

        // Gravar escalões (código igual ao anterior)
        if (tipo === 'jogador' && escaloes && escaloes.length > 0) {
            const valores = escaloes.map(esc => [idJogador, esc]);
            const sqlEscaloes = "INSERT INTO jogador_escaloes (id_jogador, escalao) VALUES ?";
            connection.query(sqlEscaloes, [valores], (err2) => {
                if (err2) console.error("Erro escalões: " + err2.message);
            });
        }
        res.json({ mensagem: `Utilizador criado com sucesso!` });
    });
});

// Ação: Enviar Fatura
// --- 3. NOVO: CRIAR FATURA ---
app.post('/api/faturas', (req, res) => {
    const dados = req.body;
    
    const sql = `
        INSERT INTO faturas 
        (numero_recibo, data_emissao, id_jogador, nome_jogador, nif_jogador, morada_jogador, 
         descricao, valor_base, valor_iva, valor_desconto, valor_total, 
         data_pagamento, metodo_pagamento, nota_pagamento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const valores = [
        dados.numero_recibo, dados.data_emissao, dados.id_jogador, dados.nome_jogador, 
        dados.nif_jogador, dados.morada_jogador, dados.descricao, 
        dados.valor_base, dados.valor_iva, dados.valor_desconto, dados.valor_total,
        dados.data_pagamento, dados.metodo_pagamento, dados.nota_pagamento
    ];

    connection.query(sql, valores, (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: 'Fatura lançada com sucesso!' });
    });
});

// Ação: Criar Convocatória
// --- ROTA DA PÁGINA VISUAL ---
// 3. CRIAR CONVOCATÓRIA (ADMIN)
app.post('/api/convocatoria', (req, res) => {
    const { adversario, data, local, escalao, ids_jogadores } = req.body;
    
    const sql = "INSERT INTO convocatorias (jogo_contra, data_jogo, local, escalao) VALUES (?, ?, ?, ?)";
    connection.query(sql, [adversario, data, local, escalao], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        
        const idConvocatoria = result.insertId;
        
        if (ids_jogadores && ids_jogadores.length > 0) {
            const valores = ids_jogadores.map(id => [idConvocatoria, id]);
            connection.query("INSERT INTO convocados (id_convocatoria, id_jogador) VALUES ?", [valores], (err2) => {
                if (err2) return res.status(500).json({ erro: err2.message });
                res.json({ mensagem: 'Convocatória enviada!' });
            });
        } else {
            res.json({ mensagem: 'Jogo criado (sem jogadores).' });
        }
    });
});
// ASSOCIAÇÃO: Ligar Encarregado ao Jogador
app.post('/api/associar-educando', (req, res) => {
    const { id_encarregado, id_jogador } = req.body;

    const sql = "INSERT INTO encarregados_jogadores (id_encarregado, id_jogador) VALUES (?, ?)";
    
    connection.query(sql, [id_encarregado, id_jogador], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ erro: "Esta ligação já existe!" });
            }
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: "Jogador associado com sucesso ao encarregado!" });
    });
});

// LISTAR ENCARREGADOS (Para preencher um select no Admin)
app.get('/api/encarregados', (req, res) => {
    connection.query("SELECT id, nome FROM utilizadores WHERE tipo = 'encarregado'", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// --- API: OBTER OS JOGADORES DO ENCARREGADO ---
app.get('/api/meus-educandos', (req, res) => {
    const idEncarregado = req.query.id;
    const sql = `
        SELECT u.id, u.nome 
        FROM utilizadores u
        JOIN encarregados_jogadores ej ON u.id = ej.id_jogador
        WHERE ej.id_encarregado = ?
    `;
    connection.query(sql, [idEncarregado], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Listar apenas quem é Encarregado
app.get('/api/encarregados', (req, res) => {
    connection.query("SELECT id, nome FROM utilizadores WHERE tipo = 'encarregado' ORDER BY nome ASC", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// A Rota que faz a gravação na tabela de ligação
app.post('/api/associar-familia', (req, res) => {
    const { id_encarregado, id_jogador } = req.body;
    const sql = "INSERT INTO encarregados_jogadores (id_encarregado, id_jogador) VALUES (?, ?)";
    
    connection.query(sql, [id_encarregado, id_jogador], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ erro: "Esta ligação já existe!" });
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: "Ligação criada com sucesso!" });
    });
});

// --- API: OBTER A ÚLTIMA CONVOCATÓRIA ---
// --- API: OBTER PRÓXIMOS JOGOS (Lista) ---
// --- API: OBTER PRÓXIMOS JOGOS (Lista) ---
// 4. LISTAR JOGOS DO JOGADOR (Para o Utilizador ver)
app.get('/api/meus-jogos', (req, res) => {
    const idJogador = req.query.id;
    const sql = `
    SELECT c.* FROM convocatorias c
    JOIN convocados cv ON c.id = cv.id_convocatoria
    WHERE cv.id_jogador = ? 
    ORDER BY c.data_jogo DESC
`;
    connection.query(sql, [idJogador], (err, rows) => res.json(rows));
});
// --- TESTE DE LIGAÇÃO ---
/*app.get('/api/minhas-convocatorias', (req, res) => {
    console.log("Recebi um pedido de convocatórias!"); // Isto vai aparecer no terminal
    
    // Vamos enviar dados falsos só para ver se o site carrega
    res.json([
        {
            id: 1,
            data_jogo: new Date(),
            local: "Pavilhão de Teste",
            adversario: "Equipa Teste",
            escalao: "Sub-18"
        },
        {
            id: 2,
            data_jogo: new Date(),
            local: "Pavilhão Municipal",
            adversario: "Sporting",
            escalao: "Sub-18"
        }
    ]);
});*/
// --- ROTA DE LOGIN ---
// --- ROTA DE LOGIN CORRIGIDA ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM utilizadores WHERE email = ? AND senha = ?';
    
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ sucesso: false, mensagem: "Erro no servidor" });
        }

        if (results.length > 0) {
            const user = results[0];

            // --- ESTA É A PARTE QUE FALTAVA ---
            // Guardar os dados na Sessão do servidor
            req.session.user = {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipo: user.tipo
            };

            // Forçar a gravação antes de responder ao site
            req.session.save((err) => {
                if(err) console.log("Erro ao gravar sessão:", err);

                // Só respondemos DEPOIS de a sessão estar guardada
                res.json({ 
                    sucesso: true,
                    utilizador: { 
                        id: user.id, 
                        nome: user.nome, 
                        email: user.email,
                        nif: user.nif,
                        tipo: user.tipo,
                        admin: user.tipo === 'admin' ? 1 : 0 
                    } 
                });
            });
            // ----------------------------------

        } else {
            res.json({ sucesso: false, mensagem: "Email ou password errados!" });
        }
    });
});
// 8. OBTER MINHAS FATURAS (Novo)
// Rota para o atleta consultar as suas faturas
// --- ROTA PARA O ATLETA VER FATURAS (Versão MySQL) ---
app.get('/api/minhas-faturas', (req, res) => {
    const id = req.query.id;
    
    // Verifica se temos ID
    if (!id) {
        return res.json([]); 
    }

    // Usa SELECT * para garantir que vem o metodo_pagamento
    const sql = 'SELECT * FROM faturas WHERE id_jogador = ? ORDER BY data_emissao DESC';
    
    // MUDANÇA IMPORTANTE: Aqui usamos 'connection.query' em vez de 'db.all'
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error("❌ ERRO SQL:", err.message); 
            return res.status(500).json({ erro: "Erro na base de dados" });
        }
        // No MySQL os dados vêm em 'results'
        res.json(results);
    });
});
// Rota para verificar a sessão (Quem está logado?)
app.get('/api/check-session', (req, res) => {
    console.log("--- Verificação de Sessão ---");
    console.log("Sessão atual:", req.session);
    
    if (req.session && req.session.user) {
        console.log("Utilizador detetado:", req.session.user.nome);
        res.json({ logado: true, user: req.session.user });
    } else {
        console.log("Nenhum utilizador logado.");
        res.json({ logado: false });
    }
});

// Rota para fazer Logout (Sair)
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao sair');
        }
        res.redirect('/'); // Manda de volta para a página inicial
    });
});

app.listen(porta, () => {
    console.log(`Servidor a correr em http://localhost:${porta}`);
});