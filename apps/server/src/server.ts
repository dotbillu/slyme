import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import authRoutes from "./routes/auth/index";
import userRoutes from "./routes/user/index";
import gigRoutes from "./routes/gigs/index";
import roomRoutes from "./routes/rooms/index";
import { initSocket } from "./sockets";

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://slyme.dotbillu.in"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/gigs", gigRoutes);
app.use("/rooms", roomRoutes);

app.get("/helloboy", (req, res) => {
  res.status(200).json("slyme up");
});

const server = http.createServer(app);

initSocket(server);

const PORT = 3001;

server.listen(PORT);
