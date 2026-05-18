import "dotenv/config";
import cors from "cors";
import express from "express";
import errorHandler from "./middleware/error.middleware.js";
import notFound from "./middleware/notFound.middleware.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173", "https://YOUR-FRONTEND.onrender.com"],
      credentials: true,
    }),
  );

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
    });
  });

  // Import all application routes
  app.use("/api", routes);

  // Handle 404 not found page
  app.use(notFound);

  // global error handler
  app.use(errorHandler);

  return app;
}
