import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import authRouter from "./routes/auth";
import dailyReportsRouter from "./routes/dailyReports";

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/v1/auth", authRouter);
app.use("/v1/daily-reports", dailyReportsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.warn(`Server running on port ${PORT}`);
});

export { app };
