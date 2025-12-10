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
            <div
                v-for="item in items"
                :key="item.id"
                class="item"
                :class="{ 'loading': loadingItems.has(item.id) }"
                @click="!loadingItems.has(item.id) && $emit('item-click', item)"
            >
                <span class="item-id">ID: {{ item.id }}</span>
                <button class="item-action" :disabled="loadingItems.has(item.id)">
                    {{ loadingItems.has(item.id) ? 'Перенос...' : actionText }}
                </button>
            </div>

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
export default {
    name: "ItemList",
    props: {
        title: String,
        actionText: String,
        fetchFunction: Function,
    },
    emits: ["item-click"],
    data() {
        return {
            items: [],
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

            // Подгружаем когда до конца осталось 100px
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

        refresh() {
            this.loadItems(true);
        },

        // Оптимистичное удаление элемента
        removeItemOptimistic(id) {
            this.items = this.items.filter((item) => item.id !== id);
        },

        // Оптимистичное добавление элемента
        addItemOptimistic(item) {
            this.items.unshift(item);
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
    cursor: pointer;
    transition: all 0.2s;
}

.item:hover {
    background: #f0f0f0;
    border-color: #4caf50;
}

.item-id {
    font-weight: 500;
}

.item-action {
    padding: 6px 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
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
