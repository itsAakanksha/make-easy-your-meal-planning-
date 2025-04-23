import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors({
  origin:  'http://localhost:5173', // Update with your client port
  credentials: true
}));

const port = process.env.PORT || 8000; // Use this variable consistently

// Middleware ordering is crucial in Express
app.use(express.json());

// Add logging middleware first
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalUrl = req.originalUrl;

  // Capture response body safely
  const originalJson = res.json;
  let responseBody: unknown;
  
  res.json = function(body: unknown) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${originalUrl} ${res.statusCode} ${duration}ms`;
    console.log(logLine); // Actually log the result
    
    // Optional: Log response body for debugging (be cautious with sensitive data)
    if (process.env.NODE_ENV === 'development' && responseBody) {
      console.debug('Response:', JSON.stringify(responseBody, null, 2));
    }
  });

  next();
});

// Register API routes before static files
(async () => {
  // 1. Register routes first
  const server = await registerRoutes(app);

  // 2. Add error handler AFTER routes
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const status = 'status' in err ? (err as any).status : 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`[${new Date().toISOString()}] Error:`, err);
    res.status(status).json({ message });
  }); // Removed 'throw err' to prevent unhandled rejections

  // 3. Configure production setup LAST
  if (process.env.NODE_ENV === 'production') {
    const clientPath = path.resolve(__dirname, '../client/dist');
    
    // Serve static assets
    app.use(express.static(clientPath));
    
    // Handle SPA routing
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
  }

  // 4. Start server with configured port
  server.listen({ 
    port: Number(port),
    host: "0.0.0.0"
  }, () => {
    console.log(`Server running on port ${port}`);
  });
})();