
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Connexion à PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Route test base de données
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur de connexion à la base");
  }
});

// 📊 Récupérer toutes les sessions
app.get("/sessions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sessions ORDER BY heure DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des sessions");
  }
});

// 📋 Liste des supermarchés
app.get("/supermarches", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM supermarches ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des supermarchés");
  }
});

// 👨‍💼 Liste des employés avec leur supermarché
app.get("/employes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.nom, e.prenom, s.nom AS supermarche
      FROM employes e
      JOIN supermarches s ON e.supermarche_id = s.id
      ORDER BY e.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des employés");
  }
});

// 📊 Sessions détaillées (employé + supermarché + colis)
app.get("/sessions/details", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT se.id, se.nb_colis, se.heure,
             e.nom AS employe_nom, e.prenom AS employe_prenom,
             s.nom AS supermarche
      FROM sessions se
      JOIN employes e ON se.employe_id = e.id
      JOIN supermarches s ON e.supermarche_id = s.id
      ORDER BY se.heure DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des sessions détaillées");
  }
});

// ➕ Ajouter une nouvelle session
app.post("/sessions", async (req, res) => {
  const { employe_id, nb_colis } = req.body;

  if (!employe_id || !nb_colis) {
    return res.status(400).json({ error: "employe_id et nb_colis sont requis" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO sessions (employe_id, nb_colis) VALUES ($1, $2) RETURNING *",
      [employe_id, nb_colis]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'ajout de la session");
  }
});

// ➕ Servir le frontend
app.use(express.static(path.join(__dirname, "frontend")));

// ⚠️ Fallback SPA (toutes les autres routes -> index.html)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 API Colis Timer en écoute sur le port ${PORT}`);
});
