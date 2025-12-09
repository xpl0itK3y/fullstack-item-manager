import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Получить доступные элементы
export const getAvailableItems = (page = 1, limit = 20, search = "") => {
  return apiClient.get("/items/available", {
    params: { page, limit, search },
  });
};

// Получить выбранные элементы
export const getSelectedItems = (page = 1, limit = 20, search = "") => {
  return apiClient.get("/items/selected", {
    params: { page, limit, search },
  });
};

// Добавить элемент в выбранные
export const selectItem = (id) => {
  return apiClient.post("/items/select", { id });
};

// Удалить элемент из выбранных
export const deselectItem = (id) => {
  return apiClient.post("/items/deselect", { id });
};

// Изменить порядок элементов
export const reorderItems = (items) => {
  return apiClient.post("/items/reorder", { items });
};

// Добавить новый элемент
export const addNewItem = (id) => {
  return apiClient.post("/items/add", { id });
};

export default {
  getAvailableItems,
  getSelectedItems,
  selectItem,
  deselectItem,
  reorderItems,
  addNewItem,
};
