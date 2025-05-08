<template>
  <div class="bg">
    <div class="recipe-app">
    <router-link to="/" class="back-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
      </svg>
    </router-link>
    <div class="header">
      <h1 class="title">圆圆今天吃什么</h1>
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
    </div>

    <div class="dish-grid">
      <div 
        v-for="(recipe, index) in filteredRecipes" 
        :key="index"
        class="dish-card"
        @click="selectRecipe(recipe)"
        :class="{ 'active': selectedRecipe?.name === recipe.name }"
      >
        <div class="card-content">
          <span class="dish-icon">🍲</span>
          <h3 class="dish-name">{{ recipe.name }}</h3>
          <div class="dish-tags">
            <span v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="cooking-time">⏱ {{ recipe.time }}</div>
        </div>
      </div>
    </div>

    <transition name="recipe-slide">
      <div v-if="selectedRecipe" class="recipe-detail">
        <button class="close-btn" @click="selectedRecipe = null">×</button>
        <h2 class="recipe-title">{{ selectedRecipe.name }}</h2>
        
        <div class="recipe-meta">
          <div class="meta-item difficulty">难度：{{ selectedRecipe.difficulty }}</div>
          <div class="meta-item serves">份量：{{ selectedRecipe.serves }}</div>
          <div class="meta-item calories">热量：{{ selectedRecipe.calories }} kcal</div>
        </div>

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
    </transition>
  </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentCategory: '全部',
      categories: ['全部', '家常菜', '快手菜', '硬菜', '主食'],
      recipes: [
        {
          name: '香菜炒牛肉',
          category: '家常菜',
          difficulty: '简单',
          time: '20分钟',
          serves: '2人份',
          calories: 320,
          tags: ['下饭菜', '快手'],
          ingredients: [
            { name: '牛里脊', quantity: '200g' },
            { name: '香菜', quantity: '1把' },
            { name: '小米椒', quantity: '3根' },
            { name: '生抽', quantity: '2勺' },
            { name: '淀粉', quantity: '1勺' }
          ],
          steps: [
            '牛肉逆纹切片，加生抽、淀粉抓匀腌制15分钟',
            '香菜切段，小米椒切圈备用',
            '热锅凉油下牛肉快速翻炒至变色',
            '加入小米椒翻炒出香味',
            '最后放入香菜快速翻炒均匀即可'
          ],
          tips: '牛肉一定要大火快炒才嫩，香菜最后放保持清脆口感'
        },
        {
    name: '重庆鸡公煲',
    category: '硬菜',
    difficulty: '中等',
    time: '45分钟',
    serves: '3-4人',
    calories: 480,
    tags: ['下饭神器', '麻辣鲜香'],
    ingredients: [
      { name: '鸡腿肉', quantity: '800g' },
      { name: '干辣椒', quantity: '15g' },
      { name: '郫县豆瓣酱', quantity: '2大勺' },
      { name: '啤酒', quantity: '330ml' },
      { name: '洋葱', quantity: '1个' },
      { name: '芹菜', quantity: '2根' },
      { name: '秘制酱料', quantity: '生抽2勺+老抽1勺+蚝油1勺+糖1勺' }
    ],
    steps: [
      '鸡腿切块冷水下锅，加料酒焯水后洗净',
      '热油爆香姜蒜，下豆瓣酱炒出红油',
      '加入鸡块翻炒至表皮微焦',
      '倒入啤酒和秘制酱料，大火煮沸转小火焖20分钟',
      '加入配菜继续焖10分钟，最后撒香菜'
    ],
    tips: '加泡面饼吸饱汤汁绝配！吃剩的汤汁拌饭一绝'
  },
  {
    name: '番茄油焖虾',
    category: '快手菜',
    difficulty: '简单',
    time: '15分钟',
    serves: '2人',
    calories: 280,
    tags: ['新手友好', '宴客菜'],
    ingredients: [
      { name: '鲜虾', quantity: '400g' },
      { name: '番茄', quantity: '2个' },
      { name: '番茄酱', quantity: '2勺' },
      { name: '蒜末', quantity: '1勺' },
      { name: '料酒', quantity: '1勺' }
    ],
    steps: [
      '虾去须开背，热油煎至两面金黄取出',
      '爆香蒜末，下番茄丁炒出沙',
      '加番茄酱和半碗水煮成浓汁',
      '放回虾翻炒裹汁，淋料酒焖2分钟',
      '撒葱花出锅'
    ],
    tips: '用虾头熬油更香！最后撒点黑胡椒风味更佳'
  },
  {
    name: '三汁焖锅',
    category: '硬菜',
    difficulty: '中等',
    time: '40分钟',
    serves: '4人',
    calories: 380,
    tags: ['一锅出', '聚会必备'],
    ingredients: [
      { name: '鸡翅中', quantity: '8个' },
      { name: '鱿鱼圈', quantity: '200g' },
      { name: '红薯', quantity: '1个' },
      { name: '青红椒', quantity: '各1个' },
      { name: '秘制酱', quantity: '豆瓣酱2勺+番茄酱2勺+蚝油2勺+蜂蜜1勺+淀粉1勺' }
    ],
    steps: [
      '所有食材切块用料酒和盐腌15分钟',
      '锅底铺洋葱，码入食材',
      '均匀淋上秘制酱，不加水',
      '盖上盖子小火焖25分钟',
      '开盖拌匀撒芝麻'
    ],
    tips: '用铸铁锅效果最佳，中途不要开盖'
  },
  {
    name: '荷包蛋焖面',
    category: '主食',
    difficulty: '简单',
    time: '10分钟',
    serves: '1人',
    calories: 420,
    tags: ['夜宵神器'],
    ingredients: [
      { name: '鸡蛋', quantity: '2个' },
      { name: '挂面', quantity: '1把' },
      { name: '小米椒', quantity: '1根' },
      { name: '调味汁', quantity: '生抽2勺+醋1勺+糖半勺+老抽半勺' }
    ],
    steps: [
      '煎两个焦边荷包蛋备用',
      '用底油爆香蒜末小米椒',
      '加入调味汁和一碗水煮沸',
      '放入面条和荷包蛋焖5分钟',
      '撒葱花出锅'
    ],
    tips: '面条选细面更入味！加两片午餐肉更满足'
  },
      ],
      selectedRecipe: null
    }
  },
  computed: {
    filteredRecipes() {
      if (this.currentCategory === '全部') return this.recipes
      return this.recipes.filter(r => r.category === this.currentCategory)
    }
  },
  methods: {
    setCurrentCategory(category) {
      this.currentCategory = category
    },
    selectRecipe(recipe) {
      this.selectedRecipe = recipe
    }
  }
}
</script>

<style scoped>

.bg {
  height: 100vh;
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

.title {
  color: #ff6b6b;
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

.dish-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.dish-card {
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
  flex-direction: column;
  gap: 0.5rem;
}

.dish-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.dish-name {
  color: #333;
  margin: 0;
  font-size: 1.25rem;
}

.dish-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

.recipe-title {
  color: #ff6b6b;
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

@media (max-width: 768px) {
  .recipe-detail {
    width: 100%;
    position: static;
    height: auto;
    margin-top: 2rem;
  }
  
  .category-filter {
    flex-wrap: wrap;
  }
}
</style>
