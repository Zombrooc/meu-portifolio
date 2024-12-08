const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql'); // Adicionando o MySQL

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // substitua pelo seu usuário do MySQL
    password: '', // substitua pela sua senha do MySQL
    database: 'portfolio'
});

// Conectar ao banco de dados
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde as imagens serão armazenadas
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Adiciona timestamp ao nome do arquivo
    }
});

const upload = multer({ storage: storage });

// Middleware para servir arquivos estáticos e processar dados de formulários
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Para processar dados de formulários
app.use(express.json()); // Para processar JSON

// Rota para adicionar imagens (com tema e descrição)
app.post('/api/imagens', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    const imagePath = req.file.path;
    const temaId = req.body.tema_id;  // Captura o tema_id enviado no FormData
    const descricao = req.body.descricao;  // Captura a descrição enviada no FormData

    // Inserir imagem no banco de dados com tema_id e descrição
    db.query('INSERT INTO imagens (url, tema_id, descricao) VALUES (?, ?, ?)', [imagePath, temaId, descricao], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao salvar a imagem no banco de dados.' });
        }
        res.status(201).json({ message: 'Imagem adicionada com sucesso!' });
    });
});

// Rota para editar imagens
app.put('/admin/edit/:id', upload.single('image'), (req, res) => {
    const imageId = req.params.id;
    let newImagePath;

    if (req.file) {
        newImagePath = req.file.path;
        // Atualiza o caminho da imagem no banco de dados
        db.query('UPDATE imagens SET url = ? WHERE id = ?', [newImagePath, imageId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar a imagem no banco de dados.' });
            }
            res.json({ message: 'Imagem editada com sucesso!' });
        });
    } else {
        res.json({ message: 'Imagem não foi alterada.' });
    }
});

// Rota para excluir imagens
app.delete('/admin/delete/:id', (req, res) => {
    const imageId = req.params.id;
    // Obter o caminho da imagem do banco de dados
    db.query('SELECT url FROM imagens WHERE id = ?', [imageId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Imagem não encontrada.' });
        }
        const imagePath = results[0].url;

        // Excluir o arquivo físico da imagem
        fs.unlink(imagePath, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao excluir a imagem.' });
            }
            // Remover a imagem do banco de dados
            db.query('DELETE FROM imagens WHERE id = ?', [imageId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao remover a imagem do banco de dados.' });
                }
                res.json({ message: 'Imagem excluída com sucesso!' });
            });
        });
    });
});

// Rota para obter todas as imagens
app.get('/api/imagens', (req, res) => {
    db.query('SELECT * FROM imagens', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Rota para obter todos os temas
app.get('/api/temas', (req, res) => {
    db.query('SELECT * FROM temas', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});
// Rota para criar tema
app.post('/api/temas', (req, res) => {
    const { titulo, descricao } = req.body;
    const query = 'INSERT INTO temas (titulo, descricao) VALUES (?, ?)';

    db.query(query, [titulo, descricao], (err, result) => {
        if (err) {
            console.error('Erro ao criar tema:', err);
            return res.status(500).json({ error: 'Erro ao criar tema' });
        }

        // Log de sucesso no servidor
        console.log('Resposta: Tema criado');

        // Envia a resposta para o cliente
        res.status(201).json({ message: 'Tema criado' });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
