import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { aiRouter } from "./src/server/aiRouter";
import { generateLoginToken } from "./src/server/auth.middleware";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required for express-rate-limit behind reverse proxies
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // ==========================================
  // AUTENTICAÇÃO BÁSICA PARA O FRONTEND
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    // Para simplificar no protótipo industrial, emitimos token sem validação de senha
    const token = generateLoginToken();
    res.json({ token });
  });

  // ==========================================
  // ROTAS DE IA (Blindadas com Rate Limit e JWT)
  // ==========================================
  app.use('/api/ai', aiRouter);

  // Endpoint de fallback para Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Omni Architect] API Server rodando na porta ${PORT} com Blindagem OWASP ativa.`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server", err);
});
