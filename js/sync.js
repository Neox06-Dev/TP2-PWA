const GymSync = {
    // URL del script de Google Apps Script que maneja la recepción de datos
    SHEETS_URL: "https://script.google.com/macros/s/AKfycbxMvUUEcXhti-BEROg2nhh7FJ2S0Pg2oy-N6Y8syX75yjFmwFBl39rfVMyBKbjFJf2RUA/exec",
    db: null,

    // Inicializar IndexedDB
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("FitTrackSyncDB", 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("pendientes")) {
                    db.createObjectStore("pendientes", { keyPath: "id" });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
                this.sincronizarPendientes(); 
            };

            request.onerror = (e) => reject(e.target.error);
        });
    },

    // Guardar en IndexedDB si no hay red o para asegurar el disparo
    async encolarEjercicio(ejercicio) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["pendientes"], "readwrite");
            const store = transaction.objectStore("pendientes");
            
            // Clonamos el objeto sin referencias reactivas de Vue
            const copiaData = {
                id: ejercicio.id,
                dia: ejercicio.dia,
                nombre: ejercicio.nombre,
                tipo: ejercicio.tipo,
                series: ejercicio.series,
                reps: ejercicio.reps,
                peso: ejercicio.peso,
                duracionObjetivo: ejercicio.duracionObjetivo
            };

            const request = store.add(copiaData);
            request.onsuccess = () => {
                resolve();
                this.sincronizarPendientes();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // Enviar todo lo acumulado en IndexedDB a Google Sheets
    async sincronizarPendientes() {
        if (!navigator.onLine || !this.db) return;

        const transaction = this.db.transaction(["pendientes"], "readwrite");
        const store = transaction.objectStore("pendientes");
        const request = store.getAll();

        request.onsuccess = async (e) => {
            const pendientes = e.target.result;
            if (pendientes.length === 0) return;

            console.log(`Sincronizando ${pendientes.length} ejercicios con Google Sheets...`);

            for (const ej of pendientes) {
                try {
                    const response = await fetch(this.SHEETS_URL, {
                        method: "POST",
                        mode: "no-cors", // Requerido para Google Apps Script
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(ej)
                    });

                    const transBorrado = this.db.transaction(["pendientes"], "readwrite");
                    transBorrado.objectStore("pendientes").delete(ej.id);
                    console.log(`Ejercicio ${ej.nombre} sincronizado y limpiado de IndexedDB.`);
                } catch (err) {
                    console.error("Error al enviar a Google Sheets, se queda en IndexedDB:", err);
                    break;
                }
            }
        };
    }
};

window.addEventListener('online', () => {
    GymSync.sincronizarPendientes();
});