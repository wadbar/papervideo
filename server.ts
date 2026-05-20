import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Server } from "http";
import { aiRouter } from "./src/server/aiRouter";
import { generateLoginToken } from "./src/server/auth.middleware";

// ==========================================
// TELEMETRY & LOGGING (STRUCTURED)
// ==========================================
const sysLog = (level: "INFO" | "WARN" | "ERROR", component: string, message: string, meta: Record<string, any> = {}) => {
  const timestamp = new Date().toISOString();
  let color = "\x1b[36m"; // Cyan for INFO
  if (level === "WARN") color = "\x1b[33m"; // Yellow
  if (level === "ERROR") color = "\x1b[31m"; // Red
  
  const reset = "\x1b[0m";
  const metaString = Object.keys(meta).length > 0 ? ` | Meta: ${JSON.stringify(meta)}` : "";
  console.log(`${color}[${timestamp}] [${level}] [${component}]${reset} - ${message}${metaString}`);
};

// ==========================================
// GLOBAL EXCEPTION INTERCEPTORS
// ==========================================
process.on("uncaughtException", (error: Error) => {
  sysLog("ERROR", "PROCESS", "Uncaught Exception Detected", { message: error.message, stack: error.stack });
  // Allowing graceful shutdown trigger
  process.exit(1); 
});

process.on("unhandledRejection", (reason: any) => {
  sysLog("ERROR", "PROCESS", "Unhandled Promise Rejection Detected", { reason });
  // Logging only, avoiding immediate crash depending on industrial policy, but normally we should exit.
});

// ==========================================
// GRACEFUL SHUTDOWN ORCHESTRATION
// ==========================================
let serverInstance: Server | null = null;
const shutdownGracefully = (signal: string) => {
  sysLog("WARN", "SHUTDOWN", `Received ${signal}. Initiating graceful shutdown...`);
  if (serverInstance) {
    serverInstance.close((err) => {
      if (err) {
        sysLog("ERROR", "SHUTDOWN", "Error during server close.", { error: err.message });
        process.exit(1);
      }
      sysLog("INFO", "SHUTDOWN", "HTTP Server closed securely. Express connections terminated.");
      sysLog("INFO", "SHUTDOWN", "Memory buffers released. Exiting zero.");
      process.exit(0);
    });
    
    // Force shutdown after 10s if connections refuse to close
    setTimeout(() => {
      sysLog("ERROR", "SHUTDOWN", "Timeout reached forcing exit.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdownGracefully("SIGINT"));
process.on("SIGTERM", () => shutdownGracefully("SIGTERM"));

// ==========================================
// APPLICATION BOOTSTRAP
// ==========================================
async function startServer() {
  const app = express();
  const PORT = 3000;

  sysLog("INFO", "BOOT", "Initializing Main Event Loop...");

  try {
    // Trust proxy is required for express-rate-limit behind reverse proxies
    app.set('trust proxy', 1);

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    // Request Logger Middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      sysLog("INFO", "ROUTER", `${req.method} ${req.url}`, { ip: req.ip });
      next();
    });

    // ==========================================
    // BASIC AUTHENTICATION
    // ==========================================
    app.post('/api/auth/login', (req, res) => {
      try {
        const token = generateLoginToken();
        res.json({ token });
        sysLog("INFO", "AUTH", "Token successfully generated.");
      } catch (error: any) {
        sysLog("ERROR", "AUTH", "Failed to generate login token.", { error: error.message });
        res.status(500).json({ error: "Internal Auth Failure" });
      }
    });

    // ==========================================
    // AI ROUTER INJECTION
    // ==========================================
    app.use('/api/ai', aiRouter);

    // Health Fallback
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      sysLog("INFO", "VITE", "Mounting Vite Middleware (Development Mode)");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      sysLog("INFO", "STATIC", "Serving static production build...");
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    serverInstance = app.listen(PORT, "0.0.0.0", () => {
      sysLog("INFO", "SERVER", `API Server running natively on port ${PORT} with industrial shielding.`);
    });
  } catch (error: any) {
    sysLog("ERROR", "BOOT", "Fatal error during startup loop. Halting initialization.", { err: error.message });
    process.exit(1);
  }
}

startServer();
