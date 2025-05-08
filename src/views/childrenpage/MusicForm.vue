<template>
    <div class="bg">
        <router-link to="/" class="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
            </svg>
        </router-link>
        <h1 class="module-title">🎵 那些情歌</h1>
        <div class="music-container">
            <div class="upload-area" @click="$refs.musicInput.click()">
                <span>🎵 点击上传音乐 (MP3, WAV, OGG)</span>
                <input type="file" ref="musicInput" @change="handleFileChange" accept="audio/*" style="display: none">
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <!-- 播放器控件 -->
            <div class="player-controls" v-if="currentSong">
                <button @click="togglePlay" class="play-button">
                    {{ isPlaying ? '⏸️' : '▶️' }}
                </button>
                <div class="song-info">
                    <h3>{{ currentSong.title }}</h3>
                    <p>{{ currentSong.artist }}</p>
                </div>
                <button @click="stop" class="stop-button">⏹️</button>
            </div>

            <!-- 进度条 -->
            <div class="progress-container" v-if="currentSong">
                <input type="range" v-model="progress" max="100" class="progress-bar">
                <span class="time">{{ currentTime }} / {{ duration }}</span>
            </div>

            <!-- 歌曲列表 -->
            <div class="song-list">
                <div v-for="song in songs" :key="song.id"
                    :class="['song-item', { active: currentSong && currentSong.id === song.id }]"
                    @click="playSong(song)">
                    <span class="song-title">{{ song.title }}</span>
                    <span class="song-artist">{{ song.artist }}</span>
                    <span class="song-duration">{{ formatTime(song.duration) }}</span>
                    <div class="song-actions">
                        <button @click.stop="openEditDialog(song)" class="edit-btn">✏️</button>
                        <button @click.stop="deleteSong(song.id)" class="delete-btn">🗑️</button>
                    </div>
                </div>
            </div>

            <!-- 编辑对话框 -->
            <div v-if="showEditDialog" class="dialog-overlay">
                <div class="edit-dialog">
                    <h3>编辑歌曲信息</h3>
                    <form @submit.prevent="saveSongInfo">
                        <div class="form-group">
                            <label>歌曲名称</label>
                            <input v-model="editingSong.title" type="text" required>
                        </div>
                        <div class="form-group">
                            <label>艺术家</label>
                            <input v-model="editingSong.artist" type="text" required>
                        </div>
                        <div class="dialog-buttons">
                            <button type="button" @click="closeEditDialog" class="cancel-btn">取消</button>
                            <button type="submit" class="save-btn">保存</button>
                        </div>
                    </form>
                </div>
            </div>

            <audio ref="audioPlayer" @timeupdate="updateProgress" @ended="onSongEnded"></audio>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useMusic } from '../../composables/useMusic.js'

const {
    songs,
    // loading,
    error,
    currentSong,
    isPlaying,
    fetchMusic,
    updateMusic,
    saveMusic,
    deleteMusic,
    uploadMusic,
    initRealtime
} = useMusic()

const audioPlayer = ref(null)
const musicInput = ref(null)
const progress = ref(0)
const currentTime = ref('0:00')

onBeforeUnmount(() => {
    console.log('组件即将卸载，执行清理操作')
    // 这里可以添加清理逻辑，如取消订阅等
})


// 初始化
onMounted(async () => {
    await fetchMusic()
    initRealtime()
})

const showEditDialog = ref(false)
const editingSong = ref({
    id: null,
    title: '',
    artist: ''
})

// 打开编辑对话框
const openEditDialog = (song) => {
    editingSong.value = {
        id: song.id,
        title: song.title,
        artist: song.artist
    }
    showEditDialog.value = true
}
// 关闭编辑对话框
const closeEditDialog = () => {
    showEditDialog.value = false
}
// 保存编辑后的歌曲信息
const saveSongInfo = async () => {
    try {
        const { id, title, artist } = editingSong.value
        const updatedSong = {
            title,
            artist
        }

        // 调用useMusic中的更新方法
        await updateMusic(id, updatedSong)

        // 如果当前正在播放的是编辑的歌曲，更新当前歌曲信息
        if (currentSong.value && currentSong.value.id === id) {
            currentSong.value = { ...currentSong.value, ...updatedSong }
        }

        closeEditDialog()
    } catch (error) {
        error.value = '更新歌曲信息失败: ' + error.message
    }
}

// 格式化时间显示
const formatTime = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 计算持续时间
const duration = computed(() => {
    return currentSong.value
        ? formatTime(currentSong.value.duration)
        : '0:00'
})

// 处理文件上传
const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
        for (const file of files) {
            // 检查文件类型和大小
            if (!file.type.startsWith('audio/') || file.size > 50 * 1024 * 1024) {
                throw new Error('仅支持音频文件且小于50MB')
            }

            // 上传音乐文件
            const uploadResult = await uploadMusic(file)
            if (!uploadResult) continue

            // 保存到数据库
            await saveMusic({
                title: uploadResult.title,
                artist: uploadResult.artist,
                url: uploadResult.url,
                path: uploadResult.path,
                duration: uploadResult.duration
            })
        }
    } catch (err) {
        error.value = err.message
    } finally {
        musicInput.value.value = ''
    }
}

// 播放歌曲
const playSong = (song) => {
    if (currentSong.value && currentSong.value.id === song.id) {
        togglePlay()
        return
    }

    currentSong.value = song
    audioPlayer.value.src = song.url
    audioPlayer.value.play()
        .then(() => {
            isPlaying.value = true
        })
        .catch(err => {
            error.value = '播放失败: ' + err.message
        })
}

// 切换播放/暂停
const togglePlay = () => {
    if (!currentSong.value) return

    if (isPlaying.value) {
        audioPlayer.value.pause()
    } else {
        audioPlayer.value.play()
    }
    isPlaying.value = !isPlaying.value
}

// 停止播放
const stop = () => {
    audioPlayer.value.pause()
    audioPlayer.value.currentTime = 0
    isPlaying.value = false
}

// 歌曲结束处理
const onSongEnded = () => {
    isPlaying.value = false
}

// 更新进度条
const updateProgress = () => {
    if (!audioPlayer.value) return

    const { currentTime: ct, duration: d } = audioPlayer.value
    if (d) {
        progress.value = (ct / d) * 100
        currentTime.value = formatTime(ct)
    }
}

// 删除歌曲
const deleteSong = async (id) => {
    if (confirm('确定要删除这首歌曲吗？')) {
        const success = await deleteMusic(id)
        if (success && currentSong.value && currentSong.value.id === id) {
            stop()
        }
    }
}
</script>

<style scoped>
.bg {
    min-height: 100vh;
    background: linear-gradient(to right, #FFC0CB, #ADD8E6);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.music-container {
    width: 800px;
    min-height: 80vh;
    margin: 0 auto;
    padding: 20px;
    color: #333;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
}

.upload-area {
    padding: 20px;
    margin: 20px 0;
    text-align: center;
    background: rgba(0, 0, 0, 0.05);
    border: 2px dashed #ccc;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.upload-area:hover {
    background: rgba(0, 0, 0, 0.1);
    border-color: #999;
}

.error-message {
    color: #dc3545;
    padding: 10px;
    margin: 10px 0;
    background: #ffebee;
    border-radius: 4px;
}

.player-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 15px 0;
}

.play-button,
.stop-button {
    font-size: 24px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 15px;
}

.song-info {
    flex: 1;
    padding: 0 15px;
}

.song-info h3 {
    margin: 0;
    font-size: 18px;
}

.song-info p {
    margin: 5px 0 0;
    color: #666;
    font-size: 14px;
}

.progress-container {
    margin: 15px 0;
}

.progress-bar {
    width: 100%;
    margin-bottom: 5px;
}

.time {
    display: block;
    text-align: right;
    font-size: 12px;
    color: #666;
}

.song-list {
    margin-top: 20px;
}

.song-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 10px;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
}

.song-item:hover {
    background: #f0f0f0;
}

.song-item.active {
    background: #e3f2fd;
}

.song-title {
    flex: 2;
    font-weight: 500;
}

.song-artist {
    flex: 1;
    color: #666;
}

.song-duration {
    margin: 0 15px;
    color: #666;
}

.delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #dc3545;
    font-size: 16px;
}

.song-actions {
    display: flex;
    gap: 8px;
}

.edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #4285f4;
    font-size: 16px;
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

.edit-dialog {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    max-width: 90%;
}

.edit-dialog h3 {
    margin-top: 0;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
}

.form-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.save-btn {
    background: #4285f4;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.cancel-btn {
    background: #f1f1f1;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.save-btn:hover {
    background: #3367d6;
}

.cancel-btn:hover {
    background: #ddd;
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
    margin: 30px 0;
    color: #666;
    margin-top: 50px;
}
</style>