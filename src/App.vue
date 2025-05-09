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
    <nav class="global-nav">
      <router-link v-for="item in globalNavItems" :key="item.path" :to="item.path" class="nav-link">
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



// 全局导航配置
const globalNavItems = ref([
  { name: '首页', path: '/' },
  { name: '我们', path: '/album' },
  { name: '可爱圃', path: '/petphotos' },
  { name: '菜谱', path: '/cookmenu' },
  { name: '备忘录', path: '/memorandum' },
  { name: '树洞', path: '/messageboard' },
  { name: '音乐', path: '/music' },

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

.music-player {
  position: fixed;
  bottom: 15px;
  left: 10%;
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
