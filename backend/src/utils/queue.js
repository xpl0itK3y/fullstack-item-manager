// Система очередей с дедупликацией и батчингом

export class RequestQueue {
  constructor(processFn, batchInterval) {
    this.queue = new Map(); // Map для дедупликации по ключу
    this.processFn = processFn;
    this.batchInterval = batchInterval;
    this.timer = null;
  }

  // Добавить запрос в очередь
  add(key, data) {
    // Дедупликация - если ключ существует, перезаписываем
    this.queue.set(key, data);

    // Запускаем таймер если еще не запущен
    if (!this.timer) {
      this.startTimer();
    }
  }

  // Запустить таймер для батчинга
  startTimer() {
    this.timer = setTimeout(() => {
      this.process();
    }, this.batchInterval);
  }

  // Обработать все запросы из очереди
  async process() {
    if (this.queue.size === 0) {
      this.timer = null;
      return;
    }

    // Копируем текущую очередь
    const items = Array.from(this.queue.values());

    // Очищаем очередь
    this.queue.clear();
    this.timer = null;

    // Обрабатываем пакет
    try {
      await this.processFn(items);
    } catch (error) {
      console.error("Ошибка обработки очереди:", error);
    }
  }

  // Получить размер очереди
  size() {
    return this.queue.size;
  }
}
