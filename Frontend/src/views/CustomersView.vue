<script setup>
import { onMounted, computed } from 'vue'
import { useUsersStore } from '@/stores/users'
const usersStore = useUsersStore()

onMounted(async () => {
  await usersStore.fetchUsers()
})

const users = computed(() => usersStore.users)

</script>


<template>
  <div class="customers-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">Gestion de Clientes</h1>
        <p class="page-subtitle">Administra el equipo de trabajo</p>
      </div>
      <button class="btn btn-primary">
        <span class="material-symbols-outlined">person_add</span>
        Agregar Cliente
      </button>

      <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Total</p>
        <p class="stat-value">0</p>
      </div>
    </div>

    <h1>{{users[0].active}}</h1>

    </div>
  </div>
</template>