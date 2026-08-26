# DESIGN SYSTEM & PRODUCT SPECIFICATION — DIREX

## 1. Identidad y Filosofía Visual
- **Misión:** Transformar la complejidad administrativa de la PyME en un plan de acción claro, simple y de un solo vistazo.
- **Tono de Marca:** Institucional, sobrio, analítico y confiable (Corporate Navy & Slate).
- **Anti-Patrones Evitados:** Neones, modo cyberpunk, hype de IA decorativo y gráficos sin contexto.

---

## 2. Sistema de Colores (CSS Tokens)
- **Superficie y Fondo:**
  - `var(--color-bg-base)`: `#f8fafc` (Gris claro de descanso visual).
  - `var(--color-bg-surface)`: `#ffffff` (Tarjetas y tablas limpias).
  - `var(--color-bg-muted)`: `#e2e8f0` (Segmentadores y divisores).
- **Color Institucional:**
  - `var(--color-primary)`: `#0f172a` (Slate Navy profundo para títulos y botones ejecutivos).
  - `var(--color-accent)`: `#2563eb` (Azul de enfoque para enlaces y estados activos).
- **Semántica Financiera:**
  - **Verde Positivo:** `#16a34a` (Cobrado, al día, márgenes saludables).
  - **Ámbar Atención:** `#d97706` (Gastos elevados, presupuestos por vencer).
  - **Rojo Riesgo:** `#dc2626` (Deudas vencidas, mora activa).
  - **Azul Informativo:** `#0284c7` (Pagos a proveedores).

---

## 3. Tipografía y Números Financieros
- **Fuente Principal:** `Plus Jakarta Sans` (400, 500, 600, 700, 800).
- **Números Tabulares:** `JetBrains Mono` con `font-variant-numeric: tabular-nums` para que columnas monetarias alineen a la perfección sin saltos visuales.

---

## 4. Componentes y Patrones de Interacción
- **Slide-over Drawers:** Usados para ver fichas de clientes y ventas rápidamente sin perder el hilo de la pantalla principal.
- **Requiere Atención:** Tarjeta superior con semáforo de prioridad (Alta, Media, Oportunidad) y botón de resolución directa.
- **¿Por qué cambió?:** Explicación contextual de KPIs en lenguaje natural basado en datos reales.
- **Toasts Flotantes:** Confirmación visual inmediata de cada acción (creación, cobro, pago) sin alertas invasivas.
