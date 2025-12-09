import { RequestQueue } from "../utils/queue.js";

class ItemService {
  constructor() {
    // Генерируем 1 000 000 элементов
    console.log("Генерация 1 000 000 элементов...");
    this.allItems = [];
    for (let i = 1; i <= 1000000; i++) {
      this.allItems.push({ id: i });
    }
    console.log("✓ Элементы сгенерированы");

    // Хранилище выбранных элементов (с сохранением порядка)
    this.selectedItems = [];
    this.selectedIds = new Set();

    // Очереди с батчингом (строго по ТЗ)
    this.addQueue = new RequestQueue(
      (items) => this.processAddItems(items),
      10000, // 10 секунд - добавление элементов
    );

    this.updateQueue = new RequestQueue(
      (items) => this.processUpdateItems(items),
      1000, // 1 секунда - получение и изменение данных
    );
  }

  // Получить доступные элементы (не выбранные)
  getAvailableItems(page = 1, limit = 20, search = "") {
    let items = this.allItems.filter((item) => !this.selectedIds.has(item.id));

    // Фильтрация по ID
    if (search) {
      items = items.filter((item) => item.id.toString().includes(search));
    }

    // Пагинация
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      hasMore: endIndex < items.length,
    };
  }

  // Получить выбранные элементы
  getSelectedItems(page = 1, limit = 20, search = "") {
    let items = [...this.selectedItems];

    // Фильтрация по ID
    if (search) {
      items = items.filter((item) => item.id.toString().includes(search));
    }

    // Пагинация
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      hasMore: endIndex < items.length,
    };
  }

  // Добавить элемент в выбранные (через очередь)
  selectItem(id) {
    this.updateQueue.add(`select-${id}`, {
      action: "select",
      id: parseInt(id),
    });
  }

  // Удалить элемент из выбранных (через очередь)
  deselectItem(id) {
    this.updateQueue.add(`deselect-${id}`, {
      action: "deselect",
      id: parseInt(id),
    });
  }

  // Изменить порядок выбранных элементов (через очередь)
  reorderItems(items) {
    this.updateQueue.add("reorder", {
      action: "reorder",
      items,
    });
  }

  // Добавить новый элемент (через очередь)
  addNewItem(id) {
    const numId = parseInt(id);

    // Мгновенная проверка - существует ли элемент
    const exists = this.allItems.some((i) => i.id === numId);
    if (exists) {
      throw new Error(`Элемент с ID ${numId} уже существует`);
    }

    this.addQueue.add(`add-${numId}`, {
      id: numId,
    });
  }

  // Обработка добавления новых элементов (батчинг 10 сек)
  processAddItems(items) {
    items.forEach((item) => {
      // Проверяем что ID еще не существует
      const exists = this.allItems.some((i) => i.id === item.id);
      if (!exists) {
        this.allItems.push(item);
        console.log(`✓ Добавлен элемент ID: ${item.id}`);
      }
    });
  }

  // Обработка обновлений (выбор/удаление/сортировка) (батчинг 1 сек)
  processUpdateItems(items) {
    items.forEach((item) => {
      switch (item.action) {
        case "select":
          if (!this.selectedIds.has(item.id)) {
            const element = this.allItems.find((i) => i.id === item.id);
            if (element) {
              this.selectedItems.push(element);
              this.selectedIds.add(item.id);
              console.log(`✓ Выбран элемент ID: ${item.id}`);
            }
          }
          break;

        case "deselect":
          if (this.selectedIds.has(item.id)) {
            this.selectedItems = this.selectedItems.filter(
              (i) => i.id !== item.id,
            );
            this.selectedIds.delete(item.id);
            console.log(`✓ Удален элемент ID: ${item.id}`);
          }
          break;

        case "reorder":
          // Обновляем порядок элементов
          this.selectedItems = item.items;
          console.log("✓ Порядок обновлен");
          break;
      }
    });
  }
}

// Singleton
export const itemService = new ItemService();
