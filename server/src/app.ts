import express from "express";
import { router } from "./routes/index.js";
import { ApiError } from "./utils/http.js";

export const app = express();

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/api", router);

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    error: {
      message: "Route not found",
    },
  });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
    },
  });
});
