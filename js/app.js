if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registrado con éxito', reg.scope))
            .catch(err => console.error('Error al registrar el SW', err));
    });
}

const { createApp, ref, onMounted, computed } = Vue;

createApp({
    setup() {
        // --- Bienvenida ---
        const mostrarBienvenida = ref(!GymStorage.verificarBienvenida());

        const finalizarBienvenida = () => {
            GymStorage.marcarBienvenidaComoVista();
            mostrarBienvenida.value = false;
            GymAPI.hablar("¡Bienvenido a Fit Track! Configura tu rutina para empezar.");
        };

        // --- Estado Reactivo ---
        const ejercicios = ref([]);
        const records = ref({});
        const isOffline = ref(!navigator.onLine);
        const cargando = ref(true);
        
        // Calendario Semanal
        const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const diaSeleccionado = ref('lunes'); 
        
        // Formulario
        const nuevoEj = ref({ nombre: '', tipo: 'fuerza', series: null, reps: null, peso: null, duracionObjetivo: null });
        
        // Temporizador de descanso global
        const tiempoDescanso = ref(0);
        const descansoMinutos = ref(1);   
        const descansoSegundos = ref(30); 
        const timerCorriendo = ref(false);
        let intervaloDescanso = null;

        // Gestión de Modificación de PR
        const ejercicioPrSeleccionado = ref(null);
        const nuevoPrValor = ref(null);

        // Wake Lock API
        const wakeLockActivo = ref(false);
        let wakeLockSentinel = null;

        // 🌟 Estado para la Instalación PWA
        const deferredPrompt = ref(null);
        const mostrarBotonInstalar = ref(false);

        // --- Propiedades Computadas ---
        const ejerciciosFiltrados = computed(() => {
            return ejercicios.value.filter(ej => ej.dia === diaSeleccionado.value);
        });

        const porcentajeProgreso = computed(() => {
            const totalesDelDia = ejerciciosFiltrados.value.length;
            if (totalesDelDia === 0) return 0;
            const completadosDelDia = ejerciciosFiltrados.value.filter(ej => ej.completado).length;
            return Math.round((completadosDelDia / totalesDelDia) * 100);
        });

        // --- Carga Inicial ---
        const cargarDatos = () => {
            ejercicios.value = GymStorage.obtenerEjercicios().map(ej => ({
                ...ej,
                dia: ej.dia || 'lunes', 
                completado: ej.completado || false,
                cronometro: ej.cronometro || 0,
                cronoCorriendo: false,
                intervaloRef: null
            }));
            records.value = GymStorage.obtenerRecords();
            
            const opciones = { weekday: 'long' };
            const diaActualEs = new Intl.DateTimeFormat('es-ES', opciones).format(new Date()).toLowerCase();
            if (diasSemana.includes(diaActualEs)) {
                diaSeleccionado.value = diaActualEs;
            }
        };

        // --- Métodos: Calendario ---
        const cambiarDia = (dia) => {
            ejerciciosFiltrados.value.forEach(ej => {
                if (ej.cronoCorriendo) {
                    clearInterval(ej.intervaloRef);
                    ej.cronoCorriendo = false;
                }
            });
            diaSeleccionado.value = dia;
        };

        // --- Métodos: Ejercicios ---
        const agregarEjercicio = () => {
            const nuevo = {
                id: Date.now(),
                dia: diaSeleccionado.value, 
                nombre: nuevoEj.value.nombre,
                tipo: nuevoEj.value.tipo,
                completado: false,
                series: nuevoEj.value.tipo === 'fuerza' ? nuevoEj.value.series : null,
                reps: nuevoEj.value.tipo === 'fuerza' ? nuevoEj.value.reps : null,
                peso: nuevoEj.value.tipo === 'fuerza' ? nuevoEj.value.peso : null,
                duracionObjetivo: nuevoEj.value.tipo === 'tiempo' ? nuevoEj.value.duracionObjetivo : null,
                cronometro: 0,
                cronoCorriendo: false
            };
    
            ejercicios.value.push(nuevo);
            GymStorage.guardarEjercicios(ejercicios.value);
            
            GymSync.encolarEjercicio(nuevo);
            
            GymAPI.dictarEjercicio(nuevo.nombre, nuevo.tipo, nuevo.series, nuevo.reps, nuevo.peso, nuevo.duracionObjetivo);
            nuevoEj.value = { nombre: '', tipo: nuevoEj.value.tipo, series: null, reps: null, peso: null, duracionObjetivo: null };
        };

        const eliminarEjercicio = (id) => {
            const ej = ejercicios.value.find(e => e.id === id);
            if (ej && ej.intervaloRef) clearInterval(ej.intervaloRef);

            ejercicios.value = ejercicios.value.filter(e => e.id !== id);
            GymStorage.guardarEjercicios(ejercicios.value);
        };

        const completarEjercicio = (ej) => {
            GymStorage.guardarEjercicios(ejercicios.value);
            
            if (ej.completado) {
                if (ej.cronoCorriendo) {
                    clearInterval(ej.intervaloRef);
                    ej.cronoCorriendo = false;
                }

                if ('vibrate' in navigator) {
                    navigator.vibrate(100);
                }

                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: ['#e63920', '#ffffff', '#262626']
                });

                const frasesAliento = [
                    `¡Excelente! Completaste ${ej.nombre}.`,
                    `Buen trabajo, un ejercicio menos.`,
                    `¡Espectacular! Liquidado el ejercicio de ${ej.nombre}.`
                ];
                const fraseAleatoria = frasesAliento[Math.floor(Math.random() * frasesAliento.length)];
                GymAPI.hablar(fraseAleatoria);
            }
        };

        // --- Métodos: Cronómetros ---
        const controlarCronometro = (ej) => {
            if (ej.cronoCorriendo) {
                clearInterval(ej.intervaloRef);
                ej.cronoCorriendo = false;
            } else {
                ej.cronoCorriendo = true;
                ej.intervaloRef = setInterval(() => {
                    ej.cronometro++;
                    if (ej.cronometro === ej.duracionObjetivo) {
                        GymAPI.hablar(`¡Objetivo cumplido para ${ej.nombre}! Buen esfuerzo.`);
                    }
                }, 1000);
            }
        };

        const reiniciarCronometro = (ej) => {
            clearInterval(ej.intervaloRef);
            ej.cronometro = 0;
            ej.cronoCorriendo = false;
        };

        // --- Métodos: PR ---
        const abrirModificarPR = (ej) => {
            ejercicioPrSeleccionado.value = ejercicioPrSeleccionado.value === ej.id ? null : ej.id;
            nuevoPrValor.value = records.value[ej.nombre.toLowerCase()] || ej.peso;
        };

        const guardarNuevoPR = (ej) => {
            if (!nuevoPrValor.value) return;
            const nombreNormalizado = ej.nombre.toLowerCase();
            records.value[nombreNormalizado] = nuevoPrValor.value;
            GymStorage.guardarRecords(records.value);
            GymAPI.hablar(`Felicidades, registraste un nuevo récord personal de ${nuevoPrValor.value} kilos en ${ej.nombre}.`);
            ejercicioPrSeleccionado.value = null;
        };

        // --- Métodos: Temporizador de Descanso ---
        const iniciarDescansoReloj = () => {
            const minutesEnSegundos = (descansoMinutos.value || 0) * 60;
            const segundosPuros = descansoSegundos.value || 0;
            const totalSegundos = minutesEnSegundos + segundosPuros;

            if (totalSegundos < 5) {
                GymAPI.hablar("Por favor, establece un tiempo de descanso mayor a cinco segundos.");
                return;
            }

            if (intervaloDescanso) clearInterval(intervaloDescanso);
            tiempoDescanso.value = totalSegundos;
            timerCorriendo.value = true;

            intervaloDescanso = setInterval(() => {
                tiempoDescanso.value--;
                if (tiempoDescanso.value <= 0) {
                    clearInterval(intervaloDescanso);
                    timerCorriendo.value = false;
                    if ('vibrate' in navigator) navigator.vibrate(500);
                    GymAPI.hablar("¡Tiempo de descanso agotado!... Volvé a entrenar.");
                }
            }, 1000);
        };

        const cancelarDescanso = () => {
            clearInterval(intervaloDescanso);
            tiempoDescanso.value = 0;
            timerCorriendo.value = false;
        };

        const formatearTiempo = (segundos) => {
            const mins = Math.floor(segundos / 60);
            const secs = segundos % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // --- Wake Lock API ---
        const alternarWakeLock = async () => {
            if (!('wakeLock' in navigator)) {
                GymAPI.hablar("Tu navegador no soporta el bloqueo de suspensión de pantalla.");
                return;
            }
            try {
                if (!wakeLockActivo.value) {
                    wakeLockSentinel = await navigator.wakeLock.request('screen');
                    wakeLockActivo.value = true;
                    GymAPI.hablar("Modo entrenamiento encendido.");
                    wakeLockSentinel.addEventListener('release', () => { wakeLockActivo.value = false; });
                } else {
                    await wakeLockSentinel.release();
                    wakeLockSentinel = null;
                    wakeLockActivo.value = false;
                    GymAPI.hablar("Modo entrenamiento desactivado.");
                }
            } catch (err) {
                wakeLockActivo.value = false;
            }
        };

        // --- Exportar / Importar ---
        const exportarRutina = () => {
            const dataBackup = {
                ejercicios: ejercicios.value.map(e => ({ ...e, cronoCorriendo: false, intervaloRef: null })),
                records: records.value
            };
            const stringified = JSON.stringify(dataBackup, null, 2);
            const blob = new Blob([stringified], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `fittrack-agenda-semanal.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            GymAPI.hablar("Agenda semanal exportada con éxito.");
        };

        const importarRutina = (event) => {
            const archivo = event.target.files[0];
            if (!archivo) return;
            const lector = new FileReader();
            lector.onload = (e) => {
                try {
                    const datosImportados = JSON.parse(e.target.result);
                    if (datosImportados.ejercicios && datosImportados.records) {
                        ejercicios.value = datosImportados.ejercicios;
                        records.value = datosImportados.records;
                        GymStorage.guardarEjercicios(ejercicios.value);
                        GymStorage.guardarRecords(records.value);
                        GymAPI.hablar("Agenda importada correctamente.");
                        window.location.reload();
                    }
                } catch (error) {
                    alert("Error al procesar el archivo.");
                }
            };
            lector.readAsText(archivo);
        };

        const leerEjercicio = (ej) => {
            GymAPI.dictarEjercicio(ej.nombre, ej.tipo, ej.series, ej.reps, ej.peso, ej.duracionObjetivo);
        };

        const leerRutinaCompleta = () => {
            GymAPI.dictarRutinaCompleta(ejerciciosFiltrados.value); 
        };

        // Métodos de Instalación PWA
        const instalarApp = async () => {
            if (!deferredPrompt.value) return;
            deferredPrompt.value.prompt(); 
            const { outcome } = await deferredPrompt.value.userChoice;
            if (outcome === 'accepted') {
                mostrarBotonInstalar.value = false; 
            }
            deferredPrompt.value = null;
        };

        // --- Ciclo de Vida ---
        onMounted(() => {
            cargarDatos();
            GymSync.init();
            window.addEventListener('online', () => isOffline.value = false);
            window.addEventListener('offline', () => isOffline.value = true);
            
            // Escuchar el evento nativo del sistema operativo/navegador
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault(); 
                deferredPrompt.value = e; 
                mostrarBotonInstalar.value = true; 
            });

            // Si la app ya está instalada, el boton no aparece
            window.addEventListener('appinstalled', () => {
                mostrarBotonInstalar.value = false;
                deferredPrompt.value = null;
                console.log('FitTrack instalada de forma nativa.');
            });

            setTimeout(() => { cargando.value = false; }, 600);
        });

        return {
            mostrarBienvenida, ejercicios, records, isOffline, nuevoEj, tiempoDescanso, 
            descansoMinutos, descansoSegundos, timerCorriendo, 
            ejercicioPrSeleccionado, nuevoPrValor, wakeLockActivo, cargando, 
            diasSemana, diaSeleccionado, ejerciciosFiltrados, porcentajeProgreso,
            mostrarBotonInstalar, 
            finalizarBienvenida, cambiarDia, agregarEjercicio, eliminarEjercicio, completarEjercicio, controlarCronometro, reiniciarCronometro, 
            abrirModificarPR, guardarNuevoPR, iniciarDescansoReloj, cancelarDescanso, 
            formatearTiempo, alternarWakeLock, exportarRutina, importarRutina, leerEjercicio, leerRutinaCompleta,
            instalarApp 
        };
    }
}).mount('#app');