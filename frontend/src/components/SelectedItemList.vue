<template>
    <div class="item-list-container">
        <div class="header">
            <h2>{{ title }}</h2>
            <input
                v-model="searchQuery"
                @input="onSearchChange"
                type="text"
                placeholder="Поиск по ID..."
                class="search-input"
            />
        </div>

        <div class="item-list" @scroll="onScroll" ref="listContainer">
            <draggable
                v-model="displayedItems"
                @end="onDragEnd"
                item-key="id"
                handle=".drag-handle"
            >
                <template #item="{ element }">
                    <div class="item" :class="{ 'loading': loadingItems.has(element.id) }">
                        <span class="drag-handle">⋮⋮</span>
                        <span class="item-id">ID: {{ element.id }}</span>
                        <button
                            class="item-action"
                            :disabled="loadingItems.has(element.id)"
                            @click="!loadingItems.has(element.id) && $emit('item-click', element)"
                        >
                            {{ loadingItems.has(element.id) ? 'Перенос...' : actionText }}
                        </button>
                    </div>
                </template>
            </draggable>

            <div v-if="loading" class="loading">Загрузка...</div>
            <div v-if="!hasMore && items.length > 0" class="end">
                Все элементы загружены
            </div>
            <div v-if="items.length === 0 && !loading" class="empty">
                Нет элементов
            </div>
        </div>
    </div>
</template>

<script>
import draggable from "vuedraggable";

export default {
    name: "SelectedItemList",
    components: {
        draggable,
    },
    props: {
        title: String,
        actionText: String,
        fetchFunction: Function,
    },
    emits: ["item-click", "reorder"],
    data() {
        return {
            items: [],
            displayedItems: [],
            page: 1,
            loading: false,
            hasMore: true,
            searchQuery: "",
            searchTimeout: null,
            loadingItems: new Set(), // Элементы в состоянии загрузки
        };
    },
    mounted() {
        this.loadItems();
    },
    methods: {
        async loadItems(reset = false) {
            if (this.loading || (!this.hasMore && !reset)) return;

            this.loading = true;

            try {
                if (reset) {
                    this.page = 1;
                    this.items = [];
                    this.hasMore = true;
                }

                const response = await this.fetchFunction(
                    this.page,
                    20,
                    this.searchQuery,
                );
                const data = response.data;

                if (reset) {
                    this.items = data.items;
                } else {
                    this.items.push(...data.items);
                }

                this.displayedItems = [...this.items];
                this.hasMore = data.hasMore;
                this.page++;
            } catch (error) {
                console.error("Ошибка загрузки:", error);
            } finally {
                this.loading = false;
            }
        },

        onScroll(event) {
            const { scrollTop, scrollHeight, clientHeight } = event.target;

            if (scrollHeight - scrollTop - clientHeight < 100) {
                this.loadItems();
            }
        },

        onSearchChange() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadItems(true);
            }, 300);
        },

        onDragEnd() {
            // Отправляем новый порядок на сервер
            this.$emit("reorder", this.displayedItems);
        },

        refresh() {
            this.loadItems(true);
        },

        // Оптимистичное удаление элемента
        removeItemOptimistic(id) {
            this.items = this.items.filter((item) => item.id !== id);
            this.displayedItems = this.displayedItems.filter(
                (item) => item.id !== id,
            );
        },

        // Оптимистичное добавление элемента
        addItemOptimistic(item) {
            this.items.push(item);
            this.displayedItems.push(item);
        },

        // Установка состояния загрузки для элемента
        setLoadingState(id, isLoading) {
            if (isLoading) {
                this.loadingItems.add(id);
            } else {
                this.loadingItems.delete(id);
            }
        },
    },
};
</script>

<style scoped>
.item-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
}

.header {
    padding: 16px;
    border-bottom: 1px solid #ddd;
}

.header h2 {
    margin: 0 0 12px 0;
    font-size: 20px;
}

.search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.item-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 4px;
    cursor: move;
    transition: all 0.2s;
}

.item:hover {
    background: #f0f0f0;
    border-color: #4caf50;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.drag-handle {
    cursor: grab;
    color: #999;
    font-size: 18px;
    padding: 0 8px;
    user-select: none;
}

.drag-handle:active {
    cursor: grabbing;
}

.item-id {
    flex: 1;
    font-weight: 500;
    margin-left: 8px;
}

.item-action {
    padding: 6px 12px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.item-action:hover {
    background: #da190b;
}

.item.loading {
            opacity: 0.6;
            pointer-events: none;
            background: #e3f2fd;
            border-color: #2196f3;
        }

.item.loading .item-action {
            background: #2196f3;
}

.loading,
.end,
.empty {
    text-align: center;
    padding: 16px;
    color: #999;
}
</style>
