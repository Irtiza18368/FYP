<template>
    <div v-if="visible" class="toast-notification">
        {{ message }}
    </div>
</template>

<script setup>

import { ref } from 'vue';
const props = defineProps({
    message: String,
});

const visible = ref(true);

setTimeout(() => {
    visible.value = false;
}, 3000);

</script>

<style scoped>
.toast-notification{
    margin-top: 10px;
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(50, 50, 50, 0.85);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    z-index: 2000;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn{
    from {opacity: 0; transform: translateY(-10px);}
    to{opacity: 1; transform: translateY(0);}
}
</style>