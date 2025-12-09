import express from "express";
import { itemService } from "../services/itemService.js";

const router = express.Router();

// GET /api/items/available - Получить доступные элементы
router.get("/available", (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const result = itemService.getAvailableItems(
      parseInt(page),
      parseInt(limit),
      search,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/items/selected - Получить выбранные элементы
router.get("/selected", (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const result = itemService.getSelectedItems(
      parseInt(page),
      parseInt(limit),
      search,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/select - Добавить элемент в выбранные
router.post("/select", (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID обязателен" });
    }
    itemService.selectItem(id);
    res.json({ success: true, message: "Элемент добавлен в очередь" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/deselect - Удалить элемент из выбранных
router.post("/deselect", (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID обязателен" });
    }
    itemService.deselectItem(id);
    res.json({ success: true, message: "Элемент удален из очереди" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/reorder - Изменить порядок элементов
router.post("/reorder", (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items должен быть массивом" });
    }
    itemService.reorderItems(items);
    res.json({ success: true, message: "Порядок обновлен" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items/add - Добавить новый элемент
router.post("/add", (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID обязателен" });
    }

    // Проверка произойдет в сервисе
    itemService.addNewItem(id);
    res.json({
      success: true,
      message: "Элемент добавлен в очередь (обработка через 10 сек)",
    });
  } catch (error) {
    // Ловим ошибку если элемент уже существует
    res.status(400).json({ error: error.message });
  }
});

export default router;
