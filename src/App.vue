<!-- src/App.vue -->
<template>
  <div class="app-layout">
    <!-- 固定导航栏 -->
    <nav class="global-nav">
      <router-link 
        v-for="item in globalNavItems" 
        :key="item.path" 
        :to="item.path"
        class="nav-link"
      >
        {{ item.name }}
      </router-link>
    </nav>
    
    <!-- 页面内容区域 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 全局导航配置
const globalNavItems = ref([
  { name: '首页', path: '/' },
  { name: '我们', path: '/album' },
  { name: '可爱圃', path: '/petphotos' },
  { name: '菜谱', path: '/cookmenu' },
  { name: '备忘录', path: '/memorandum' },
  { name: '未完待续', path: '/' },

])
</script>

<style>

body {
  margin: 0;
  overscroll-behavior-y: contain;
  scroll-behavior: smooth;
}
/* 全局布局样式 */
.app-layout {
  min-height: 100vh;
  position: relative;
}

.global-nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  background: rgba(0, 0, 0, 0); /* 初始完全透明 */
  backdrop-filter: blur(0px);  /* 初始无模糊 */
  padding: 0.5rem 3rem;
  display: flex;
  justify-content: flex-end;
  gap: 2rem;
  z-index: 1000;
  /* 滚动驱动动画 */
  animation: nav-scroll-effect linear both;
  animation-timeline: scroll(root);
  animation-range: 0px 200px;
  /* 在已存在的样式基础上增加 */
  transform-style: preserve-3d; /* 分离图层 */
}
@keyframes nav-scroll-effect {
  from {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    padding: 0.5rem 3rem;
  }
  to {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(15px);
    padding: 0.5rem 3rem;
  }
}


.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
  border-radius: 4px;
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.router-link-active {
  color: #fff;
}

.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 2px;
  background: #fff;
  border-radius: 2px;
  text-decoration: none !important;
  background-color: transparent !important;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .global-nav {
    padding: 0.8rem 1rem;
    gap: 1rem;
    justify-content: center;
  }
  
  .nav-link {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
}
</style>
