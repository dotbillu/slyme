import express from "express";
import cors from "cors";
import authRoutes from "../src/auth/index";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
