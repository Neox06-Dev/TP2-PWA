const GymAPI = {
    vozEspañol: null,

    init() {
        if (!('speechSynthesis' in window)) return;
        const buscarVoz = () => {
            const voces = window.speechSynthesis.getVoices();
            let mejorVoz = voces.find(v => v.name.includes('Natural') && v.lang.includes('es'));
            if (!mejorVoz) mejorVoz = voces.find(v => v.name.includes('Google') && v.lang.includes('es'));
            if (!mejorVoz) mejorVoz = voces.find(v => v.lang.includes('es'));
            this.vozEspañol = mejorVoz || voces[0];
        };
        buscarVoz();
        window.speechSynthesis.onvoiceschanged = buscarVoz;
    },

    hablar(texto) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(texto);
            if (this.vozEspañol) utterance.voice = this.vozEspañol;
            else utterance.lang = 'es-AR';
            utterance.rate = 1.25;
            window.speechSynthesis.speak(utterance);
        }
    },

    dictarEjercicio(nombre, tipo, series, reps, peso, duracion) {
        let frase = "";
        if (tipo === 'fuerza') {
            frase = `Próximo ejercicio... ${nombre}. Realizá, ${series} series, de ${reps} repeticiones... con ${peso} kilos.`;
        } else {
            frase = `Próximo ejercicio de resistencia... ${nombre}. El objetivo de tiempo es de, ${duracion} segundos.`;
        }
        this.hablar(frase);
    },

    dictarRutinaCompleta(ejercicios) {
        if (ejercicios.length === 0) return;
        let frase = `Hola. Tu sesión de hoy tiene, ${ejercicios.length} ejercicios... `;
        ejercicios.forEach((ej, index) => {
            if (ej.tipo === 'fuerza') {
                frase += `Número ${index + 1}: ${ej.nombre}... ${ej.series} por ${ej.reps}, con ${ej.peso} kilos. `;
            } else {
                frase += `Número ${index + 1}: ${ej.nombre}, aguantando por ${ej.duracionObjetivo} segundos. `;
            }
        });
        frase += "¡A darlo todo en el entrenamiento!";
        this.hablar(frase);
    }
};

GymAPI.init();