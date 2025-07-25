<template>
    <div class="bg">
        <div class="album-container"><router-link to="/" class="back-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M20 11H7.414l4.293-4.293-1.414-1.414L3.586 12l6.707 6.707 1.414-1.414L7.414 13H20z" />
                </svg>
            </router-link>
            <h1 class="module-title">那些情歌</h1>
            <div class="music-upload-area" @click="$refs.musicInput.click()">
                <span>点击上传音乐</span>
                <input type="file" ref="musicInput" @change="handleFileChange" accept="audio/*" style="display: none">
            </div>
            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="music-list-card"><div class="player-controls" v-if="currentSong">
                <button @click="togglePlay" class="play-button">
                    {{ isPlaying ? '⏸️' : '▶️' }}
                </button>
                <div class="song-info">
                    <h3>{{ currentSong.title }}</h3>
                    <p>{{ currentSong.artist }}</p>
                </div>
                <button @click="stop" class="stop-button">⏹️</button>
            </div>
            <div class="progress-container" v-if="currentSong">
                <input type="range" v-model="progress" max="100" class="progress-bar">
                <span class="time">{{ currentTime }} / {{ duration }}</span>
            </div>
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
            </div></div>

            
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
    justify-content: flex-start;
}

.album-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.music-upload-card,
.music-list-card {
    width: 1200px;
    max-width: 96vw;
    margin: 40px auto 18px auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    padding: 18px 0;
}

.music-upload-card {
    background: #f9f7f3;
}

.music-list-card {
    background: #fff;
}

.module-title {
    text-align: center;
    color: #666;
    font-weight: 700;
    margin: 30px 0 18px 0;
    letter-spacing: 2px;
}

.music-upload-area {
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

.music-upload-area:hover {
    background: rgba(0, 0, 0, 0.1);
    border-color: #999;
}

.error-message {
    color: #d32f2f;
    background: #fff0f0;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 0 0 8px 0;
    text-align: center;
    font-size: 1em;
}

.player-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: #f8f9fa;
    border-radius: 10px;
    padding: 12px 10px;
    margin: 0 0 6px 0;
}

.play-button,
.stop-button {
    font-size: 1.7em;
    background: none;
    border: none;
    cursor: pointer;
    color: #f8b500;
    padding: 0 10px;
    border-radius: 50%;
    transition: background 0.2s;
}

.play-button:hover,
.stop-button:hover {
    background: #fffbe6;
}

.song-info {
    flex: 1;
    padding: 0 8px;
    text-align: left;
}

.song-info h3 {
    margin: 0;
    font-size: 1.1em;
    color: #333;
    font-weight: 600;
}

.song-info p {
    margin: 2px 0 0 0;
    color: #b48a00;
    font-size: 0.98em;
}

.progress-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px 0;
}

.progress-bar {
    flex: 1;
    height: 5px;
    background: #ffe082;
    border-radius: 3px;
    outline: none;
    accent-color: #f8b500;
}

.time {
    font-size: 0.95em;
    color: #b48a00;
    min-width: 70px;
    text-align: right;
}

.song-list {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.song-item {
    display: flex;
    align-items: center;
    padding: 10px 8px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(248, 181, 0, 0.06);
    cursor: pointer;
    transition: background 0.2s;
    gap: 8px;
}

.song-item.active {
    background: #fffbe6;
}

.song-title {
    flex: 2;
    font-weight: 600;
    color: #f8b500;
    font-size: 1.08em;
}

.song-artist {
    flex: 1;
    color: #b48a00;
    font-size: 1em;
}

.song-duration {
    min-width: 48px;
    color: #b48a00;
    font-size: 0.98em;
}

.song-actions {
    display: flex;
    gap: 6px;
}

.edit-btn,
.delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
    border-radius: 4px;
    padding: 4px 2px;
    transition: background 0.2s;
}

.edit-btn {
    color: #f8b500;
}

.delete-btn {
    color: #d32f2f;
}

.edit-btn:hover {
    background: #fffbe6;
}

.delete-btn:hover {
    background: #ffeaea;
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.edit-dialog {
    background: #fff;
    padding: 18px 12px;
    border-radius: 12px;
    width: 95vw;
    max-width: 380px;
    box-shadow: 0 2px 12px rgba(248, 181, 0, 0.10);
}

.edit-dialog h3 {
    margin-top: 0;
    color: #f8b500;
    font-size: 1.2em;
}

.form-group {
    margin-bottom: 12px;
}

.form-group label {
    display: block;
    margin-bottom: 4px;
    color: #b48a00;
    font-size: 1em;
}

.form-group input {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #ffe082;
    border-radius: 6px;
    font-size: 1em;
}

.dialog-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.save-btn {
    background: #f8b500;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1em;
}

.cancel-btn {
    background: #f1f1f1;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1em;
}

.save-btn:hover {
    background: #f6a700;
}

.cancel-btn:hover {
    background: #ffe082;
}

.back-button {
    position: fixed;
    left: 18px;
    top: 12px;
    color: #fff;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    z-index: 10001;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(248, 181, 0, 0.10);
}

.back-button svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
}

.back-button:hover {
    color: #fffbe6;
    background: #f6a700;
}

@media (max-width: 480px) {
    .album-container {
        padding: 5px;
    }

    .music-upload-card,
    .music-list-card {
        width: 95vw;
        max-width: 99vw;
        padding: 10px 4px;
        border-radius: 8px;
    }

    .music-upload-area {
        padding: 40px;
        font-size: 1em;
        border-radius: 8px;
    }

    .edit-dialog {
        width: 98vw;
        max-width: 98vw;
        min-width: 0;
        border-radius: 10px;
        padding: 10px 2px;
    }

    .module-title {
        font-size: 1.2em;
        margin: 45px 0 0 0;
    }

    .song-list {
        padding: 0 8px;
    }

    .song-item {
        margin-left: 2px;
        margin-right: 2px;
    }
}
</style>