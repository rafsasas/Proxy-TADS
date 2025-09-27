require("dotenv").config();
const express = require("express");
const ProxyService = require("./services/ProxyService");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const proxyService = new ProxyService();

app.get("/", (req, res) => {
  res.json({
    message: "Proxy Server",
    endpoints: ["/proxy/score"],
  });
});

app.get("/proxy/score", async (req, res) => {
  try {
    const result = await proxyService.getScore(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Acesse http://localhost:${port}`);
});
