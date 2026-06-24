# FitTrack - Elite Training (PWA) 🏋️‍♂️

**FitTrack** es una Aplicación Web Progresiva (PWA) de alto rendimiento diseñada bajo la filosofía **Mobile First**, pensada para atletas que buscan registrar de forma estricta sus rutinas de gimnasio, series, repeticiones y cargas máximas (PR) sin interrupciones. La plataforma está optimizada para funcionar al 100% de manera **offline** en entornos de baja conectividad (como sótanos de gimnasios) mediante un sistema híbrido de persistencia local y sincronización asíncrona en la nube.

---

## 📋 Requisitos del Proyecto Cumplidos

### 1. Requisitos Base (Aprobados)
* **Diseño e Interfaz Atractiva:** Look oscuro premium basado en marcas líderes del sector fitness (`#0a0a0a`), tipografías pesadas, interacciones dinámicas con efectos visuales (`canvas-confetti`) y un diseño responsivo fluido enfocado en smartphones.
* **Manifest de Aplicación Web:** Configurado por completo (`manifest.json`) con íconos maskable (192x192 y 512x512), colores de tema estables y orientación vertical obligatoria para emular una app nativa instalable.
* **Service Worker Eficiente:** Arquitectura asíncrona basada en eventos de ciclo de vida (`install`, `activate`, `fetch`) que asegura la resiliencia de la plataforma.
* **Funcionalidad Principal Multi-Componente:** Desarrollado sobre la API reactiva de **Vue.js 3**, permitiendo crear, estructurar, filtrar por días de la semana, completar, cronometrar, importar/exportar copias de seguridad en formato JSON y auditar Récords Personales (PR).

### 2. Características Avanzadas e Innovadoras (Requisitos Extra)
* **Pantalla de Bienvenida Premium (Onboarding):** Flujo introductorio interactivo con soporte gestual táctil (*swipe*). Ocupa la pantalla completa del móvil ocultando el resto de la interfaz mediante `v-if/v-else` y se guarda en almacenamiento para reproducirse únicamente en la primera visita.
* **Uso Combinado de Varias APIs de Hardware:**
  * **Web Speech API:** Síntesis de voz inteligente para dictado automático de rutinas, cargas y tiempos de descanso para entrenar sin mirar la pantalla.
  * **Vibration API:** Estímulos de hardware hápticos al finalizar con éxito una sesión o un bloque de ejercicios.
  * **Wake Lock API:** Bloqueo del temporizador de pantalla del sistema operativo para mantener el celular encendido durante el entrenamiento.
* **Estrategia de Caché Avanzada:** Implementación híbrida **Cache First** enfocado en los assets estáticos del núcleo del software, y derivación asíncrona a la red ante fallos de conexión.
* **IndexedDB + Sincronización Automática:** Base de datos relacional transaccional local acoplada a un webhook asíncrono con **Google Sheets**.
* **Página de Error Personalizada:** Interfaz dedicada (`offline.html`) ante quiebres totales de navegación sin red.

---

## 🛠️ Arquitectura y Tecnologías Utilizadas

La solución se construyó utilizando tecnologías web nativas para maximizar la velocidad de carga y asegurar su ligereza:

* **Frontend Core:** HTML5, CSS3 Variables, Bootstrap v5.3.3 (UI Components & Grid).
* **Estructura Lógica:** Vue.js v3 (Composition API / CDN reactivo).
* **Base de Datos Local:** LocalStorage (Datos de la interfaz) e IndexedDB (Cola transaccional de sincronización).
* **Nube/Backend:** Google Apps Script (Manejador del motor `doPost` hacia Google Sheets).

---

## 📂 Estructura de Archivos del Proyecto

```plaintext
├── css/
│   └── style.css       # Variables de diseño, Shimmer effects y Onboarding Fullscreen
├── js/
│   ├── app.js          # Instancia central de Vue.js, estados globales y ciclo PWA
│   ├── storage.js      # Capa de persistencia síncrona en LocalStorage
│   ├── api.js          # Orquestador de hardware (Web Speech, Vibration, WakeLock)
│   └── sync.js         # Base de datos IndexedDB y puente fetch asíncrono
├── img/
│   ├── tu-foto-entrenamiento-1.png
│   ├── tu-foto-entrenamiento-2.png
│   └── tu-foto-entrenamiento-3.png
├── icons/
│   ├── favicon-192x192.png
│   └── favicon-512x512.png
├── index.html          # Punto de entrada de la SPA e interfaz reactiva
├── offline.html        # Plantilla fallback para errores de red críticos
├── manifest.json       # Descriptor de metadatos de instalación de la PWA
└── sw.js               # Service Worker, control de precaché y ruteo de peticiones
