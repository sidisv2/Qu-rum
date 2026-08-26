# AUDITORÍA PREVIA — FASE 4C: AUTENTICACIÓN REAL + GESTIÓN DE ORGANIZACIONES

## 1. Arquitectura Actual de Autenticación e Identidad
- **Estado Actual:** En `src/lib/db/orgStore.ts` y `src/context/OrgContext.tsx`, la identidad del usuario está hardcodeada:
  ```typescript
  currentUser: {
    id: "usr-1",
    email: "valentin@direx.app",
    fullName: "Valentín Morales",
    avatarUrl: "...",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
  ```
- **Flujo de Organizaciones:** `OrgContext` carga organizaciones desde `direx_store_v1_current_org_id` en `localStorage` o asume `org-demo-100`.
- **RBAC Actual:** Puramente en frontend mediante `hasPermission(roles)`.

---

## 2. Dependencias y Archivos a Modificar
- **Nuevos Módulos de Autenticación:**
  - `src/context/AuthContext.tsx`: Gestor central de sesión, usuario autenticado, login, signup, logout y password recovery.
  - `src/components/auth/LoginView.tsx`: Formulario de acceso con diseño coherente.
  - `src/components/auth/RegisterView.tsx`: Formulario de registro con validaciones.
  - `src/components/auth/ForgotPasswordView.tsx`: Recuperación de credenciales.
  - `src/components/auth/OrganizationOnboardingView.tsx`: Creación de la primera empresa para usuarios nuevos sin membresía.
  - `src/components/auth/RequireAuth.tsx`: Guard de ruta / vista.
- **Modificaciones en Contextos y Shell:**
  - `src/App.tsx`: Jerarquía `<AuthProvider>` → `<RequireAuth>` → `<OrgProvider>` → `<ToastProvider>` → `<ErrorBoundary>`.
  - `src/context/OrgContext.tsx`: Conexión de `currentUser` y `currentOrg` con la membresía real de Supabase cuando `VITE_DATA_MODE=supabase`.
  - `src/components/layout/Header.tsx`: Soporte para cambio dinámico de organizaciones del usuario y botón de cerrar sesión real.

---

## 3. Estrategia de Compatibilidad y Seguridad
- **Modo Local (`VITE_DATA_MODE=local`):** Continúa utilizando `LocalRepository` y el usuario demo para desarrollo ágil, pruebas unitarias y modo offline.
- **Modo Supabase (`VITE_DATA_MODE=supabase`):** Requiere sesión activa de Supabase Auth. Si faltan credenciales o no hay sesión, muestra pantallas de login/onboarding explícitas sin caer en un fallback silencioso a datos demo.
- **Modelo de Membresía RLS:** Basado en `auth.uid() -> organization_members -> organization_id` directamente en PostgreSQL.
