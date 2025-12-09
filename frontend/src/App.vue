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
                // Оптимистичное обновление - сразу убираем из левого, добавляем в правое
                this.$refs.availableList.removeItemOptimistic(item.id);
                this.$refs.selectedList.addItemOptimistic(item);

                await api.selectItem(item.id);
                this.showMessage("Элемент добавлен", "success");
            } catch (error) {
                // Если ошибка - откатываем изменения
                this.$refs.availableList.refresh();
                this.$refs.selectedList.refresh();
                this.showMessage("Ошибка при добавлении элемента", "error");
            }
        },

        async deselectItem(item) {
            try {
                // Оптимистичное обновление - сразу убираем из правого, добавляем в левое
                this.$refs.selectedList.removeItemOptimistic(item.id);
                this.$refs.availableList.addItemOptimistic(item);

                await api.deselectItem(item.id);
                this.showMessage("Элемент удален", "success");
            } catch (error) {
                // Если ошибка - откатываем изменения
                this.$refs.availableList.refresh();
                this.$refs.selectedList.refresh();
                this.showMessage("Ошибка при удалении элемента", "error");
            }
        },

        async reorderItems(items) {
            try {
                await api.reorderItems(items);
                this.showMessage("Порядок обновлен", "success");
            } catch (error) {
                // Если ошибка - откатываем
                this.$refs.selectedList.refresh();
                this.showMessage("Ошибка при изменении порядка", "error");
            }
        },

        async addNewItem() {
            if (!this.newItemId) {
                this.showMessage("Введите ID элемента", "error");
                return;
            }

            try {
                const response = await api.addNewItem(this.newItemId);
                const itemId = this.newItemId;
                this.newItemId = "";

                // Показываем что элемент в очереди
                this.showMessage(
                    "Элемент добавлен в очередь. Обработка через 10 секунд...",
                    "info",
                );

                // Через 10.5 секунд обновляем список и показываем успех
                setTimeout(() => {
                    this.$refs.availableList.refresh();
                    this.showMessage(
                        `Элемент ID ${itemId} успешно добавлен!`,
                        "success",
                    );
                }, 10500);
            } catch (error) {
                const errorMsg =
                    error.response?.data?.error ||
                    "Ошибка при добавлении элемента";
                this.showMessage(errorMsg, "error");
            }
        },

        showMessage(text, type = "success") {
            this.message = text;
            this.messageType = type;

            // Для info сообщений - дольше показываем
            const duration = type === "info" ? 10000 : 1500;

            setTimeout(() => {
                this.message = "";
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
</style>
