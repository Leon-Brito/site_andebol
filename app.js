const mysql = require('mysql2');

// 1. Configurar a ligação
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Utilizador padrão do XAMPP
  password: '',      // Senha padrão do XAMPP (vazia)
  database: 'site_andebol'   // <--- MUDAR ISTO para o nome da tua base de dados
});

// 2. Tentar ligar
console.log('A tentar ligar...');

connection.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar: ' + err.stack);
    return;
  }
  console.log('✅ Sucesso! Conectado à base de dados com ID: ' + connection.threadId);
});

// 3. Fechar a conexão (para o teste não ficar preso)
connection.end();