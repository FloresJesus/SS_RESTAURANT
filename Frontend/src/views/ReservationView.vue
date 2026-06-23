<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { required, noNumbers, onlyLetters, isPhone, isEmail, min, max } from '@/utils/validators'
import { useFormValidation } from '@/composables/useFormValidation'
import FormField from '@/components/FormField.vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

const form = ref({
  nombre: '',
  telefono: '',
  correo: '',
  fecha: '',
  hora_inicio: '',
  duracion: 120,
  personas: 1,
  notas: ''
})

const durationOptions = [30, 60, 90, 120, 150, 180, 240]

const submitting = ref(false)
const success = ref(false)
const error = ref('')
const assignedTable = ref('')

const today = new Date().toISOString().split('T')[0]
const openHours = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']

const { validateField, touchField, validateAll, getError, resetValidation } = useFormValidation({
  nombre: {
    rules: [required(), noNumbers(), onlyLetters()],
    value: computed(() => form.value.nombre)
  },
  telefono: {
    rules: [required('El telefono es obligatorio'), isPhone()],
    value: computed(() => form.value.telefono)
  },
  correo: {
    rules: [isEmail()],
    value: computed(() => form.value.correo)
  },
  fecha: {
    rules: [required('La fecha es obligatoria')],
    value: computed(() => form.value.fecha)
  },
  hora_inicio: {
    rules: [required('La hora es obligatoria')],
    value: computed(() => form.value.hora_inicio)
  },
  personas: {
    rules: [required(), min(1, 'Minimo 1 persona'), max(20, 'Maximo 20 personas')],
    value: computed(() => form.value.personas)
  }
})

// Menu data
const menuItems = ref([])
const menuCategories = ref([])
const selectedCategory = ref('all')
const menuLoading = ref(true)
const searchQuery = ref('')
const imageErrors = ref(new Set())

const categories = computed(() => {
  return ['all', ...menuCategories.value.map(c => c.nombre)]
})

const filteredItems = computed(() => {
  return menuItems.value.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || item.categoria_nombre === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const groupedItems = computed(() => {
  if (selectedCategory.value !== 'all') {
    return { [selectedCategory.value]: filteredItems.value }
  }
  const groups = {}
  for (const item of filteredItems.value) {
    const cat = item.categoria_nombre || 'Otros'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
})

const formatCurrency = (value) => {
  return `Bs ${Number(value).toFixed(2)}`
}

const loadMenu = async () => {
  menuLoading.value = true
  try {
    const response = await fetch(`${API_BASE}/public/menu`)
    const data = await response.json()
    menuItems.value = data.products.map(item => ({
      id: item.id,
      categoria_id: item.categoria_id,
      categoria_nombre: item.categoria_nombre || 'Sin categoria',
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: Number(item.precio),
      imagen_url: item.imagen_url,
      disponible: Boolean(item.disponible)
    }))
    menuCategories.value = data.categories
  } catch (e) {
    console.error('Error loading menu:', e)
  } finally {
    menuLoading.value = false
  }
}

const onImageError = (id) => {
  imageErrors.value.add(id)
}

const submitReservation = async () => {
  if (!validateAll()) return

  submitting.value = true
  error.value = ''
  success.value = false

  try {
    const buildEnd = (fecha, inicio, dur) => {
      const [h, m] = inicio.split(':').map(Number)
      const d = new Date(`${fecha}T${inicio}`)
      d.setMinutes(d.getMinutes() + dur)
      const pad = (n) => String(n).padStart(2, '0')
      return `${fecha}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const fechaInicio = `${form.value.fecha}T${form.value.hora_inicio}`
    const fechaFin = buildEnd(form.value.fecha, form.value.hora_inicio, form.value.duracion)

    const response = await fetch(`${API_BASE}/public/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.value.nombre.trim(),
        telefono: form.value.telefono.trim(),
        email: form.value.correo.trim() || null,
        mesa_id: null,
        fecha_hora_inicio: fechaInicio,
        fecha_hora_fin: fechaFin,
        cantidad_personas: Number(form.value.personas),
        observaciones: form.value.notas.trim() || null
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.message || 'Error al crear la reservacion'
      return
    }

    success.value = true
    assignedTable.value = data.mesa || ''
    form.value = { nombre: '', telefono: '', correo: '', fecha: '', hora_inicio: '', duracion: 120, personas: 1, notas: '' }
  } catch {
    error.value = 'Error de conexion con el servidor'
  } finally {
    submitting.value = false
  }
}

const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (el) {
    const headerOffset = 80
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// ===== TYPEWRITER EFFECT =====
const taglines = [
  'Sabores autenticos que enamoran',
  'Cocina de autor con ingredientes frescos',
  'Una experiencia gastronomica unica',
  'Tradicion e innovacion en cada plato',
  'El verdadero sabor de El Salvador'
]
const currentTagline = ref('')
const taglineIndex = ref(0)
const charIndex = ref(0)
const isDeleting = ref(false)
const typewriterBlink = ref(true)

let typewriterTimer = null

const runTypewriter = () => {
  const current = taglines[taglineIndex.value]

  if (!isDeleting.value) {
    charIndex.value++
    currentTagline.value = current.substring(0, charIndex.value)
    if (charIndex.value === current.length) {
      isDeleting.value = true
      typewriterTimer = setTimeout(runTypewriter, 2500)
      return
    }
    typewriterTimer = setTimeout(runTypewriter, 60 + Math.random() * 40)
  } else {
    charIndex.value--
    currentTagline.value = current.substring(0, charIndex.value)
    if (charIndex.value === 0) {
      isDeleting.value = false
      taglineIndex.value = (taglineIndex.value + 1) % taglines.length
      typewriterTimer = setTimeout(runTypewriter, 400)
      return
    }
    typewriterTimer = setTimeout(runTypewriter, 30 + Math.random() * 20)
  }
}

// ===== MOUSE PARALLAX =====
const heroMouseX = ref(0)
const heroMouseY = ref(0)
const heroEl = ref(null)

const onHeroMouseMove = (e) => {
  const rect = heroEl.value?.getBoundingClientRect()
  if (!rect) return
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  heroMouseX.value = x * 20
  heroMouseY.value = y * 20
}

// ===== FLOATING ICONS =====
const floatingIcons = [
  { icon: 'local_pizza', x: 10, y: 15, size: 2, duration: 14, delay: 0 },
  { icon: 'tapas', x: 85, y: 20, size: 1.75, duration: 16, delay: 1 },
  { icon: 'lunch_dining', x: 20, y: 70, size: 2.25, duration: 18, delay: 2 },
  { icon: 'local_bar', x: 90, y: 75, size: 2, duration: 15, delay: 0.5 },
  { icon: 'bakery_dining', x: 50, y: 10, size: 1.5, duration: 20, delay: 3 },
  { icon: 'ramen_dining', x: 75, y: 45, size: 1.75, duration: 13, delay: 1.5 },
  { icon: 'icecream', x: 30, y: 40, size: 1.5, duration: 17, delay: 2.5 },
  { icon: 'dinner_dining', x: 5, y: 50, size: 2, duration: 19, delay: 0.8 },
]

// ===== COUNTER ANIMATION =====
const stats = ref([
  { label: 'Anos de Experiencia', value: 15, suffix: '+', current: 0 },
  { label: 'Platillos Exclusivos', value: 80, suffix: '+', current: 0 },
  { label: 'Clientes Felices', value: 5000, suffix: '+', current: 0 },
  { label: 'Premios Obtenidos', value: 12, suffix: '', current: 0 },
])
let counterStarted = false

const animateCounters = () => {
  if (counterStarted) return
  counterStarted = true
  stats.value.forEach((s, i) => {
    const duration = 2000
    const steps = 30
    const increment = s.value / steps
    let step = 0
    const tick = () => {
      step++
      s.current = Math.min(Math.round(increment * step), s.value)
      if (step < steps) setTimeout(tick, duration / steps)
    }
    setTimeout(tick, i * 200)
  })
}

// ===== INTERSECTION OBSERVER =====
const observerRef = ref(null)

const observeElements = () => {
  observerRef.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          if (entry.target.classList.contains('stats-observe')) {
            animateCounters()
          }
          observerRef.value.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('.reveal').forEach(el => {
    observerRef.value.observe(el)
  })
}

// ===== LOADING SPLASH =====
const loading = ref(true)

const hideSplash = () => {
  const el = document.querySelector('.splash-screen')
  if (el) {
    el.classList.add('splash-hidden')
    setTimeout(() => { loading.value = false }, 600)
  } else {
    loading.value = false
  }
}

// ===== SCROLL PROGRESS =====
const scrollPercent = ref(0)

// ===== ACTIVE SECTION =====
const activeSection = ref('')

// ===== NAVBAR =====
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 60

  // Scroll progress
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollPercent.value = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0

  // Active section
  const sections = ['menu', 'reserva']
  for (const id of sections) {
    const el = document.getElementById(id)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top <= 150 && rect.bottom >= 150) {
        activeSection.value = id
        break
      }
    }
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

onMounted(async () => {
  loadMenu()
  window.addEventListener('scroll', handleScroll, { passive: true })
  setTimeout(observeElements, 100)
  setTimeout(runTypewriter, 500)

  // Hide splash after everything loads
  await Promise.all([
    new Promise(resolve => setTimeout(resolve, 1200)),
    document.fonts?.ready || Promise.resolve()
  ])
  hideSplash()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (observerRef.value) observerRef.value.disconnect()
  if (typewriterTimer) clearTimeout(typewriterTimer)
})
</script>

<template>
  <div>
  <!-- Loading Splash -->
  <div v-if="loading" class="splash-screen">
    <div class="splash-content">
      <div class="splash-logo">
        <img src="/logo.png" alt="Restaurante San Salvador" class="splash-logo-img" />
      </div>
      <div class="splash-bar">
        <div class="splash-bar-fill"></div>
      </div>
    </div>
  </div>

  <div class="reservation-page">
    <!-- Scroll Progress Bar -->
    <div class="scroll-progress" :style="{ width: scrollPercent + '%' }"></div>

    <!-- Navbar -->
    <nav :class="['navbar', { 'navbar-scrolled': scrolled }]">
      <div class="navbar-inner">
        <div class="navbar-brand">
          <img src="/logo.png" alt="San Salvador" class="navbar-logo" />
          <span class="navbar-name">San Salvador</span>
        </div>
        <div :class="['navbar-links', { 'navbar-links-open': mobileMenuOpen }]">
          <a
            href="#menu"
            @click.prevent="scrollToSection('menu'); closeMobileMenu()"
            :class="{ 'nav-active': activeSection === 'menu' }"
          >Menu</a>
          <a
            href="#reserva"
            @click.prevent="scrollToSection('reserva'); closeMobileMenu()"
            :class="{ 'nav-active': activeSection === 'reserva' }"
          >Reservas</a>
          <router-link to="/login" class="nav-login-btn">
            <span class="material-symbols-outlined">login</span>
            Sistema
          </router-link>
        </div>
        <!-- Mobile backdrop -->
        <div v-if="mobileMenuOpen" class="mobile-backdrop" @click="closeMobileMenu"></div>
        <button class="navbar-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <span class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <section ref="heroEl" class="hero" @mousemove="onHeroMouseMove">
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>

      <!-- Floating food icons -->
      <div class="hero-floating-icons">
        <span
          v-for="(item, i) in floatingIcons"
          :key="i"
          class="material-symbols-outlined float-icon"
          :style="{
            left: item.x + '%',
            top: item.y + '%',
            fontSize: item.size + 'rem',
            animationDuration: item.duration + 's',
            animationDelay: item.delay + 's',
            '--parallax-x': heroMouseX * (i % 2 === 0 ? 0.3 : -0.3) + 'px',
            '--parallax-y': heroMouseY * (i % 2 === 0 ? -0.3 : 0.3) + 'px',
          }"
        >{{ item.icon }}</span>
      </div>

      <!-- Hero content card -->
      <div class="hero-glass-card">
        <div class="hero-glass-glow"></div>
        <div class="hero-content">
          <div class="hero-logo">
            <img src="/logo.png" alt="Restaurante San Salvador" class="hero-logo-img" />
          </div>
          <h1 class="hero-title">Restaurante San Salvador</h1>

          <!-- Typewriter -->
          <div class="hero-typewriter">
            <p class="hero-subtitle">
              {{ currentTagline }}<span class="typewriter-cursor" :class="{ 'typewriter-blink': typewriterBlink }">|</span>
            </p>
          </div>

          <div class="hero-actions">
            <button @click="scrollToSection('menu')" class="btn btn-glass">
              <span class="material-symbols-outlined">restaurant_menu</span>
              Ver Menu
            </button>
            <button @click="scrollToSection('reserva')" class="btn btn-primary btn-hero">
              <span class="material-symbols-outlined">event</span>
              Reservar Mesa
            </button>
          </div>
        </div>
      </div>

      <!-- Stats bar above wave -->
      <div class="hero-stats-bar">
        <div class="stats-inner">
          <div
            v-for="(stat, i) in stats"
            :key="i"
            class="stat-item"
          >
            <span class="stat-value">{{ stat.current }}{{ stat.suffix }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="hero-wave">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path fill="#f0f4f3" d="M0,50 C320,100 640,0 960,50 C1280,100 1440,50 1440,50 L1440,100 L0,100 Z"/>
        </svg>
      </div>
    </section>

    <!-- Menu Section -->
    <section id="menu" class="section menu-section">
      <div class="section-container">
        <div class="section-header reveal">
          <h2 class="section-title">Nuestro Menu</h2>
          <p class="section-subtitle">Descubre nuestra seleccion de platillos preparados con los ingredientes mas frescos</p>
        </div>

        <!-- Filters -->
        <div class="menu-filters reveal">
          <div class="search-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar platillos..."
              class="search-input"
            />
          </div>
          <div class="category-filters">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="['filter-btn', { 'filter-btn-active': selectedCategory === cat }]"
            >
              {{ cat === 'all' ? 'Todo' : cat }}
            </button>
          </div>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="menuLoading" class="menu-grid">
          <div v-for="n in 8" :key="n" class="skeleton-card" :style="{ animationDelay: `${(n - 1) * 0.08}s` }">
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
              <div class="skeleton-line skeleton-line--title"></div>
              <div class="skeleton-line skeleton-line--desc"></div>
              <div class="skeleton-line skeleton-line--price"></div>
            </div>
          </div>
        </div>

        <!-- Menu Grid -->
        <div v-else-if="filteredItems.length > 0" class="menu-content">
          <div v-for="(items, category) in groupedItems" :key="category" class="menu-group reveal">
            <h3 v-if="selectedCategory === 'all'" class="menu-category-title">{{ category }}</h3>
            <div class="menu-grid">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                :class="['menu-card', 'reveal']"
                :style="{ transitionDelay: `${index * 0.06}s` }"
              >
                <div class="menu-card-image">
                  <img
                    v-if="item.imagen_url && !imageErrors.has(item.id)"
                    :src="item.imagen_url"
                    :alt="item.nombre"
                    class="menu-card-img"
                    loading="lazy"
                    @error="onImageError(item.id)"
                  />
                  <span v-else class="material-symbols-outlined menu-card-placeholder">restaurant</span>
                  <div class="menu-card-price-tag">{{ formatCurrency(item.precio) }}</div>
                </div>
                <div class="menu-card-body">
                  <h4 class="menu-card-title">{{ item.nombre }}</h4>
                  <p class="menu-card-desc">{{ item.descripcion }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="empty-state reveal">
          <span class="material-symbols-outlined empty-icon">search_off</span>
          <p>No encontramos platillos con ese criterio</p>
        </div>
      </div>
    </section>

    <!-- Reservation Section -->
    <section id="reserva" class="section reservation-section">
      <div class="section-container">
        <div class="section-header reveal">
          <h2 class="section-title">Reserva tu Mesa</h2>
          <p class="section-subtitle">Te esperamos para brindarte una experiencia gastronomica inolvidable</p>
        </div>

        <div class="reservation-layout">
          <!-- Info -->
          <div class="reservation-info reveal">
            <div class="info-card">
              <div class="info-item">
                <span class="material-symbols-outlined info-icon">schedule</span>
                <div>
                  <strong>Horarios</strong>
                  <p>Lunes a Domingo<br/>12:00 - 15:00 | 19:00 - 22:00</p>
                </div>
              </div>
              <div class="info-item">
                <span class="material-symbols-outlined info-icon">location_on</span>
                <div>
                  <strong>Ubicacion</strong>
                  <p>San Salvador, El Salvador</p>
                </div>
              </div>
              <div class="info-item">
                <span class="material-symbols-outlined info-icon">phone</span>
                <div>
                  <strong>Contacto</strong>
                  <p>+503 1234-5678</p>
                </div>
              </div>
              <div class="info-item">
                <span class="material-symbols-outlined info-icon">mail</span>
                <div>
                  <strong>Email</strong>
                  <p>contacto@san-salvador.com</p>
                </div>
              </div>
              <div class="info-social">
                <a href="#" class="social-link" title="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" class="social-link" title="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" class="social-link" title="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div class="reservation-form-wrapper reveal">
            <!-- Success State -->
            <div v-if="success" class="success-card">
              <span class="material-symbols-outlined success-icon">check_circle</span>
              <h3 class="success-title">Reservacion Confirmada</h3>
              <p class="success-text">
                Tu reservacion ha sido registrada exitosamente.
                <span v-if="assignedTable">Mesa asignada: <strong>{{ assignedTable }}</strong></span>
              </p>
              <p class="success-detail">Te contactaremos para confirmar los detalles.</p>
              <button @click="success = false" class="btn btn-primary">
                Hacer otra reservacion
              </button>
            </div>

            <!-- Reservation Form -->
            <form v-else @submit.prevent="submitReservation" class="reservation-form">
              <div class="form-section">
                <h3 class="form-section-title">Datos de Contacto</h3>
                <div class="form-row">
                  <FormField
                    v-model="form.nombre"
                    label="Nombre completo"
                    placeholder="Tu nombre"
                    required
                    :error="getError('nombre')"
                    @blur="touchField('nombre')"
                  />
                  <FormField
                    v-model="form.telefono"
                    label="Telefono"
                    type="tel"
                    placeholder="Tu telefono"
                    required
                    :error="getError('telefono')"
                    @blur="touchField('telefono')"
                  />
                </div>
                <FormField
                  v-model="form.correo"
                  label="Correo electronico"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  :error="getError('correo')"
                  @blur="touchField('correo')"
                />
              </div>

              <div class="form-section">
                <h3 class="form-section-title">Detalles de la Reservacion</h3>
                <div class="form-row">
                  <FormField
                    v-model="form.fecha"
                    label="Fecha"
                    type="date"
                    :min="today"
                    required
                    :error="getError('fecha')"
                    @blur="touchField('fecha')"
                  />
                  <FormField
                    v-model="form.hora_inicio"
                    label="Hora"
                    type="select"
                    placeholder="Selecciona un horario"
                    required
                    :error="getError('hora_inicio')"
                    @blur="touchField('hora_inicio')"
                  >
                    <template #options>
                      <option v-for="hour in openHours" :key="hour" :value="hour">{{ hour }}</option>
                    </template>
                  </FormField>
                </div>
                <div class="form-group">
                  <label class="form-label">Duracion estimada</label>
                  <select v-model="form.duracion" class="input">
                    <option v-for="d in durationOptions" :key="d" :value="d">{{ d }} minutos</option>
                  </select>
                </div>
                <FormField
                  v-model.number="form.personas"
                  label="Numero de personas"
                  type="number"
                  min="1"
                  max="20"
                  required
                  :error="getError('personas')"
                  @blur="touchField('personas')"
                />
                <FormField
                  v-model="form.notas"
                  label="Notas adicionales"
                  type="textarea"
                  placeholder="Alergias, celebraciones, preferencias..."
                />
              </div>

              <div v-if="error" class="error-message">
                <span class="material-symbols-outlined">error</span>
                {{ error }}
              </div>

              <button type="submit" :disabled="submitting" class="btn btn-primary btn-lg">
                <span v-if="submitting" class="material-symbols-outlined spinning">progress_activity</span>
                {{ submitting ? 'Procesando...' : 'Confirmar Reservacion' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="/logo.png" alt="San Salvador" class="footer-logo" />
          <span>Restaurante San Salvador</span>
        </div>
        <p class="footer-text">© 2026 Restaurante San Salvador. Todos los derechos reservados.</p>
        <div class="footer-links">
          <router-link to="/login" class="footer-login">
            <span class="material-symbols-outlined">login</span>
            Acceder al sistema
          </router-link>
        </div>
      </div>
    </footer>

    <!-- WhatsApp Floating Button -->
    <a
      href="https://wa.me/50312345678?text=Hola!%20Quisiera%20hacer%20una%20reservacion"
      target="_blank"
      rel="noopener noreferrer"
      class="whatsapp-float"
      title="Contactanos por WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  </div>
  </div>
</template>

<style scoped>
.reservation-page {
  min-height: 100vh;
  background: #f0f4f3;
}

/* ===== Navbar ===== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.75rem 0;
  transition: background 0.3s, box-shadow 0.3s, padding 0.3s;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0.5rem 0;
}

.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  transition: color 0.3s;
}

.navbar-scrolled .navbar-brand {
  color: #00342b;
}

.navbar-logo {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
}

.navbar-brand .material-symbols-outlined {
  font-size: 1.5rem;
}

.navbar-name {
  font-weight: 700;
  font-size: 1.125rem;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.navbar-links a {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
}

.navbar-scrolled .navbar-links a {
  color: #4b5563;
}

.navbar-links a:hover {
  color: white;
}

.navbar-scrolled .navbar-links a:hover {
  color: #00342b;
}

.nav-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.2s;
}

.navbar-scrolled .nav-login-btn {
  background: #00342b;
  color: white !important;
}

.nav-login-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
}

.navbar-scrolled .nav-login-btn:hover {
  background: #004d3f !important;
}

.navbar-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
}

.navbar-scrolled .navbar-toggle {
  color: #00342b;
}

@media (max-width: 640px) {
  .navbar-links {
    position: fixed;
    top: 0;
    right: -100%;
    width: 75%;
    max-width: 300px;
    height: 100vh;
    background: white;
    flex-direction: column;
    padding: 5rem 2rem 2rem;
    gap: 1rem;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    transition: right 0.3s;
    align-items: flex-start;
  }

  .navbar-links-open {
    right: 0;
  }

  .navbar-links a {
    color: #4b5563 !important;
    font-size: 1rem;
  }

  .navbar-links a:hover {
    color: #00342b !important;
  }

  .nav-login-btn {
    background: #00342b !important;
    color: white !important;
    margin-top: 0.5rem;
  }

  .navbar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* ===== Hero ===== */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(0, 52, 43, 0.97) 0%, rgba(0, 77, 63, 0.92) 40%, rgba(7, 39, 33, 0.97) 100%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  z-index: 0;
  animation: bgShift 20s ease-in-out infinite alternate;
}

@keyframes bgShift {
  0% { background-size: auto, 60px 60px; background-position: 0% 0%, 0 0; }
  100% { background-size: auto, 70px 70px; background-position: 100% 100%, 10px 10px; }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(0, 0, 0, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

/* Floating Icons */
.hero-floating-icons {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.float-icon {
  position: absolute;
  color: rgba(255, 255, 255, 0.08);
  animation: floatIcon var(--duration, 15s) ease-in-out infinite;
  transform: translate(var(--parallax-x, 0px), var(--parallax-y, 0px));
  transition: transform 0.1s ease-out;
}

@keyframes floatIcon {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(12px, -18px) rotate(8deg); }
  50% { transform: translate(-8px, -30px) rotate(-5deg); }
  75% { transform: translate(16px, -10px) rotate(6deg); }
}

/* Glass Card */
.hero-glass-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 2rem;
  padding: 3rem 2.5rem;
  max-width: 680px;
  width: 90%;
  margin: 0 auto;
  text-align: center;
  overflow: hidden;
}

.hero-glass-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 2rem;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent 40%, transparent 60%, rgba(255, 255, 255, 0.15));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.hero-glass-glow {
  position: absolute;
  top: -30%;
  left: -20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-logo {
  width: 4.5rem;
  height: 4.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  backdrop-filter: blur(4px);
}

.hero-logo-img {
  width: 2.25rem;
  height: 2.25rem;
  object-fit: contain;
}

.hero-logo .material-symbols-outlined {
  color: white;
  font-size: 2.25rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* Typewriter */
.hero-typewriter {
  min-height: 2.5rem;
  margin-bottom: 2rem;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.typewriter-cursor {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2px;
  animation: cursorBlink 0.8s step-end infinite;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-wave {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  z-index: 2;
}

.hero-wave svg {
  display: block;
  width: 100%;
  height: 100px;
}

/* Stats Bar */
.hero-stats-bar {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 0 1rem;
}

.stats-inner {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow: hidden;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-item {
  padding: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

/* ===== Sections ===== */
.section {
  padding: 5rem 1rem;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #00342b;
  margin: 0 0 0.75rem;
}

.section-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* ===== Scroll Reveal ===== */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ===== Menu Section ===== */
.menu-section {
  background: #f0f4f3;
}

.menu-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .menu-filters {
    flex-direction: row;
    align-items: center;
  }
}

.search-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #00342b;
  box-shadow: 0 0 0 3px rgba(0, 52, 43, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.25rem;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #00342b;
  color: #00342b;
  transform: translateY(-1px);
}

.filter-btn-active {
  background: #00342b;
  border-color: #00342b;
  color: white;
}

.filter-btn-active:hover {
  background: #004d3f;
  color: white;
}

/* ===== Skeleton Loading ===== */
.skeleton-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.skeleton-image {
  aspect-ratio: 16 / 10;
  background: #d1d5db;
}

.skeleton-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 0.75rem;
  background: #d1d5db;
  border-radius: 0.25rem;
}

.skeleton-line--title {
  width: 65%;
  height: 1rem;
}

.skeleton-line--desc {
  width: 90%;
}

.skeleton-line--price {
  width: 30%;
  margin-top: 0.25rem;
}

/* ===== Menu Grid ===== */
.menu-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.menu-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-category-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00342b;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #d1d5db;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .menu-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.menu-card {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.menu-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.menu-card-image {
  position: relative;
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, #e8ede9 0%, #d1d5db 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.menu-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.menu-card:hover .menu-card-img {
  transform: scale(1.08);
}

.menu-card-placeholder {
  font-size: 3rem;
  color: #9ca3af;
}

.menu-card-price-tag {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #00342b;
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.menu-card-body {
  padding: 1rem;
}

.menu-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.375rem;
}

.menu-card-desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

/* ===== Reservation Section ===== */
.reservation-section {
  background: white;
}

.reservation-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 960px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .reservation-layout {
    grid-template-columns: 1fr 1.5fr;
    align-items: start;
  }
}

.reservation-info {
  position: sticky;
  top: 6rem;
}

.info-card {
  background: #f0f4f3;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.info-icon {
  font-size: 1.5rem;
  color: #00342b;
  margin-top: 0.125rem;
}

.info-item strong {
  display: block;
  font-size: 0.875rem;
  color: #00342b;
  margin-bottom: 0.25rem;
}

.info-item p {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.info-social {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #d1d5db;
}

.social-link {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 0.5rem;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
}

.social-link:hover {
  background: #00342b;
  color: white;
  transform: translateY(-2px);
}

.reservation-form-wrapper {
  background: #f0f4f3;
  border-radius: 1rem;
  padding: 1.5rem;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.form-section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #00342b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #d1d5db;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem;
}

@media (min-width: 480px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: #00342b;
  box-shadow: 0 0 0 3px rgba(0, 52, 43, 0.1);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
  font-size: 0.875rem;
}

.success-card {
  text-align: center;
  padding: 2rem 1rem;
}

.success-icon {
  font-size: 3rem;
  color: #059669;
  margin-bottom: 1rem;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00342b;
  margin: 0 0 0.5rem;
}

.success-text {
  font-size: 0.875rem;
  color: #374151;
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.success-detail {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
}

/* ===== Buttons ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn .material-symbols-outlined {
  font-size: 1.125rem;
}

.btn-primary {
  background: #00342b;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #004d3f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 52, 43, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-hero {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.btn-hero:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}

.btn-glass {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-lg {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
}

/* ===== Footer ===== */
.footer {
  background: #00342b;
  padding: 2.5rem 1rem;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.footer-logo {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
}

.footer-brand .material-symbols-outlined {
  font-size: 1.5rem;
}

.footer-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8125rem;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 1rem;
}

.footer-login {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.8125rem;
  transition: color 0.2s;
}

.footer-login:hover {
  color: white;
}

.footer-login .material-symbols-outlined {
  font-size: 1rem;
}

/* ===== WhatsApp Floating Button ===== */
.whatsapp-float {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  background: #25d366;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
  z-index: 50;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: whatsappPulse 2s ease-in-out infinite;
}

.whatsapp-float:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(37, 211, 102, 0.5);
}

@keyframes whatsappPulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4); }
  50% { box-shadow: 0 4px 24px rgba(37, 211, 102, 0.6); }
}

/* ===== Spinning ===== */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== Splash Screen ===== */
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #00342b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.splash-hidden {
  opacity: 0;
  transform: scale(1.05);
  pointer-events: none;
}

.splash-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.splash-logo {
  width: 5rem;
  height: 5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: splashPulse 1.2s ease-in-out infinite;
}

.splash-logo-img {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
}

.splash-logo .material-symbols-outlined {
  color: white;
  font-size: 2.5rem;
}

@keyframes splashPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.8; }
}

.splash-bar {
  width: 120px;
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.splash-bar-fill {
  height: 100%;
  width: 40%;
  background: white;
  border-radius: 2px;
  animation: splashBar 1.2s ease-in-out infinite;
}

@keyframes splashBar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

/* ===== Scroll Progress ===== */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #94d3c1, #00342b);
  z-index: 200;
  transition: width 0.1s linear;
}

/* ===== Mobile Backdrop ===== */
.mobile-backdrop {
  display: none;
}

@media (max-width: 640px) {
  .mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: -1;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

/* ===== Nav Active ===== */
.nav-active {
  position: relative;
}

.nav-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-glass-card {
    padding: 2rem 1.5rem;
    border-radius: 1.5rem;
  }

  .hero-stats-bar {
    bottom: 70px;
  }

  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
  }

  .stat-item {
    padding: 0.75rem 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }
  .hero-subtitle {
    font-size: 0.9375rem;
  }
  .section {
    padding: 3rem 1rem;
  }
  .section-title {
    font-size: 1.5rem;
  }
  .hero-wave svg {
    height: 60px;
  }
}
</style>
