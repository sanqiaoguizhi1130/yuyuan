<template>
  <div class="bg">
    <div class="album-container">
      <router-link to="/" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
        </svg>
      </router-link>
      <h1 class="module-title">最好的我们</h1>
      <!-- 简单上传区域 -->
      <div class="simple-upload" @click="$refs.fileInput.click()">
        <span>点击或拖放照片到此处上传</span>
        <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" multiple style="display: none">
      </div>
      <!-- 显示错误信息 -->
      <div v-if="errorMsg" class="error-message">
        {{ errorMsg }}
        <details style="margin-top: 5px; font-size: 0.9em">
          <summary>技术详情</summary>
          <pre style="white-space: pre-wrap">{{ errorDetails }}</pre>
        </details>
      </div>
      <!-- 加载状态 -->
      <div v-if="loading" class="simple-loader">
        <div class="spinner"></div>
      </div>
      <!-- 瀑布流相册 -->
      <div v-else class="waterfall-grid">
        <div v-for="photo in photos" :key="photo.id" class="photo-card" @click="showLightbox(photo)">
          <img :src="photo.url" :alt="photo.title || '相册图片'" loading="lazy">
        </div>
      </div>
      <!-- 简单查看大图 -->
      <div v-if="activePhoto" class="simple-lightbox" @click="activePhoto = null">
        <img :src="activePhoto.url" :alt="activePhoto.title || '相册图片'">
        <button class="delete-btn" @click.stop="deleteCurrentPhoto">🗑️ 删除</button>
      </div>
      <!-- 空状态 -->
      <div v-if="!photos.length && !loading" class="empty-message">
        <p>还没有照片，上传第一张照片吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAlbums } from '../../composables/useAlbums'

const {
  photos,
  loading,
  fetchPhotos,
  savePhoto,
  deletePhoto,
  uploadImage,
  initRealtime
} = useAlbums()

const fileInput = ref(null)
const activePhoto = ref(null)
const errorMsg = ref(null)
const errorDetails = ref(null);

onMounted(async () => {
  try {
    await fetchPhotos()
    initRealtime()
    setupDragAndDrop()
  } catch (err) {
    errorMsg.value = `加载照片失败: ${err.message}`
  }
})

onBeforeUnmount(() => {
  // 清理事件监听
  document.removeEventListener('dragover', preventDefault)
  document.removeEventListener('drop', handleDrop)
})

const setupDragAndDrop = () => {
  document.addEventListener('dragover', preventDefault)
  document.addEventListener('drop', handleDrop)
}

const handleFileChange = async (e) => {

  const files = Array.from(e.target.files)
  if (files.length === 0) return

  try {
    errorMsg.value = null
    for (const file of files) {
      await handleUpload(file)
    }
  } catch (err) {
    errorMsg.value = `上传失败: ${err.message}`
  } finally {
    fileInput.value.value = '' // 重置input
  }
}

const handleDrop = (e) => {
  preventDefault(e)
  const files = Array.from(e.dataTransfer.files)
    .filter(file => file.type.startsWith('image/'))

  if (files.length === 0) {
    errorMsg.value = '请只上传图片文件'
    return
  }

  files.forEach(file => handleUpload(file))
}

const preventDefault = (e) => {
  e.preventDefault()
  e.stopPropagation()
}

const handleUpload = async (file) => {
  try {

    errorDetails.value = null;
    // 1. 检查文件大小（示例：限制5MB）
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('文件大小不能超过5MB')
    }

    // 2. 上传图片
    const uploadResult = await uploadImage(file)
    if (!uploadResult) return

    // 3. 保存到数据库
    const saveResult = await savePhoto({
      url: uploadResult.url,
      path: uploadResult.path,
      title: file.name.replace(/\.[^/.]+$/, "")
    })

    console.log('保存结果:', saveResult)
  } catch (err) {
    errorDetails.value = JSON.stringify({
      time: new Date().toISOString(),
      file: file.name,
      type: file.type,
      size: file.size,
      error: err.stack || err
    }, null, 2);
  }
}

const showLightbox = (photo) => {
  activePhoto.value = photo
}

const deleteCurrentPhoto = async () => {
  if (!activePhoto.value) return

  if (confirm('确定要删除这张照片吗？')) {
    try {
      errorMsg.value = null
      await deletePhoto(activePhoto.value.id)
      activePhoto.value = null
    } catch (err) {
      errorMsg.value = `删除失败: ${err.message}`
    }
  }
}
</script>

<style scoped>
/* 修改部分样式 */
.waterfall-grid {
  column-count: 4;
  column-gap: 15px;
}

.photo-card {
  break-inside: avoid;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  cursor: pointer;
  background: #fff;
}

.photo-card img {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 1200px) {
  .waterfall-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .waterfall-grid {
    column-count: 1;
  }
}

@media (max-width: 480px) {
  .album-container {
    padding: 5px;
  }

  .module-title {
    font-size: 1.2em;
    margin-top: 15px;
  }

  .simple-upload {
    padding: 20px;
    margin-top: 20px;
    font-size: 1em;
  }

  .photo-card {
    border-radius: 5px;
    margin-bottom: 10px;
  }

  .simple-lightbox img {
    max-width: 98vw;
    max-height: 60vh;
  }

  .delete-btn {
    padding: 8px 16px;
    font-size: 1em;
  }

  .back-button {
    left: 8px;
    top: 8px;
    width: 36px;
    height: 36px;
  }

  .waterfall-grid {
    column-count: 1;
    column-gap: 8px;
  }

  .simple-upload {
    font-size: 1em;
  }

  .empty-message {
    padding: 20px;
    font-size: 1em;
  }
}

/* 其他原有样式保持不变 */
.error-message {
  margin: 10px 0;
  padding: 10px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
}

.bg {
  background: linear-gradient(to right, #FFC0CB, #ADD8E6);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.album-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.simple-upload {
  padding: 40px;
  margin-top: 40px;
  margin-bottom: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.05);
  border: 2px dashed #ccc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.simple-upload:hover {
  background: rgba(0, 0, 0, 0.1);
  border-color: #999;
}

.simple-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.simple-lightbox img {
  max-width: 90%;
  max-height: 80vh;
  object-fit: contain;
}

.delete-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.simple-loader {
  text-align: center;
  padding: 50px;
}

.spinner {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4CAF50;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-message {
  text-align: center;
  padding: 50px;
  color: #666;
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
  transform: translateZ(1px);
  /* 创建独立渲染层 */
  will-change: transform;
  /* 优化动画性能 */
  pointer-events: auto;
  /* 确保点击穿透 */
  line-height: 0;
  /* 消除行高导致的间隙 */
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

.module-title {
  text-align: center;
  color: #666;
  margin-top: 30px;
}
</style>
