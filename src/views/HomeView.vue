<template>
    <div class="gradient-background">
        <div class="container">
            <!-- 循环动态面板 -->
            <div v-for="(panel, index) in panels" :key="index" class="panel" @click="togglePanel(index)"
                :class="{ 'active': activePanel === index }"
                :style="{ 'background-image': 'url(' + panel.image + ')', 'flex': activePanel === index ? '5' : '0.5' }">
                <h3 @click="enterweb(index)">{{ panel.title }}</h3>
            </div>
        </div>
    </div>

</template>

<script>
export default {
    data() {
        return {
            panels: [
                { title: '相册', image: require('../assets/xiangce.jpg') },
                { title: '菜谱', image: require('../assets/菜谱.jpg') },
                { title: '备忘录', image: require('../assets/备忘录.jpg') },
                { title: '音乐', image: require('../assets/音乐.jpg') },
                { title: '未完待续', image: require('../assets/未完待续.jpg') },
            ],
            activePanel: 0
        };
    },
    methods: {
        togglePanel(index) {
            if (this.activePanel === 0) {
                this.activePanel = null;
            }
            else {
                this.activePanel = index;
                return
            }
            if (this.activePanel === 1) {
                this.activePanel = null;
            }
            else {
                this.activePanel = index;
                return
            }
            if (this.activePanel === 2) {
                this.activePanel = null;
            }
            else {
                this.activePanel = index;
                return
            }
            if (this.activePanel === 3) {
                this.activePanel = null;
            }
            else {
                this.activePanel = index;
                return
            }
            if (this.activePanel === 4) {
                this.activePanel = null;
            }
            else {
                this.activePanel = index;
                return
            }
        },
        enterweb(index) {
            if (index === 0) {
                this.$router.push({ path: "/album" });
                return
            }
            if (index === 1) {
                this.$router.push({ path: "/cookmenu" });
                return
            }
            if (index === 2) {
                this.$router.push({ path: "/memorandum" });
                return
            }
            if (index === 3) {
                this.$router.push({ path: "/music" });
                return
            }
        }
    },
    mounted() {
        console.log('SUPABASE_URL:', process.env.VUE_APP_SUPABASE_URL);
        console.log('NODE_ENV:', process.env.NODE_ENV);
    }
};
</script>

<style>
* {
    box-sizing: border-box;
}

body {
    background: linear-gradient(to right, #FFC0CB, #ADD8E6);
}

.gradient-background {
    /* 引入字体 */
    font-family: 'Muli', sans-serif;
    /* 弹性布局 水平 + 垂直居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 100%的窗口高度 */
    height: 100vh;
    /* 溢出隐藏 */
    overflow: hidden;
    margin: 0;
}

.container {
    display: flex;
    width: 90vw;
    align-items: center;
    /* 垂直居中 */
    justify-content: center;
    /* 水平居中 */
}

.panel {
    height: 100vh;
    width: 100%;
    /* 跟封面一样大小 */
    background-size: cover;
    /* 把封面图片居中 */
    background-position: center;
    background-repeat: no-repeat;
    height: 80vh;
    /* 边框圆角 */
    border-radius: 50px;
    color: #fff;
    /* 鼠标放上变小手 */
    cursor: pointer;
    flex: 0.5;
    margin: 10px;
    /* 相对定位 */
    position: relative;
    transition: all 700ms ease-in;
}

.panel h3 {
    font-size: 24px;
    /* 绝对定位 */
    position: absolute;
    bottom: 20px;
    left: 20px;
    margin: 0;
    opacity: 0;
}

.panel.active {
    flex: 5;
}

.panel.active h3 {
    opacity: 1;
    transition: opacity 0.3s ease-in 0.4s;
}

@media (max-width:480px) {
    .container {
        width: 100vw;
    }

    .panel:nth-of-type(4),
    .panel:nth-of-type(5) {
        display: none;
    }
}
</style>