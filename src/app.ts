import express from "express";

// import { createBullBoard } from "@b"

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
})

app.listen(PORT, () => {
  console.log(`Server is running in http:localhost:${PORT}`);
})