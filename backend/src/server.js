import express from "express";
import cors from "cors";
import itemRoutes from "./routes/items.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Backend работает! 🚀",
    endpoints: {
      available: "/api/items/available",
      selected: "/api/items/selected",
      select: "POST /api/items/select",
      deselect: "POST /api/items/deselect",
      reorder: "POST /api/items/reorder",
      add: "POST /api/items/add",
    },
  });
});

app.use("/api/items", itemRoutes);

app.listen(PORT, () => {
  console.log(`Backend запущен на http://localhost:${PORT}`);
});
