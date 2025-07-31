<template>
  <div class="bg">
    <div class="recipe-app">
    <router-link to="/" class="back-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
      </svg>
    </router-link>
    <div class="header">
      <h1 class="module-title">圆圆今天吃什么</h1>
      <div class="category-filter">
        <button 
          v-for="category in categories" 
          :key="category"
          @click="setCurrentCategory(category)"
          :class="{ 'active': currentCategory === category }"
          class="filter-btn"
        >
          {{ category }}
        </button>
      </div>
      <button class="add-recipe-btn" @click="showAddForm = true">
        + 添加菜谱
      </button>
    </div>

    <div class="dish-grid">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>正在加载菜谱...</p>
      </div>
      <!-- 菜谱列表 -->
      <div v-else-if="filteredRecipes.length > 0" class="dish-list">
        <div v-for="(recipe, index) in filteredRecipes" 
          :key="recipe.id || index"
          class="dish-card"
          @click="selectRecipe(recipe)"
          :class="{ 'active': selectedRecipe?.id === recipe.id }">
          <div class="card-content">
            <h3 class="dish-name">{{ recipe.name }}</h3>
            <div class="dish-tags">
              <span v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="recipe-actions">
              <button @click.stop="editRecipe(recipe)" class="edit-recipe-btn">✏️</button>
              <button @click.stop="deleteRecipeConfirm(recipe)" class="delete-recipe-btn">🗑️</button>
            </div>
          </div>
        </div>
      </div>
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>还没有菜谱，快来添加第一个吧！</p>
      </div>
    </div>

    <!-- 菜谱详情弹窗 -->
    <div v-if="selectedRecipe" class="dialog-overlay recipe-detail-overlay">
      <div class="recipe-detail-dialog">
        <button class="close-btn" @click="selectedRecipe = null">×</button>
        <h2 class="recipe-title">{{ selectedRecipe.name }}</h2>

        <div class="ingredients">
          <h3>📝 材料清单</h3>
          <ul>
            <li v-for="(ingredient, index) in selectedRecipe.ingredients" :key="index">
              {{ ingredient.name }} 
              <span class="quantity">{{ ingredient.quantity }}</span>
            </li>
          </ul>
        </div>

        <div class="steps">
          <h3>👩🍳 制作步骤</h3>
          <div 
            v-for="(step, index) in selectedRecipe.steps" 
            :key="index"
            class="step-item"
          >
            <div class="step-number">步骤 {{ index + 1 }}</div>
            <p class="step-content">{{ step }}</p>
          </div>
        </div>

        <div class="tips" v-if="selectedRecipe.tips">
          <h3>✨ 小贴士</h3>
          <p>{{ selectedRecipe.tips }}</p>
        </div>
      </div>
    </div>

    <!-- 添加菜谱弹窗 -->
    <div v-if="showAddForm" class="dialog-overlay">
      <div class="add-recipe-dialog">
        <h3>添加新菜谱</h3>
        <form @submit.prevent="handleAddRecipe">
          <div class="form-group">
            <label>菜谱名称 *</label>
            <input v-model="newRecipe.name" type="text" required>
          </div>
          <div class="form-group">
            <label>分类 *</label>
            <select v-model="newRecipe.category" required>
              <option value="">请选择分类</option>
              <option v-for="cat in categories.filter(c => c !== '全部')" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>标签</label>
            <input v-model="newRecipe.tagsInput" type="text" placeholder="用逗号分隔，如：下饭菜,快手">
          </div>
          <div class="form-group">
            <label>食材清单</label>
            <div v-for="(ingredient, index) in newRecipe.ingredients" :key="index" class="ingredient-item">
              <input v-model="ingredient.name" placeholder="食材名称" class="ingredient-name">
              <input v-model="ingredient.quantity" placeholder="用量" class="ingredient-quantity">
              <button type="button" @click="removeIngredient(index)" class="remove-btn">×</button>
            </div>
            <button type="button" @click="addIngredient" class="add-ingredient-btn">+ 添加食材</button>
          </div>
          <div class="form-group">
            <label>制作步骤</label>
            <div v-for="(step, index) in newRecipe.steps" :key="index" class="step-item">
              <textarea v-model="newRecipe.steps[index]" :placeholder="`步骤 ${index + 1}`" rows="2"></textarea>
              <button type="button" @click="removeStep(index)" class="remove-btn">×</button>
            </div>
            <button type="button" @click="addStep" class="add-step-btn">+ 添加步骤</button>
          </div>
          <div class="form-group">
            <label>小贴士</label>
            <textarea v-model="newRecipe.tips" rows="3" placeholder="烹饪技巧或注意事项..."></textarea>
          </div>
          <div class="dialog-buttons">
            <button type="button" @click="cancelAdd" class="cancel-btn">取消</button>
            <button type="submit" class="save-btn" :disabled="addingRecipe">
              {{ addingRecipe ? '添加中...' : '保存菜谱' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑菜谱弹窗 -->
    <div v-if="showEditForm" class="dialog-overlay">
      <div class="add-recipe-dialog">
        <h3>编辑菜谱</h3>
        <form @submit.prevent="handleEditRecipe">
          <div class="form-group">
            <label>菜谱名称 *</label>
            <input v-model="editingRecipe.name" type="text" required>
          </div>
          <div class="form-group">
            <label>分类 *</label>
            <select v-model="editingRecipe.category" required>
              <option value="">请选择分类</option>
              <option v-for="cat in categories.filter(c => c !== '全部')" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>标签</label>
            <input v-model="editingRecipe.tagsInput" type="text" placeholder="用逗号分隔，如：下饭菜,快手">
          </div>
          <div class="form-group">
            <label>食材清单</label>
            <div v-for="(ingredient, index) in editingRecipe.ingredients" :key="index" class="ingredient-item">
              <input v-model="ingredient.name" placeholder="食材名称" class="ingredient-name">
              <input v-model="ingredient.quantity" placeholder="用量" class="ingredient-quantity">
              <button type="button" @click="removeEditIngredient(index)" class="remove-btn">×</button>
            </div>
            <button type="button" @click="addEditIngredient" class="add-ingredient-btn">+ 添加食材</button>
          </div>
          <div class="form-group">
            <label>制作步骤</label>
            <div v-for="(step, index) in editingRecipe.steps" :key="index" class="step-item">
              <textarea v-model="editingRecipe.steps[index]" :placeholder="`步骤 ${index + 1}`" rows="2"></textarea>
              <button type="button" @click="removeEditStep(index)" class="remove-btn">×</button>
            </div>
            <button type="button" @click="addEditStep" class="add-step-btn">+ 添加步骤</button>
          </div>
          <div class="form-group">
            <label>小贴士</label>
            <textarea v-model="editingRecipe.tips" rows="3" placeholder="烹饪技巧或注意事项..."></textarea>
          </div>
          <div class="dialog-buttons">
            <button type="button" @click="cancelEdit" class="cancel-btn">取消</button>
            <button type="submit" class="save-btn" :disabled="editingRecipeLoading">
              {{ editingRecipeLoading ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRecipes } from '../../composables/useRecipes.js'

const {
  recipes,
  loading,
  fetchRecipes,
  saveRecipe,
  updateRecipe,
  deleteRecipe,
  initRealtime
} = useRecipes()

const currentCategory = ref('全部')
const categories = ['全部', '家常菜', '快手菜', '硬菜', '主食']
const selectedRecipe = ref(null)

const filteredRecipes = computed(() => {
  if (currentCategory.value === '全部') return recipes.value
  return recipes.value.filter(r => r.category === currentCategory.value)
})

const setCurrentCategory = (category) => {
  currentCategory.value = category
}

const selectRecipe = (recipe) => {
  selectedRecipe.value = recipe
}

const showAddForm = ref(false)
const addingRecipe = ref(false)
const newRecipe = ref({
  name: '',
  category: '',
  tagsInput: '',
  ingredients: [{ name: '', quantity: '' }],
  steps: [''],
  tips: ''
})

const addIngredient = () => {
  newRecipe.value.ingredients.push({ name: '', quantity: '' })
}

const removeIngredient = (index) => {
  newRecipe.value.ingredients.splice(index, 1)
}

const addStep = () => {
  newRecipe.value.steps.push('')
}

const removeStep = (index) => {
  newRecipe.value.steps.splice(index, 1)
}

const handleAddRecipe = async () => {
  try {
    addingRecipe.value = true
    
    // 处理标签
    const tags = newRecipe.value.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 过滤空食材和步骤
    const ingredients = newRecipe.value.ingredients
      .filter(ing => ing.name.trim() && ing.quantity.trim())
      .map(ing => ({ name: ing.name.trim(), quantity: ing.quantity.trim() }))
    
    const steps = newRecipe.value.steps
      .filter(step => step.trim())
      .map(step => step.trim())
    
    const recipeData = {
      name: newRecipe.value.name.trim(),
      category: newRecipe.value.category,
      tags: tags,
      ingredients: ingredients,
      steps: steps,
      tips: newRecipe.value.tips.trim()
    }
    
    const result = await saveRecipe(recipeData)
    if (result) {
      showAddForm.value = false
      resetForm()
    }
  } catch (err) {
    console.error('添加菜谱失败:', err)
  } finally {
    addingRecipe.value = false
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  resetForm()
}

const resetForm = () => {
  newRecipe.value = {
    name: '',
    category: '',
    tagsInput: '',
    ingredients: [{ name: '', quantity: '' }],
    steps: [''],
    tips: ''
  }
}

const showEditForm = ref(false)
const editingRecipeLoading = ref(false)
const editingRecipe = ref({
  id: null,
  name: '',
  category: '',
  tagsInput: '',
  ingredients: [{ name: '', quantity: '' }],
  steps: [''],
  tips: ''
})

const editRecipe = (recipe) => {
  editingRecipe.value = {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    tagsInput: recipe.tags ? recipe.tags.join(', ') : '',
    ingredients: recipe.ingredients ? [...recipe.ingredients] : [{ name: '', quantity: '' }],
    steps: recipe.steps ? [...recipe.steps] : [''],
    tips: recipe.tips || ''
  }
  showEditForm.value = true
}

const addEditIngredient = () => {
  editingRecipe.value.ingredients.push({ name: '', quantity: '' })
}

const removeEditIngredient = (index) => {
  editingRecipe.value.ingredients.splice(index, 1)
}

const addEditStep = () => {
  editingRecipe.value.steps.push('')
}

const removeEditStep = (index) => {
  editingRecipe.value.steps.splice(index, 1)
}

const handleEditRecipe = async () => {
  try {
    editingRecipeLoading.value = true
    
    // 处理标签
    const tags = editingRecipe.value.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 过滤空食材和步骤
    const ingredients = editingRecipe.value.ingredients
      .filter(ing => ing.name.trim() && ing.quantity.trim())
      .map(ing => ({ name: ing.name.trim(), quantity: ing.quantity.trim() }))
    
    const steps = editingRecipe.value.steps
      .filter(step => step.trim())
      .map(step => step.trim())
    
    const recipeData = {
      name: editingRecipe.value.name.trim(),
      category: editingRecipe.value.category,
      tags: tags,
      ingredients: ingredients,
      steps: steps,
      tips: editingRecipe.value.tips.trim()
    }
    
    const result = await updateRecipe(editingRecipe.value.id, recipeData)
    if (result) {
      showEditForm.value = false
      resetEditForm()
    }
  } catch (err) {
    console.error('编辑菜谱失败:', err)
  } finally {
    editingRecipeLoading.value = false
  }
}

const cancelEdit = () => {
  showEditForm.value = false
  resetEditForm()
}

const resetEditForm = () => {
  editingRecipe.value = {
    id: null,
    name: '',
    category: '',
    tagsInput: '',
    ingredients: [{ name: '', quantity: '' }],
    steps: [''],
    tips: ''
  }
}

const deleteRecipeConfirm = (recipe) => {
  if (confirm(`确定要删除"${recipe.name}"吗？`)) {
    deleteRecipe(recipe.id)
  }
}

onMounted(async () => {
  await fetchRecipes()
  initRealtime()
})
</script>

<style scoped>

.bg {
  min-height: 100vh;
  background: linear-gradient(to right, #FFC0CB, #ADD8E6);
}
.recipe-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Microsoft YaHei', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.module-title {
  color: #666;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.2);
}

.category-filter {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 25px;
  background: #ffe8e8;
  color: #ff6b6b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active,
.filter-btn:hover {
  background: #ff6b6b;
  color: white;
  transform: translateY(-2px);
}

.add-recipe-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 15px;
  transition: all 0.3s ease;
}
.add-recipe-btn:hover {
  background: #ff5252;
  transform: translateY(-2px);
}

.dish-grid {
  width: 100%;
}

.dish-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.dish-card {
  width: 335px;
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.dish-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(255,107,107,0.2);
}

.dish-card.active {
  border-color: #ff6b6b;
}

.card-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dish-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.dish-name {
  color: #333;
  margin: 0;
  font-size: 1.25rem;
  flex: 1;
}

.dish-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.tag {
  background: #ffebeb;
  color: #ff6b6b;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.cooking-time {
  color: #666;
  font-size: 0.9rem;
}

.recipe-detail {
  position: fixed;
  top: 0;
  right: 0;
  width: 600px;
  height: 100vh;
  background: white;
  padding: 2rem;
  overflow-y: auto;
  box-shadow: -5px 0 15px rgba(0,0,0,0.1);
}

.close-btn {
  position: absolute;
  right: 1rem;
  top: 3rem;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border: none;
  background: #ffebeb;
  border-radius: 50%;
  cursor: pointer;
  color: #ff6b6b;
}

.recipe-title {
  color: #666;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.recipe-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  color: #666;
}

.meta-item::before {
  content: '•';
  margin-right: 0.5rem;
  color: #ff6b6b;
}

.ingredients, .steps, .tips {
  margin-bottom: 2rem;
}

.ingredients h3, .steps h3, .tips h3 {
  color: #ff6b6b;
  border-bottom: 2px solid #ffebeb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.ingredients li {
  list-style-type: '🥢';
  padding-left: 1rem;
  line-height: 2;
}

.quantity {
  color: #ff6b6b;
  margin-left: 0.5rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fff5f5;
  border-radius: 10px;
}

.step-number {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  font-weight: bold;
}

.recipe-slide-enter-active,
.recipe-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.recipe-slide-enter-from,
.recipe-slide-leave-to {
  transform: translateX(100%);
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

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}
.loader {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b6b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.error-message {
  text-align: center;
  padding: 20px;
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  margin: 20px 0;
}
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.add-recipe-dialog {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 90vw;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}
.add-recipe-dialog h3 {
  margin-top: 0;
  color: #ff6b6b;
  text-align: center;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}
.form-row {
  display: flex;
  gap: 15px;
}
.form-row .form-group {
  flex: 1;
}
.ingredient-item,
.step-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: flex-start;
}
.ingredient-name {
  flex: 2;
}
.ingredient-quantity {
  flex: 1;
}
.remove-btn {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-ingredient-btn,
.add-step-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  margin-top: 5px;
}
.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.save-btn,
.cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
}
.save-btn {
  background: #ff6b6b;
  color: white;
}
.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.cancel-btn {
  background: #f1f1f1;
  color: #333;
}

.recipe-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.edit-recipe-btn,
.delete-recipe-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.edit-recipe-btn {
  color: #4CAF50;
}
.delete-recipe-btn {
  color: #f44336;
}
.edit-recipe-btn:hover {
  background: rgba(76, 175, 80, 0.1);
}
.delete-recipe-btn:hover {
  background: rgba(244, 67, 54, 0.1);
}

.recipe-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.recipe-detail-dialog {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 90vw;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.recipe-detail-dialog .close-btn {
  position: absolute;
  right: 1rem;
  top: 1rem;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border: none;
  background: #ffebeb;
  border-radius: 50%;
  cursor: pointer;
  color: #ff6b6b;
}
.recipe-detail-dialog .recipe-title {
  color: #666;
  font-size: 2rem;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}
.recipe-detail-dialog .recipe-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  color: #666;
}
.recipe-detail-dialog .meta-item::before {
  content: '•';
  margin-right: 0.5rem;
  color: #ff6b6b;
}
.recipe-detail-dialog .ingredients, .recipe-detail-dialog .steps, .recipe-detail-dialog .tips {
  margin-bottom: 2rem;
}
.recipe-detail-dialog .ingredients h3, .recipe-detail-dialog .steps h3, .recipe-detail-dialog .tips h3 {
  color: #ff6b6b;
  border-bottom: 2px solid #ffebeb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.recipe-detail-dialog .ingredients li {
  list-style-type: '🥢';
  padding-left: 1rem;
  line-height: 2;
}
.recipe-detail-dialog .quantity {
  color: #ff6b6b;
  margin-left: 0.5rem;
}
.recipe-detail-dialog .step-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fff5f5;
  border-radius: 10px;
}
.recipe-detail-dialog .step-number {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  font-weight: bold;
}

/* PC端优化 - 确保横向排列 */
@media (min-width: 769px) {
  .dish-list {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }
  
  .dish-card {
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .dish-list {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 0.5rem 0;
  }
  
  .dish-card {
    padding: 1rem;
  }
  
  .category-filter {
    flex-wrap: wrap;
  }
  
  .add-recipe-dialog,
  .recipe-detail-dialog {
    width: 95vw;
    max-width: 95vw;
    padding: 20px;
    margin: 10px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .ingredient-item,
  .step-item {
    flex-direction: column;
    gap: 5px;
  }
  
  .ingredient-name,
  .ingredient-quantity {
    width: 100%;
  }
  
  .dialog-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .save-btn,
  .cancel-btn {
    width: 100%;
  }
  
  .recipe-detail-dialog .recipe-title {
    font-size: 1.5rem;
  }
  
  .recipe-detail-dialog .step-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .recipe-detail-dialog .step-number {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .dish-list {
    grid-template-columns: 1fr;
    gap: 0.8rem;
    padding: 0.3rem 0;
  }
  
  .dish-card {
    padding: 0.8rem;
  }
  
  .card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .recipe-actions {
    margin-top: 10px;
  }
  
  .card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .recipe-actions {
    margin-top: 10px;
  }
  
  .add-recipe-dialog,
  .recipe-detail-dialog {
    width: 98vw;
    max-width: 98vw;
    padding: 15px;
    margin: 5px;
  }
  
  .add-recipe-dialog h3,
  .recipe-detail-dialog .recipe-title {
    font-size: 1.2em;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    font-size: 1em;
    padding: 6px 8px;
  }
  
  .add-ingredient-btn,
  .add-step-btn {
    font-size: 0.9em;
    padding: 6px 10px;
  }
  
  .recipe-detail-dialog .step-item {
    padding: 0.8rem;
  }
  
  .recipe-detail-dialog .step-number {
    width: 35px;
    height: 35px;
    font-size: 0.8rem;
  }
}
</style>
