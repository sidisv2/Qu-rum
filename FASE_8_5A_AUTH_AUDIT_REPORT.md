# REPORTE DE AUDITORÍA REAL DEL FLUJO DE AUTENTICACIÓN — FASE 8.5A (DIREX)

**Fecha:** 27 de Agosto, 2026  
**Proyecto Supabase:** `ychqcwbpzmjpsbowzvpk`  
**Endpoint:** `https://ychqcwbpzmjpsbowzvpk.supabase.co`  
**Dominio Web:** `https://quorum-psi-three.vercel.app`  

---

## 1. Inventario de Código de Autenticación
Los archivos involucrados en la autenticación del cliente son:
- `src/context/AuthContext.tsx`: Proveedor principal con hooks para `signUp`, `signInWithPassword` y `signOut`.
- `src/components/auth/LoginView.tsx`: Formulario de inicio de sesión con email y contraseña.
- `src/components/auth/RegisterView.tsx`: Formulario de registro de nuevas cuentas con email y contraseña.
- `src/components/auth/ForgotPasswordView.tsx`: Solicitud de restablecimiento de contraseña.
- `src/components/auth/RequireAuth.tsx`: Guardia de rutas que redirige al login si no hay sesión.
- `src/components/auth/OrganizationOnboardingView.tsx`: Asistente que se dispara inmediatamente después del primer login si el usuario no tiene organización asignada.

---

## 2. Métodos de Login Implementados en Código vs Configuración Cloud

| Método | Estado en Código | Estado en Supabase Cloud | Diagnóstico |
| :--- | :---: | :---: | :--- |
| **Email + Contraseña** | ✅ Implementado | ✅ Habilitado (HTTP 200) | **Operativo.** El endpoint `/auth/v1/signup` crea usuarios correctamente. |
| **Confirmación de Email** | ✅ Implementado | ⚠️ **Activada en Supabase** | Requiere confirmación de email antes del primer login. Si usa el servidor SMTP por defecto de Supabase, está sujeto a una cuota estricta de 3-4 emails por hora. |
| **Google OAuth** | ❌ No codificado | ❌ No configurado | En la guía de usuario se menciona acceso con Google, pero en el código frontend actual **solo existe Email/Password**. |
| **Magic Links** | ❌ No codificado | ❌ No configurado | No implementado. |
| **Redirect URL** | ✅ Implementado | ⚠️ Configuración requerida | En código apunta a `VITE_AUTH_REDIRECT_URL`. En el panel de Supabase debe coincidir con `https://quorum-psi-three.vercel.app/**`. |

---

## 3. Prueba End-to-End Real en Producción

1. **Creación de Usuario (`/auth/v1/signup`):**
   - **Resultado:** `HTTP 200 OK`.
   - **Respuesta:** El usuario se crea exitosamente con ID único y registra `confirmation_sent_at`.
   - **Comportamiento:** Como la confirmación de email está activa (`email_verified: false`), el usuario **no puede iniciar sesión de inmediato** hasta hacer clic en el enlace recibido por correo.
2. **Onboarding de Organización:**
   - Una vez confirmada la sesión, `RequireAuth` detecta que el usuario no posee filas en `organization_members` y renderiza de forma obligatoria `OrganizationOnboardingView.tsx`.
3. **Persistencia de Sesión:**
   - `supabase.auth.onAuthStateChange` almacena el JWT en el storage del navegador de forma segura.

---

## 4. Lista Concreta de Pendientes Técnicos para Login 100% Sin Fricción

1. **Decisión sobre Confirmación de Email para la Beta:**
   - *Opción recomendada para Beta:* En el panel de Supabase (**Authentication → Providers → Email**), **desactivar temporalmente "Confirm email"** para que los primeros 3 a 5 beta testers puedan ingresar instantáneamente sin sufrir retrasos ni límites de cuota de correo de Supabase.
   - *Opción para Producción Abierta:* Configurar un servidor SMTP personalizado (Resend, SendGrid o AWS SES) en Supabase.
2. **Alineación con Google OAuth:**
   - Dado que el formulario actual solo tiene Email y Contraseña, o bien se agrega el botón de Google OAuth (configurando Google Client ID/Secret en Supabase) o se retira la mención de Google de la guía `BETA_ONBOARDING_GUIDE.md`.

---

## 5. Dictamen Final
### 🟡 **FUNCIONAL CON LIMITACIONES**
*(El flujo de Email/Password funciona en la nube, pero la confirmación de email por defecto de Supabase puede bloquear o demorar el acceso inmediato de los beta testers si no se desactiva "Confirm email" o se configura SMTP propio).*
