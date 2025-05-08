<!-- src/views/Home.vue -->
<template>
    <div class="fullscreen-container">
        <h1 class="center-text">{{ slogan }}</h1>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const slogan = ref('感染他人，取悦自己')
</script>

<style scoped>
.fullscreen-container {
    height: 100vh;
    background:url('@/assets/bg.jpg') center/cover no-repeat;
}

.center-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: clamp(2rem, 5vw, 3.5rem);
    text-align: center;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
    line-height: 1.3;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3),
        2px 2px 6px rgba(0, 0, 0, 0.5),
        4px 4px 16px rgba(0, 0, 0, 0.4),
        -1px -1px 6px rgba(0, 0, 0, 0.3);
    filter: brightness(1.05) contrast(1.2);
    animation: float 3s ease-in-out infinite;
}

@keyframes float {

    0%,
    100% {
        transform: translate(-50%, -50%) translateY(0);
    }

    50% {
        transform: translate(-50%, -50%) translateY(-10px);
    }
}
</style>