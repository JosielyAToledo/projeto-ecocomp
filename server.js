const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================================
   CONEXÃO COM MONGODB
================================ */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Erro Mongo:", err));

/* ================================
   SCHEMAS
================================ */

// Leituras dos sensores
const ReadingSchema = new mongoose.Schema({
  soil: Number,               // interno
  airHumidity: Number,        // interno
  airTemp: Number,            // interno
  soilExternal: Number,       // externo
  airHumidityExternal: Number,// externo
  tempExternal: Number,       // externo
  createdAt: { type: Date, default: Date.now }
});

// Atuadores
const ActuatorSchema = new mongoose.Schema({
  bomba: { type: Boolean, default: false },
  ventoinha: { type: Boolean, default: false },
  lampada: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

// Configuração automática
const ConfigSchema = new mongoose.Schema({
  soloMin: Number,
  tempMax: Number,
  tempMin: Number
});

/* ================================
   MODELS
================================ */
const Reading = mongoose.model("Reading", ReadingSchema);
const Actuator = mongoose.model("Actuator", ActuatorSchema);
const Config = mongoose.model("Config", ConfigSchema);

/* ================================
   ROTAS DE TESTE
================================ */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================================
   ROTAS DE ATUADORES
================================ */
app.post("/api/actuators", async (req, res) => {
  try {
    const { tipo, ativo } = req.body;

    let actuators = await Actuator.findOne();
    if (!actuators) actuators = new Actuator();

    actuators[tipo] = ativo;
    actuators.updatedAt = new Date();

    await actuators.save();
    res.json({ message: "atuador atualizado", actuators });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "erro ao atualizar atuador" });
  }
});

app.get("/api/actuators", async (req, res) => {
  try {
    let actuators = await Actuator.findOne();
    if (!actuators) {
      actuators = new Actuator();
      await actuators.save();
    }
    res.json(actuators);
  } catch (error) {
    res.status(500).json({ erro: "erro ao buscar atuadores" });
  }
});

/* ================================
   ROTAS DE CONFIGURAÇÃO
================================ */
app.post("/api/config", async (req, res) => {
  try {
    const { soloMin, tempMax, tempMin } = req.body;

    let config = await Config.findOne();
    if (!config) config = new Config();

    config.soloMin = soloMin;
    config.tempMax = tempMax;
    config.tempMin = tempMin;

    await config.save();
    res.json({ message: "configuração salva", config });
  } catch (error) {
    res.status(500).json({ erro: "erro ao salvar config" });
  }
});

app.get("/api/config", async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = new Config({ soloMin: 40, tempMax: 32, tempMin: 18 });
      await config.save();
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ erro: "erro ao buscar config" });
  }
});

/* ================================
   ROTAS DE SENSORES
================================ */
// SALVAR LEITURA (ESP32 envia)
app.post("/api/data", async (req, res) => {
  try {
    const {
      soil, airHumidity, airTemp,
      soilExternal, airHumidityExternal, tempExternal
    } = req.body;

    const data = new Reading({
      soil: soil ?? 0,
      airHumidity: airHumidity ?? 0,
      airTemp: airTemp ?? 0,
      soilExternal: soilExternal ?? 0,
      airHumidityExternal: airHumidityExternal ?? 0,
      tempExternal: tempExternal ?? 0
    });

    await data.save();
    res.json({ message: "dados salvos", data });
  } catch (error) {
    console.error("Erro no POST:", error);
    res.status(500).json({ erro: "erro ao salvar dados" });
  }
});

// BUSCAR DADOS HISTÓRICOS
app.get("/api/data", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;

    const data = await Reading.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    const dadosFormatados = data.map(item => ({
      createdAt: item.createdAt,

      // INTERNO
      soil: item.soil ?? 0,
      airHumidity: item.airHumidity ?? 0,
      temp: item.airTemp ?? 0,

      // EXTERNO
      soilExternal: item.soilExternal ?? 0,
      airHumidityExternal: item.airHumidityExternal ?? 0,
      tempExternal: item.tempExternal ?? 0
    }));

    res.json(dadosFormatados);
  } catch (error) {
    res.status(500).json({ erro: "erro ao buscar dados" });
  }
});

/* ================================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log("Server rodando na porta", PORT);
});
