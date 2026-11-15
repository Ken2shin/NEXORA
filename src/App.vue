<script setup lang="ts">
import { RouterView } from 'vue-router'
import NexoraToastContainer from '@/shared/components/NexoraToastContainer.vue'
import NexoraConfirmModal from '@/shared/components/NexoraConfirmModal.vue'
</script>

<template>
  <RouterView />
  <NexoraToastContainer />
  <NexoraConfirmModal />
</template>
