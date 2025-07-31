<!-- src/App.vue -->
<template>
  <div class="app-layout">
    <div class="music-player">
      <button class="play-button" @click="togglePlay">
        <svg v-if="!isPlaying" class="icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M8 5v14l11-7z" />
        </svg>

        <svg v-else class="icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z" />
        </svg>
      </button>

      <div class="track-info">
        <div class="title">{{ currentTrack?.title || 'Loading...' }}</div>
        <div class="artist">{{ currentTrack?.artist }}</div>
      </div>

      <audio ref="audioPlayer" @timeupdate="updateProgress"></audio>

    </div>
    <!-- 固定导航栏 -->
    <nav class="global-nav" v-if="!isMobile">
      <router-link v-for="item in globalNavItems" :key="item.path" :to="item.path" class="nav-link">
        <span class="nav-icon"><img :src="item.icon" alt="" /></span>
        <span class="nav-title-text">{{ item.name }}</span>
      </router-link>
    </nav>
    <!-- 手机端菜单按钮 -->
    <div class="mobile-menu-btn" v-if="isMobile" @click="menuOpen = !menuOpen">
      <svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
    </div>
    <!-- 手机端弹出菜单 -->
    <transition name="fade">
      <div class="mobile-nav-menu" v-if="menuOpen">
        <router-link v-for="item in globalNavItems" :key="item.path" :to="item.path" class="mobile-nav-link" @click.native="menuOpen = false">
          <span class="nav-icon"><img :src="item.icon" alt="" /></span>
          <span class="nav-title-text">{{ item.name }}</span>
        </router-link>
      </div>
    </transition>
    <!-- 页面内容区域 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMusic } from '../src/composables/useMusic.js'
import { supabase } from '../src/supabase/client.js';

const { fetchMusic } = useMusic()
const audioPlayer = ref(null)
const isPlaying = ref(true)
const progress = ref(0)
const songs = ref([])
const currentTrackIndex = ref(0)
const currentTrack = computed(() => songs.value[currentTrackIndex.value])
const menuOpen = ref(false)
const isMobile = ref(window.innerWidth <= 480)
const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 480
  if (!isMobile.value) menuOpen.value = false
}


// 全局导航配置
const globalNavItems = ref([
  { name: '首页', path: '/', icon: require('./assets/icons/home.svg') },
  { name: '我们', path: '/album', icon: require('./assets/icons/照相机.svg') },
  { name: '可爱圃', path: '/petphotos', icon: require('./assets/icons/宠物猫.svg') },
  { name: '菜谱', path: '/cookmenu', icon: require('./assets/icons/吃饭.svg') },
  { name: '备忘录', path: '/memorandum', icon: require('./assets/icons/备忘录.svg') },
  { name: '树洞', path: '/messageboard', icon: require('./assets/icons/情绪树洞.svg') },
  { name: '音乐', path: '/music', icon: require('./assets/icons/音乐.svg') },
])


const loadTrack = async () => {
  try {
    const { data } = await supabase
      .from('music')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
    if (data?.length) {
      const track = data[0]
      songs.value = data

      // 调试输出
      console.log('数据库记录:', track)

      // 生成音频 URL 的正确方式
      const { data: urlData } = supabase.storage
        .from('music') // 必须与实际存储桶名称一致
        .getPublicUrl(track.path)

      console.log('生成的音频 URL:', urlData.publicUrl)

      audioPlayer.value.src = urlData.publicUrl
      audioPlayer.value.autoplay = true
      audioPlayer.value.muted = false // 确保未静音
      console.log(audioPlayer.value);


      const playPromise = audioPlayer.value.play()



      // 处理现代浏览器的自动播放策略
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying.value = true
            console.log('自动播放成功')
          })
          .catch(error => {
            isPlaying.value = false
            console.log('自动播放被阻止:', error)
          })
      }
    }
  } catch (err) {
    console.error('加载失败:', err)
  }
}
// 播放控制
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (!isPlaying.value) {
    audioPlayer.value.play()
  }
  isPlaying.value ? audioPlayer.value.play() : audioPlayer.value.pause()
}
// 进度条更新
const updateProgress = () => {
  const percentage = (audioPlayer.value.currentTime / audioPlayer.value.duration) * 100
  progress.value = percentage || 0
}
// 初始加载
onMounted(async () => {
  await fetchMusic()
  await loadTrack()
  window.addEventListener('resize', updateIsMobile)
})
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
  background: rgba(0, 0, 0, 0);
  /* 初始完全透明 */
  backdrop-filter: blur(0px);
  /* 初始无模糊 */
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
  transform-style: preserve-3d;
  /* 分离图层 */
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
  display: flex;
  align-items: center;
  justify-content: center;
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

@media (max-width: 480px) {
  .global-nav { display: none; }
  .nav-title-text {
    display: none !important;
  }
  .mobile-nav-link .nav-title-text {
    display: none !important;
  }
  .mobile-menu-btn {
    position: fixed;
    top: 0.5em;
    right: 1em;
    z-index: 2000;
    border-radius: 50%;
    padding: 0.4em;
    cursor: pointer;
  }
  .mobile-nav-menu {
    position: fixed;
    top: 0; right: 0; left: 0; bottom: 0;
    background: rgba(0,0,0,0.95);
    z-index: 1999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .mobile-nav-link {
    color: #fff;
    font-size: 1.3em;
    margin: 1em 0;
    display: flex;
    align-items: center;
  }
  .mobile-nav-link .nav-icon img {
    width: 2em;
    height: 2em;
    margin-right: 0.7em;
  }
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  margin-right: 0.5em;
}
.nav-icon img {
  width: 1.5em;
  height: 1.5em;
  display: block;
}

.music-player {
  position: fixed;
  bottom: 15px;
  left: 25%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1001;
}

.play-button {
  background: rgba(74, 194, 246, 0.722);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.play-button:hover {
  transform: scale(1.1);
}

.play-button i {
  color: #333;
  font-size: 16px;
}

.track-info {
  color: white;
  min-width: 80px;
}

.title {
  font-weight: 600;
  font-size: 0.95rem;
}

.artist {
  font-size: 0.8rem;
  opacity: 0.8;
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #ffffff;
  transition: width 0.5s linear;
}

audio {
  display: none;
}

.icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s;
}

/* 播放/暂停状态颜色变化 */
.play-button {
  background: rgb(255, 255, 255);
}
</style>
