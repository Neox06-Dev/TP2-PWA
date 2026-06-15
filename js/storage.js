const GymStorage = {
    KEYS: {
        EJERCICIOS: 'fittrack_ejercicios',
        RECORDS: 'fittrack_records'
    },

    // --- Manejo de Ejercicios ---
    obtenerEjercicios() {
        const datos = localStorage.getItem(this.KEYS.EJERCICIOS);
        return datos ? JSON.parse(datos) : [];
    },

    guardarEjercicios(ejercicios) {
        localStorage.setItem(this.KEYS.EJERCICIOS, JSON.stringify(ejercicios));
    },

    // --- Manejo de Récords Personales (PR) ---
    obtenerRecords() {
        const datos = localStorage.getItem(this.KEYS.RECORDS);
        return datos ? JSON.parse(datos) : {};
    },

    guardarRecords(records) {
        localStorage.setItem(this.KEYS.RECORDS, JSON.stringify(records));
    }
};