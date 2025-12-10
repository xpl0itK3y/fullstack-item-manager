<template>
    <div id="app">
        <header class="app-header">
            <h1>Item Manager</h1>
            <div class="add-item-form">
                <input
                    v-model="newItemId"
                    type="number"
                    placeholder="Введите ID нового элемента"
                    @keyup.enter="addNewItem"
                />
                <button @click="addNewItem">Добавить элемент</button>
            </div>
        </header>

        <div class="container">
            <div class="panel">
                <ItemList
                    ref="availableList"
                    title="Доступные элементы"
                    action-text="Выбрать"
                    :fetch-function="getAvailableItems"
                    @item-click="selectItem"
                />
            </div>

            <div class="panel">
                <SelectedItemList
                    ref="selectedList"
                    title="Выбранные элементы"
                    action-text="Удалить"
                    :fetch-function="getSelectedItems"
                    @item-click="deselectItem"
                    @reorder="reorderItems"
                />
            </div>
        </div>

        <div v-if="message" class="message" :class="messageType">
            {{ message }}
        </div>
    </div>
</template>

<script>
import ItemList from "./components/ItemList.vue";
import SelectedItemList from "./components/SelectedItemList.vue";
import api from "./services/api.js";

export default {
    name: "App",
    components: {
        ItemList,
        SelectedItemList,
    },
    data() {
        return {
            newItemId: "",
            message: "",
            messageType: "success",
            pendingItems: [], // Массив элементов с индивидуальными таймерами
            messageQueue: [], // Очередь уведомлений
            isShowingMessage: false, // Флаг показа уведомления
        };
    },
    mounted() {
        // При загрузке приложения данные автоматически подгружаются
        // Состояние хранится на сервере, поэтому сразу видим актуальные данные
        console.log(
            "✓ Приложение загружено, состояние восстановлено с сервера",
        );
    },
    methods: {
        getAvailableItems(page, limit, search) {
            return api.getAvailableItems(page, limit, search);
        },

        getSelectedItems(page, limit, search) {
            return api.getSelectedItems(page, limit, search);
        },

        async selectItem(item) {
            try {
                // Блокируем элемент на 1 секунду перед переносом
                this.$refs.availableList.setLoadingState(item.id, true);
                
                setTimeout(() => {
                    // Оптимистичное обновление - убираем из левого, добавляем в правое
                    this.$refs.availableList.removeItemOptimistic(item.id);
                    this.$refs.selectedList.addItemOptimistic(item);
                    this.$refs.availableList.setLoadingState(item.id, false);
                }, 1000);

                await api.selectItem(item.id);

                // Обновляем через 1.2 сек (после батчинга 1 сек)
                setTimeout(() => {
                    this.showMessage(`ID ${item.id} добавлен`, "success");
                }, 1200);
            } catch (error) {
                // Если ошибка - откатываем изменения
                this.$refs.availableList.setLoadingState(item.id, false);
                this.$refs.availableList.refresh();
                this.$refs.selectedList.refresh();
                this.showMessage("Ошибка при добавлении", "error");
            }
        },

        async deselectItem(item) {
            try {
                // Блокируем элемент на 1 секунду перед переносом
                this.$refs.selectedList.setLoadingState(item.id, true);
                
                setTimeout(() => {
                    // Оптимистичное обновление - убираем из правого, добавляем в левое
                    this.$refs.selectedList.removeItemOptimistic(item.id);
                    this.$refs.availableList.addItemOptimistic(item);
                    this.$refs.selectedList.setLoadingState(item.id, false);
                }, 1000);

                await api.deselectItem(item.id);

                // Обновляем через 1.2 сек (после батчинга 1 сек)
                setTimeout(() => {
                    this.showMessage(`ID ${item.id} удален`, "success");
                }, 1200);
            } catch (error) {
                // Если ошибка - откатываем изменения
                this.$refs.selectedList.setLoadingState(item.id, false);
                this.$refs.availableList.refresh();
                this.$refs.selectedList.refresh();
                this.showMessage("Ошибка при удалении", "error");
            }
        },

        async reorderItems(items) {
            try {
                await api.reorderItems(items);

                // Обновляем через 1.2 сек (после батчинга 1 сек)
                setTimeout(() => {
                    this.showMessage("Порядок обновлен", "success");
                }, 1200);
            } catch (error) {
                // Если ошибка - откатываем
                this.$refs.selectedList.refresh();
                this.showMessage("Ошибка изменения порядка", "error");
            }
        },

        async addNewItem() {
            if (!this.newItemId) {
                this.showMessage("Введите ID элемента", "error");
                return;
            }

            try {
                const itemId = this.newItemId;
                await api.addNewItem(itemId);
                this.newItemId = "";

                // Добавляем элемент в очередь с текущим временем
                const timestamp = Date.now();
                this.pendingItems.push({ id: itemId, timestamp });

                // Показываем сколько элементов в очереди
                if (this.pendingItems.length === 1) {
                    this.showMessage(
                        `ID ${itemId} добавлен. Ожидание обработки...`,
                        "info",
                    );
                } else {
                    this.showMessage(
                        `ID ${itemId} добавлен. В очереди: ${this.pendingItems.length} элемент(ов)`,
                        "info",
                    );
                }

                // Устанавливаем индивидуальный таймер для этого элемента
                setTimeout(() => {
                    // Удаляем из очереди
                    this.pendingItems = this.pendingItems.filter(
                        (item) => item.id !== itemId,
                    );

                    // Обновляем список
                    this.$refs.availableList.refresh();

                    // Показываем успех для конкретного элемента
                    this.showMessage(
                        `✓ Элемент ID ${itemId} успешно добавлен!`,
                        "success",
                    );
                }, 10500);
            } catch (error) {
                const errorMsg =
                    error.response?.data?.error || "Ошибка добавления";
                this.showMessage(errorMsg, "error");
            }
        },

        showMessage(text, type = "success") {
            // Добавляем в очередь
            this.messageQueue.push({ text, type });

            // Если не показываем сейчас - начинаем показ
            if (!this.isShowingMessage) {
                this.processMessageQueue();
            }
        },

        processMessageQueue() {
            if (this.messageQueue.length === 0) {
                this.isShowingMessage = false;
                return;
            }

            this.isShowingMessage = true;
            const { text, type } = this.messageQueue.shift();

            this.message = text;
            this.messageType = type;

            // Быстрые уведомления
            const duration = type === "info" ? 2000 : 1500;

            setTimeout(() => {
                this.message = "";
                // Показываем следующее через 200мс паузу
                setTimeout(() => {
                    this.processMessageQueue();
                }, 200);
            }, duration);
        },
    },
};
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background: #f5f5f5;
}

#app {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-header {
    background: #4caf50;
    color: white;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
    margin-bottom: 16px;
}

.add-item-form {
    display: flex;
    gap: 8px;
}

.add-item-form input {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
}

.add-item-form button {
    padding: 8px 16px;
    background: white;
    color: #4caf50;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.add-item-form button:hover {
    background: #f0f0f0;
}

.container {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 20px;
    overflow: hidden;
}

.panel {
    height: 100%;
    overflow: hidden;
}

.message {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s;
    z-index: 1000;
}

.message.success {
    background: #4caf50;
}

.message.error {
    background: #f44336;
}

.message.info {
    background: #2196f3;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes pulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
}

.message.info {
    animation:
        slideIn 0.2s,
        pulse 2s infinite;
}
</style>
