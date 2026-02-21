import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('../views/DashboardHome.vue') },
      { path: 'alumnos', name: 'alumnos', component: () => import('../views/alumnos/AlumnosList.vue') },
      { path: 'profesores', name: 'profesores', component: () => import('../views/profesores/ProfesoresList.vue') },
      { path: 'materias', name: 'materias', component: () => import('../views/materias/MateriasList.vue') },
      { path: 'carreras', name: 'carreras', component: () => import('../views/carreras/CarrerasList.vue') },

      // --- Módulos de Exámenes (como módulos separados) ---
      { path: 'turnos-examen', name: 'turnos-examen', component: () => import('../views/turnosExamen/TurnosExamenList.vue') },
      { path: 'mesas-examen', name: 'mesas-examen', component: () => import('../views/mesasExamen/MesasExamenList.vue') },
      { path: 'notas-examen', name: 'notas-examen', component: () => import('../views/notasExamen/NotasExamenMesasList.vue') },
      { path: 'notas-examen/:examenId', name: 'notas-examen-edit', component: () => import('../views/notasExamen/NotasExamenEdit.vue') },
      { path: 'actas-examen', name: 'actas-examen', component: () => import('../views/actasExamen/ActasExamenList.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
