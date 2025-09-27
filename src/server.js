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
    endpoints: ["/proxy/score", "/metrics", "/health"],
  });
});

app.get("/proxy/score", async (req, res) => {
  try {
    const result = await proxyService.getScore(req.query);
    if (result.success === false) {
      const statusCode = result.error.includes('inválido') ? 401 : 503;
      res.status(statusCode).json(result);
    } else {
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/metrics", (req, res) => {
  res.json(proxyService.getMetrics());
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Acesse http://localhost:${port}`);
});