<template>
    <div class="waterfall-gallery">
        <div class="gallery-container">
            <div v-for="(image, index) in images" :key="index" class="gallery-item">
                <img :src="image.src" alt="image" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WaterfallGallery',
    props: {
        images: {
            type: Array,
            required: true
        }
    }
}
</script>

<style>
.waterfall-gallery {
    display: flex;
    justify-content: center;
}

.gallery-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 10px;
    max-height: 100vh;
    /* 设置最大高度 */
    overflow: auto;
    /* 当内容超出容器高度时显示滚动条 */
}

.gallery-item {
    margin-bottom: 10px;
}

img {
    width: 100%;
}
</style>