<!-- MessageBoard.vue -->
<template>
    <div class="bg">
        <div class="message-container">
            <router-link to="/" class="back-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
                </svg>
            </router-link>
            <h1 class="module-title">我想对你说</h1>
            <!-- 留言输入区 -->
            <div class="message-input">
                <textarea v-model="newMessage" placeholder="写下你的心里话..." rows="3" maxlength="180"></textarea>
                <div class="gender-select">
                    <button v-for="opt in genderOptions" :key="opt.value"
                        :class="['gender-btn', { active: selectedGender === opt.value }]"
                        @click="selectedGender = opt.value">
                        {{ opt.label }}
                    </button>
                </div>
                <button class="submit-btn" :disabled="!canSubmit" @click="handleSubmit">
                    {{ loading ? '提交中...' : '发布留言' }}
                </button>
            </div>
            <!-- 错误提示 -->
            <div v-if="error" class="error-message">
                {{ error }}
            </div>
            <!-- 留言列表 -->
            <div class="message-list">
                <div v-for="message in messages" :key="message.id" :class="['message-item', message.gender]">
                    <div v-if="editingId === message.id" class="edit-mode">
                        <textarea v-model="editContent"></textarea>
                        <div class="edit-buttons">
                            <button class="save-btn" @click="saveEdit(message.id)">保存</button>
                            <button class="cancel-btn" @click="cancelEdit">取消</button>
                        </div>
                    </div>
                    <div v-else>
                        <p class="content">{{ message.content }}</p>
                        <div class="meta">
                            <time>{{ formatTime(message.created_at) }}</time>
                            <div class="actions">
                                <button class="edit-btn" @click="startEdit(message)">✎ 编辑</button>
                                <button class="delete-btn" @click="deleteMessage(message.id)">× 删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 加载状态 -->
            <div v-if="loading" class="loading">加载中...</div>
            <!-- 空状态 -->
            <div v-if="!loading && !messages.length" class="empty">
                还没有留言，快来写下第一句吧~
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMessages } from '../../composables/useMessages';
const {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    initRealtime,
    fetchMessages
} = useMessages();
const newMessage = ref('');
const selectedGender = ref(null);
const editingId = ref(null);
const editContent = ref('');
const genderOptions = [
    { value: 'male', label: '👦 男生说' },
    { value: 'female', label: '👧 女生说' }
];
const canSubmit = computed(() => {
    return newMessage.value.trim().length > 0 && selectedGender.value;
});
// 格式化时间
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// 提交留言
const handleSubmit = async () => {
    if (!canSubmit.value) return;

    const result = await sendMessage({
        content: newMessage.value.trim(),
        gender: selectedGender.value
    });
    if (result) {
        newMessage.value = '';
        selectedGender.value = null;
    }
};
// 编辑功能
const startEdit = (message) => {
    editingId.value = message.id;
    editContent.value = message.content;
};
const cancelEdit = () => {
    editingId.value = null;
    editContent.value = '';
};
const saveEdit = async (messageId) => {
    await editMessage(messageId, editContent.value.trim());
    cancelEdit();
};
// 初始化
onMounted(async () => {
    await fetchMessages(); // 新增这行
    initRealtime();
});
</script>

<style scoped>
.bg {
    background: linear-gradient(to right, #FFC0CB, #ADD8E6);
    min-height: 100vh;
}

.message-container {

    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.module-title {
    text-align: center;
    margin: 30px 0;
    color: #666;
}

.message-input {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
}

textarea {
    width: 96.5%;
    padding: 12px;
    border: 2px solid #eee;
    border-radius: 8px;
    resize: vertical;
    margin-bottom: 15px;
}

.gender-select {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.gender-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid #eee;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
}

.gender-btn.active {
    border-color: currentColor;
}

.gender-btn[class*="male"]:hover,
.gender-btn[class*="male"].active {
    color: #2196F3;
    border-color: #2196F3;
    background: #e3f2fd;
}

.gender-btn[class*="female"]:hover,
.gender-btn[class*="female"].active {
    color: #E91E63;
    border-color: #E91E63;
    background: #fce4ec;
}

.submit-btn {
    width: 100%;
    background: #4CAF50;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.message-list {
    margin-top: 30px;
}

.message-item {
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-item.male {
    background: #e3f2fd;
    border-left: 4px solid #2196F3;
}

.message-item.female {
    background: #fce4ec;
    border-left: 4px solid #E91E63;
}

.content {
    margin: 0 0 10px 0;
    line-height: 1.6;
}

.meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
    color: #666;
}

.gender-tag {
    font-weight: bold;
}

.error-message {
    color: #d32f2f;
    background: #ffebee;
    padding: 10px;
    border-radius: 6px;
    margin: 10px 0;
}

.edit-mode {
    padding: 15px;
    background: #fff3e0;
    border-radius: 8px;
    margin-bottom: 10px;
}

.edit-mode textarea {
    width: 100%;
    height: 80px;
    padding: 10px;
    margin-bottom: 10px;
    border: 2px solid #eee;
    border-radius: 6px;
}

.edit-buttons {
    display: flex;
    gap: 10px;
}

.save-btn,
.cancel-btn {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.save-btn {
    background: #4CAF50;
    color: white;
}

.cancel-btn {
    background: #f44336;
    color: white;
}

.actions {
    display: flex;
    gap: 10px;
}

.edit-btn,
.delete-btn {
    padding: 4px 8px;
    border-radius: 4px;
    border: none;
    background: #eee;
    cursor: pointer;
    transition: all 0.2s;
}

.edit-btn:hover {
    background: #2196F3;
    color: white;
}

.delete-btn:hover {
    background: #f44336;
    color: white;
}

.loading,
.empty {
    text-align: center;
    padding: 30px;
    color: #666;
}

@media (max-width: 768px) {
    .message-container {
        padding: 15px;
    }

    .message-input {
        padding: 15px;
    }
}

@media (max-width: 480px) {
  .message-container {
    padding: 5px;
  }
  .module-title {
    font-size: 1.2em;
    margin-top: 35px;
    padding-top: 15px;
  }
  .message-input {
    padding: 8px;
  }
  textarea {
    font-size: 1em;
    padding: 5px
  }
  .gender-btn, .submit-btn {
    font-size: 1em;
    padding: 8px 12px;
  }
  .message-list {
    padding: 0 2px;
  }
  .message-item {
    font-size: 1em;
    padding: 8px 4px;
  }
  .edit-btn, .delete-btn {
    font-size: 1em;
    padding: 4px 8px;
  }
  .back-button {
    left: 8px;
    top: 8px;
    width: 36px;
    height: 36px;
  }
  .loading, .empty {
    padding: 15px;
    font-size: 1em;
  }
}

.back-button {
  position: fixed;
  left: 20px;
  top: 6px;
  color: #ffffff;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  z-index: 10001;
  transform: translateZ(1px); /* 创建独立渲染层 */
  will-change: transform; /* 优化动画性能 */
  pointer-events: auto; /* 确保点击穿透 */
  line-height: 0;   /* 消除行高导致的间隙 */
}

.back-button svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
}

.back-button:hover {
    color: #2196F3;
    transform: translateX(-3px);
}
</style>