<!-- MemoRandum.vue -->
<template>
  <div class="bg">
    <div class="memo-container">
    <router-link to="/" class="back-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
      </svg>
    </router-link>
    <div class="memo-header">
      <h1>💌 爱的记忆博物馆</h1>
      <div class="control-panel">
        <button class="add-btn" @click="showForm = true">+ 新记忆</button>
        <div class="filter-group">
          <select v-model="selectedCategory" class="category-select">
            <option value="all">所有类型</option>
            <option v-for="cat in categories" :key="cat">{{ cat }}</option>
          </select>
          <input type="text" v-model="searchQuery" placeholder="搜索记忆..." class="search-input">
        </div>
      </div>
    </div>

    <!-- 新增备忘录表单 -->
    <transition name="form-fade">
      <div v-if="showForm" class="memo-form">
        <h3>{{ editingMemo ? '编辑记忆' : '封存新记忆' }}</h3>
        <div class="form-row">
          <label>记忆类型：</label>
          <select v-model="newMemo.category" required>
            <option v-for="cat in categories" :key="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="form-row">
          <label>重要日期：</label>
          <input type="date" v-model="newMemo.event_date" required>
        </div>
        <div class="form-row">
          <label>记忆标题：</label>
          <input type="text" v-model="newMemo.title" placeholder="请输入标题" required>
        </div>
        <div class="form-row">
          <label>详细信息：</label>
          <textarea v-model="newMemo.content" placeholder="记录那些让你心动的细节..." rows="4"></textarea>
        </div>
        <div class="form-actions">
          <button @click="handleSave" class="save-btn" :disabled="loading">
            {{ loading ? '提交中...' : (editingMemo ? '更新' : '保存') }}
          </button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
      </div>
    </transition>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>正在载入美好回忆...</p>
    </div>

    <!-- 记忆时间轴 -->
    <div v-else-if="filteredMemos.length" class="timeline">
      <div v-for="memo in filteredMemos" :key="memo.id" class="timeline-item"
        :class="{ 'important': memo.is_important }">
        <div class="timeline-marker">
          <div class="marker-icon">
            {{ getCategoryIcon(memo.category) }}
          </div>
          <div class="timeline-date">
            {{ formatDate(memo.event_date) }}
          </div>
        </div>
        <div class="timeline-content">
          <h3 class="memo-title">
            {{ memo.title }}
            <span class="category-tag">{{ memo.category }}</span>
            <button @click="handleStarToggle(memo)" class="star-btn" :class="{ starred: memo.is_important }">
              ⭐
            </button>
          </h3>
          <p class="memo-content">{{ memo.content }}</p>
          <div class="memo-meta">
            <span>创建于：{{ formatDateTime(memo.created_at) }}</span>
            <div class="countdown-badge">
              {{ getDaysUntil(memo.event_date) }}
            </div>
            <button @click="editMemo(memo)" class="edit-btn">编辑</button>
            <button @click="handleDelete(memo.id)" class="delete-btn">删除</button>
          </div>

        </div>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-else class="empty-state">
      <img src="https://cdn-icons-png.flaticon.com/512/3392/3392699.png" alt="空状态" class="empty-icon">
      <p>暂时没有记忆记录，点击右上角添加第一个温馨提醒吧～</p>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// import { useAuth } from '../../composables/useAuth'
import { useMemos } from '../../composables/useMemos'

// const { user } = useAuth()
const {
  memos,
  loading,
  error,
  fetchMemos,
  saveMemo,
  deleteMemo,
  toggleStar,
  initRealtime
} = useMemos()

const showForm = ref(false)
const editingMemo = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('all')
const categories = ['生日', '纪念日', '感动语录', '约定事项', '特殊日子']

const newMemo = ref({
  id: null,
  title: '',
  content: '',
  event_date: '', // 同步为snake_case
  category: '生日',
  is_important: false // 统一命名规范
})

// const minDate = computed(() => new Date().toISOString().split('T')[0])

const filteredMemos = computed(() => {
  return memos.value
    .filter(memo => {
      const matchCategory = selectedCategory.value === 'all' ||
        memo.category === selectedCategory.value
      const matchSearch = memo.title.toLowerCase().includes(
        searchQuery.value.toLowerCase()) ||
        memo.content?.toLowerCase().includes(
          searchQuery.value.toLowerCase())
      return matchCategory && matchSearch
    })
    .sort((a, b) => calculateDaysDifference(a.event_date) - calculateDaysDifference(b.event_date))
})

onMounted(async () => {
  await fetchMemos()
  initRealtime()
})

const handleSave = async () => {
  if (!validateForm()) return
  try {
    // 判断是否为编辑模式
    const payload = newMemo.value
    const success = await saveMemo({
      id: payload.id || undefined, // ✅ 关键：有id为更新，无id为新建
      title: payload.title,
      content: payload.content,
      event_date: payload.event_date,
      category: payload.category,
      is_important: payload.is_important
    })

    if (success) resetForm()
  } catch (e) {
    console.error('保存错误:', e)
  }
}

const handleDelete = async (id) => {
  if (confirm('确定要删除这条记录吗？')) {
    await deleteMemo(id)
  }
}

const calculateDaysDifference = (dateStr) => {
  const today = new Date();
  const targetDate = new Date(dateStr);
  
  const currentYear = today.getFullYear();
  let nextDate = new Date(currentYear, targetDate.getMonth(), targetDate.getDate());
  // 二月29日特殊处理
  if (targetDate.getMonth() === 1 && targetDate.getDate() === 29) {
    if (!isLeapYear(currentYear)) {
      nextDate = new Date(currentYear, 2, 1);
    }
  }
  // 处理跨年
  if (nextDate < today) {
    nextDate.setFullYear(currentYear + 1);
    
    // 再次验证闰年
    if (targetDate.getMonth() === 1 && targetDate.getDate() === 29) {
      if (!isLeapYear(nextDate.getFullYear())) {
        nextDate = new Date(nextDate.getFullYear(), 2, 1);
      }
    }
  }
  // 计算UTC差值（忽略时间部分）
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const nextUTC = Date.UTC(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate()
  );
  return Math.floor((nextUTC - todayUTC) / (1000 * 60 * 60 * 24));
}

const handleStarToggle = async (memo) => {
  await toggleStar(memo.id, memo.is_important)
}

const getDaysUntil = (dateStr) => {
  const diffDays = calculateDaysDifference(dateStr);
  return diffDays === 0 ? '🎉 今天' : `${diffDays}天`;
}

// 闰年判断函数
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}


const editMemo = (memo) => {
  editingMemo.value = memo
  newMemo.value = {
    ...memo,
    // 确保字段准确映射
    event_date: memo.event_date,
    is_important: memo.is_important
  }
  showForm.value = true
}

const resetForm = () => {
  newMemo.value = {
    id: null,
    title: '',
    content: '',
    event_date: '',
    category: '生日',
    is_important: false
  }
  editingMemo.value = null
  showForm.value = false
  error.value = null
}

const cancelEdit = () => resetForm()

const validateForm = () => {
  if (!newMemo.value.title?.trim()) {
    error.value = '标题不能为空'
    return false
  }
  if (!newMemo.value.event_date) {
    error.value = '请选择日期'
    return false
  }
  return true
}

const formatDate = (dateStr) => {
  if (!dateStr) return '无日期'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

const getCategoryIcon = (category) => {
  const icons = {
    '生日': '🎂',
    '纪念日': '📅',
    '感动语录': '💬',
    '约定事项': '🤝',
    '特殊日子': '🌟'
  }
  return icons[category] || '📌'
}
</script>

<style scoped>

.bg {
  min-height: 100vh;
  background: linear-gradient(to right, #FFC0CB, #ADD8E6);
}
.memo-container {
  max-width: 800px;
  margin: auto;
  padding: 1rem;
  font-family: 'Microsoft YaHei', sans-serif;
}

.memo-header {
  display: flex;
  margin-top: 3rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.control-panel {
  display: flex;
  gap: 1rem;
}

.add-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  transition: transform 0.3s;
}

.add-btn:hover {
  transform: scale(1.05);
}

.filter-group {
  display: flex;
  gap: 0.5rem;
}

.category-select,
.search-input {
  padding: 0.8rem;
  border: 2px solid #ffe8e8;
  border-radius: 8px;
  font-size: 1rem;
}

.timeline {
  position: relative;
  padding: 2rem 0;
}

.timeline-item {
  display: flex;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.timeline-item:hover {
  transform: translateX(10px);
}

.timeline-item.important {
  border-left: 4px solid #ff6b6b;
}

.timeline-marker {
  flex-shrink: 0;
  width: 80px;
  text-align: center;
}

.marker-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.timeline-date {
  color: #666;
  font-size: 0.9rem;
}

.timeline-content {
  flex-grow: 1;
  padding-left: 1.5rem;
}

.memo-title {
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-tag {
  background: #ffe8e8;
  color: #ff6b6b;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.memo-content {
  color: #666;
  line-height: 1.6;
  white-space: pre-line;
}

.memo-meta {
  margin-top: 1rem;
  color: #999;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.star-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.3;
}

.star-btn.starred {
  opacity: 1;
  color: #ffd700;
}

/* 表单样式 */
.memo-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-row {
  margin-bottom: 1rem;
}

.form-row label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-row input[type="text"],
.form-row textarea,
.form-row select {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ffe8e8;
  border-radius: 8px;
  font-size: 1rem;
}

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.save-btn {
  background: #ff6b6b;
  color: white;
}

.cancel-btn {
  background: #eee;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.empty-icon {
  width: 100px;
  opacity: 0.3;
  margin-bottom: 1rem;
}

/* 过渡动画 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: all 0.3s ease;
}

.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 768px) {
  .memo-header {
    flex-direction: column;
    gap: 1rem;
  }

  .control-panel {
    width: 100%;
    flex-direction: column;
  }

  .timeline-item {
    flex-direction: column;
  }

  .timeline-marker {
    width: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
}

/* 保持原有的样式不变，仅添加以下补充样式 */
.loading-state {
  text-align: center;
  padding: 2rem;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b6b;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #ff4444;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.countdown-badge {
  background: #ffb86c;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
  margin-left: 1rem;
  animation: pulse 1.5s infinite;
}

.back-button {
  position: fixed;
  left: 20px;
  top: 20px;
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

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.edit-btn,
.delete-btn {
  background: #6cddff;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: 
    background-color 0.3s ease,
    transform 0.2s ease;
  margin-left: 0.5rem;
}

.edit-btn:hover,
.delete-btn:hover {
  background: #3db8ff;
  transform: translateY(-1px);
}

.delete-btn {
  background: #ff6b6b;
}

.delete-btn:hover {
  background: #ff5252;
}

/* 微调按钮在元信息区的排列 */
.memo-meta {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.countdown-badge,
.edit-btn,
.delete-btn {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}


</style>