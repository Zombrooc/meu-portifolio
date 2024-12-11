const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2");
const fs = require("fs");
const app = express();
const port = 3000; // Definindo uma porta fixa para o servidor
const morgan = require("morgan");

app.use(morgan("dev"));

app.use(cors()); // Permite todas as origens

// Verifica se o diretório 'uploads' existe, caso contrário, cria-o
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Configuração do armazenamento de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Configuração do banco de dados
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mysql",
  database: "portfolio",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conectado ao banco de dados");
});

app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));
// Rota para criar tema
app.post("/api/temas", (req, res) => {
  const { titulo, descricao } = req.body;
  const query = "INSERT INTO temas (titulo, descricao) VALUES (?, ?)";
  db.query(query, [titulo, descricao], (err, result) => {
    if (err) {
      console.error("Erro ao inserir tema:", err);
      return res.status(500).json({ message: "Erro ao criar tema" });
    }
    res.status(201).json({ message: "Tema criado com sucesso!" });
  });
});

// Rota para carregar temas
app.get("/api/temas", (req, res) => {
  const query = "SELECT * FROM temas";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao carregar temas:", err);
      return res.status(500).json({ message: "Erro ao carregar temas" });
    }
    res.json(results);
  });
});

// Rota para excluir tema
app.delete("/api/temas/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).json({ message: "Erro ao iniciar transação" });
    }

    // 1. Excluir as imagens associadas ao tema
    const deleteImagesQuery = "DELETE FROM imagens WHERE tema_id = ?";
    db.query(deleteImagesQuery, [id], (err, result) => {
      if (err) {
        console.error("Erro ao excluir imagens:", err);
        return db.rollback(() => {
          res.status(500).json({ message: "Erro ao excluir imagens" });
        });
      }

      // 2. Excluir o tema
      const deleteTemaQuery = "DELETE FROM temas WHERE id = ?";
      db.query(deleteTemaQuery, [id], (err, result) => {
        if (err) {
          console.error("Erro ao excluir tema:", err);
          return db.rollback(() => {
            res.status(500).json({ message: "Erro ao excluir tema" });
          });
        }

        // Commitar as alterações se ambas as consultas forem bem-sucedidas
        db.commit((err) => {
          if (err) {
            console.error("Erro ao comitar transação:", err);
            return db.rollback(() => {
              res.status(500).json({ message: "Erro ao finalizar transação" });
            });
          }

          res
            .status(200)
            .json({ message: "Tema e imagens excluídos com sucesso!" });
        });
      });
    });
  });
});

// Rota para criar imagem
app.post("/api/imagens", upload.single("imagem"), (req, res) => {
  console.log(req.file); // Verifique se o arquivo está chegando aqui

  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo foi enviado." });
  }

  const { tema_id, display } = req.body;
  const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`; // URL relativa

  const query = "INSERT INTO imagens (url, tema_id, display) VALUES (?, ?, ?)";
  db.query(query, [imageUrl, tema_id, display], (err, result) => {
    if (err) {
      console.error("Erro ao inserir imagem no banco:", err);
      return res
        .status(500)
        .json({ message: "Erro ao salvar imagem no banco" });
    }
    res
      .status(201)
      .json({ message: "Imagem adicionada com sucesso!", id: result.insertId });
  });
});

// Rota para listar imagens
app.get("/api/imagens", (req, res) => {
  const queryParams = req.query;

  if (queryParams?.display) {
    db.query(
      "SELECT * FROM imagens WHERE display = ?",
      [display],
      (err, results) => {
        if (err) throw err;
        res.json(results);
      }
    );
  }

  db.query("SELECT * FROM imagens", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Rota para excluir imagem
app.delete("/api/imagens/:id", (req, res) => {
  const { id } = req.params;

  // Primeiro, obtém o caminho da imagem do banco de dados
  db.query("SELECT url FROM imagens WHERE id = ?", [id], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    const imagePath = results[0].url;

    // Exclui a imagem do sistema de arquivos
    fs.unlink(imagePath, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erro ao excluir o arquivo da imagem." });
      }

      // Exclui a imagem do banco de dados
      db.query("DELETE FROM imagens WHERE id = ?", [id], (err) => {
        if (err) throw err;
        res.json({ message: "Imagem excluída" });
      });
    });
  });
});

// Inicia o servidor na porta 3000
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
