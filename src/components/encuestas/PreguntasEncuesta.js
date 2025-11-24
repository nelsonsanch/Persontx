// Definición de las 90 preguntas de la encuesta de condiciones de salud ocupacional
// Categorizadas según el análisis del archivo Excel

export const CATEGORIAS_ENCUESTA = {
  DATOS_PERSONALES: 'datos_personales',
  INFORMACION_LABORAL: 'informacion_laboral',
  PERFIL_SOCIODEMOGRAFICO: 'perfil_sociodemografico',
  ANTECEDENTES_MEDICOS: 'antecedentes_medicos',
  HABITOS_VIDA: 'habitos_vida',
  CONDICIONES_MUSCULOESQUELETICAS: 'condiciones_musculoesqueleticas',
  HISTORIAL_MEDICO: 'historial_medico'
};

export const PREGUNTAS_ENCUESTA = [
  // ===== CATEGORÍA 1: DATOS PERSONALES (1-19) =====
  {
    id: 1,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Autorización de Datos Personales",
    pregunta: "¿Autoriza el tratamiento de sus datos personales según la Ley 1581 de 2012?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true,
    descripcion: "Ley 1581 de 2012: de protección de datos personales"
  },
  {
    id: 2,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Tipo de Identificación",
    pregunta: "Tipo de identificación",
    tipo: "select",
    opciones: ["Cédula de Ciudadanía", "Cédula de Extranjería", "Pasaporte", "Tarjeta de Identidad"],
    requerida: true
  },
  {
    id: 3,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Número de Identificación",
    pregunta: "Número de identificación",
    tipo: "text",
    requerida: true,
    readonly: true // Se llena automáticamente del login
  },
  {
    id: 4,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Nombres y Apellidos",
    pregunta: "Nombres y apellidos completos",
    tipo: "text",
    requerida: true
  },
  {
    id: 5,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Lugar de Expedición",
    pregunta: "Lugar de expedición del documento",
    tipo: "text",
    requerida: true
  },
  {
    id: 6,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Fecha de Nacimiento",
    pregunta: "Fecha de nacimiento",
    tipo: "date",
    requerida: true
  },
  {
    id: 7,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Edad",
    pregunta: "Edad (se calcula automáticamente)",
    tipo: "number",
    readonly: true
  },
  {
    id: 8,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Género",
    pregunta: "Género",
    tipo: "select",
    opciones: ["Masculino", "Femenino", "Otro", "Prefiero no decir"],
    requerida: true
  },
  {
    id: 9,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Raza",
    pregunta: "Raza/Etnia",
    tipo: "select",
    opciones: ["Mestizo", "Blanco", "Afrodescendiente", "Indígena", "Otro"],
    requerida: false
  },
  {
    id: 10,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Peso",
    pregunta: "Peso (kg)",
    tipo: "number",
    requerida: true
  },
  {
    id: 11,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Estatura",
    pregunta: "Estatura (cm)",
    tipo: "number",
    requerida: true
  },
  {
    id: 12,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Tipo de Sangre",
    pregunta: "Tipo de sangre",
    tipo: "select",
    opciones: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "No sé"],
    requerida: false
  },
  {
    id: 13,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Número de Contacto",
    pregunta: "Número de contacto",
    tipo: "tel",
    requerida: true
  },
  {
    id: 14,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Dirección de Residencia",
    pregunta: "Dirección de residencia",
    tipo: "text",
    requerida: true
  },
  {
    id: 15,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Contacto de Emergencia",
    pregunta: "En caso de emergencia llamar a",
    tipo: "text",
    requerida: true
  },
  {
    id: 16,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Parentesco",
    pregunta: "Parentesco del contacto de emergencia",
    tipo: "select",
    opciones: ["Padre", "Madre", "Esposo/a", "Hijo/a", "Hermano/a", "Otro familiar", "Amigo/a"],
    requerida: true
  },
  {
    id: 17,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Teléfono de Emergencia",
    pregunta: "Teléfono de contacto de emergencia",
    tipo: "tel",
    requerida: true
  },
  {
    id: 18,
    categoria: CATEGORIAS_ENCUESTA.DATOS_PERSONALES,
    titulo: "Dirección Contacto Emergencia",
    pregunta: "Dirección y lugar de residencia del contacto de emergencia",
    tipo: "text",
    requerida: false
  },

  // ===== CATEGORÍA 2: INFORMACIÓN LABORAL (19-30) =====
  {
    id: 19,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Fecha de Ingreso",
    pregunta: "Fecha de ingreso a la empresa",
    tipo: "date",
    requerida: true
  },
  {
    id: 20,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Tipo de Contrato",
    pregunta: "Tipo de contrato",
    tipo: "select",
    opciones: ["Término indefinido", "Término fijo", "Obra o labor", "Prestación de servicios", "Aprendizaje"],
    requerida: true
  },
  {
    id: 21,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Cargo Actual",
    pregunta: "Cargo actual en la empresa",
    tipo: "text",
    requerida: true
  },
  {
    id: 22,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Actividades del Cargo",
    pregunta: "Actividades que realiza en el cargo (descripción corta)",
    tipo: "textarea",
    requerida: true,
    placeholder: "Ejemplo: atención al cliente, recepción de llamadas, archivo de documentos, etc."
  },
  {
    id: 23,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Tiempo en la Empresa",
    pregunta: "Tiempo en la empresa",
    tipo: "select",
    opciones: ["Menos de 6 meses", "6 meses a 1 año", "1 a 2 años", "2 a 5 años", "5 a 10 años", "Más de 10 años"],
    requerida: true
  },
  {
    id: 24,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Salario",
    pregunta: "Rango salarial",
    tipo: "select",
    opciones: ["Menos de 1 SMMLV", "1 SMMLV", "1-2 SMMLV", "2-3 SMMLV", "3-5 SMMLV", "Más de 5 SMMLV"],
    requerida: false
  },
  {
    id: 25,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Área de Trabajo",
    pregunta: "Área de trabajo",
    tipo: "text",
    requerida: true
  },
  {
    id: 26,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Sucursal/Sede",
    pregunta: "Sucursal, sede o centro de trabajo",
    tipo: "text",
    requerida: true
  },
  {
    id: 27,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Turno de Trabajo",
    pregunta: "Turno de trabajo",
    tipo: "select",
    opciones: ["Diurno", "Nocturno", "Mixto", "Rotativo"],
    requerida: true
  },
  {
    id: 28,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Horario de Trabajo",
    pregunta: "Horario de trabajo",
    tipo: "text",
    requerida: true,
    placeholder: "Ejemplo: 8:00 AM - 5:00 PM"
  },
  {
    id: 29,
    categoria: CATEGORIAS_ENCUESTA.INFORMACION_LABORAL,
    titulo: "Jefe Inmediato",
    pregunta: "Jefe inmediato",
    tipo: "text",
    requerida: true
  },

  // ===== CATEGORÍA 3: PERFIL SOCIODEMOGRÁFICO (30-42) =====
  {
    id: 30,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Grado de Escolaridad",
    pregunta: "Grado de escolaridad",
    tipo: "select",
    opciones: ["Primaria incompleta", "Primaria completa", "Secundaria incompleta", "Secundaria completa", "Técnico", "Tecnológico", "Universitario incompleto", "Universitario completo", "Especialización", "Maestría", "Doctorado"],
    requerida: true
  },
  {
    id: 31,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Estado Civil",
    pregunta: "Estado civil",
    tipo: "select",
    opciones: ["Soltero/a", "Casado/a", "Unión libre", "Divorciado/a", "Viudo/a", "Separado/a"],
    requerida: true
  },
  {
    id: 32,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Composición Familiar",
    pregunta: "¿Quiénes componen su grupo familiar?",
    tipo: "textarea",
    requerida: true,
    placeholder: "Ejemplo: Esposo/a: nombre, Hijos: nombres y edades"
  },
  {
    id: 33,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Tiene Hijos",
    pregunta: "¿Tiene hijos?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 34,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Cantidad de Hijos",
    pregunta: "¿Cuántos hijos tiene?",
    tipo: "number",
    requerida: false,
    dependeDe: 33,
    dependeValor: "Sí"
  },
  {
    id: 35,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Edades de los Hijos",
    pregunta: "Edades de sus hijos",
    tipo: "text",
    requerida: false,
    dependeDe: 33,
    dependeValor: "Sí",
    placeholder: "Ejemplo: 5, 8, 12 años"
  },
  {
    id: 36,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Personas con las que Vive",
    pregunta: "¿Con cuántas personas vive?",
    tipo: "number",
    requerida: true
  },
  {
    id: 37,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Estrato Socioeconómico",
    pregunta: "Estrato socioeconómico",
    tipo: "select",
    opciones: ["1", "2", "3", "4", "5", "6"],
    requerida: true
  },
  {
    id: 38,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "EPS",
    pregunta: "Entidad Promotora de Salud (EPS)",
    tipo: "text",
    requerida: true
  },
  {
    id: 39,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "ARL",
    pregunta: "Administradora de Riesgos Laborales (ARL)",
    tipo: "text",
    requerida: true
  },
  {
    id: 40,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "AFP",
    pregunta: "Administradora de Fondo de Pensiones (AFP)",
    tipo: "text",
    requerida: true
  },
  {
    id: 41,
    categoria: CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO,
    titulo: "Caja de Compensación",
    pregunta: "Caja de Compensación Familiar",
    tipo: "text",
    requerida: true
  },

  // ===== CATEGORÍA 4: ANTECEDENTES MÉDICOS (42-59) =====
  {
    id: 42,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Enfermedades del Corazón",
    pregunta: "¿Tiene enfermedades del corazón?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 43,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Enfermedades Pulmonares",
    pregunta: "¿Tiene enfermedades de los pulmones como asma, enfisema, bronquitis, Covid-19?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 44,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Diabetes",
    pregunta: "¿Diabetes (azúcar alta en la sangre)?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 45,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Enfermedades Cerebrales",
    pregunta: "¿Enfermedades cerebrales como derrames, trombosis, epilepsia?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 46,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Enfermedades Óseas",
    pregunta: "¿Enfermedades de los huesos o articulaciones como artritis, gota, lupus, reumatismo, osteoporosis?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 47,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Enfermedades Digestivas",
    pregunta: "¿Enfermedades digestivas (colon, gastritis, otros)?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 48,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Enfermedades de la Piel",
    pregunta: "¿Enfermedades de la piel?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 49,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Alergias Respiratorias",
    pregunta: "¿Alergias en vías respiratorias?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 50,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Alteraciones Auditivas",
    pregunta: "¿Alteraciones auditivas?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 51,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Hipertensión",
    pregunta: "¿Hipertensión arterial o tensión alta?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 52,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Colesterol",
    pregunta: "¿Colesterol o Triglicéridos elevados?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 53,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Dolor en el Pecho",
    pregunta: "¿Dolor en el pecho o palpitaciones?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 54,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Ahogo al Caminar",
    pregunta: "¿Ahogo o asfixia al caminar?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 55,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Tos Persistente",
    pregunta: "¿Tos persistente por más de 5 días?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 56,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Pérdida de Conciencia",
    pregunta: "¿Pérdida de la conciencia, desmayos o alteración del equilibrio?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 57,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Pérdida del Olfato",
    pregunta: "¿Pérdida del olfato?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 58,
    categoria: CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS,
    titulo: "Pérdida del Gusto",
    pregunta: "¿Pérdida del gusto en el paladar?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },

  // ===== CATEGORÍA 5: HÁBITOS DE VIDA (59-64) =====
  {
    id: 59,
    categoria: CATEGORIAS_ENCUESTA.HABITOS_VIDA,
    titulo: "Tabaquismo",
    pregunta: "¿Fuma cigarrillo o tabaco?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 60,
    categoria: CATEGORIAS_ENCUESTA.HABITOS_VIDA,
    titulo: "Consumo de Alcohol",
    pregunta: "¿Toma bebidas alcohólicas?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 61,
    categoria: CATEGORIAS_ENCUESTA.HABITOS_VIDA,
    titulo: "Deportes de Choque",
    pregunta: "¿Practica deportes de choque o de mano tipo baloncesto, voleibol, fútbol, tenis, squash, ping-pong, otros, mínimo 2 veces al mes?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 62,
    categoria: CATEGORIAS_ENCUESTA.HABITOS_VIDA,
    titulo: "Actividad Física",
    pregunta: "¿Realiza actividad física o deporte al menos 3 veces por semana?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 63,
    categoria: CATEGORIAS_ENCUESTA.HABITOS_VIDA,
    titulo: "Sustancias",
    pregunta: "¿Consume alguna sustancia alucinógena o energizante?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },

  // ===== CATEGORÍA 6: CONDICIONES MUSCULOESQUELÉTICAS (64-81) =====
  {
    id: 64,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Alteraciones Musculares",
    pregunta: "¿Alteraciones de los músculos, tendones y ligamentos como desgarros, tendinitis, bursitis, esguinces, espasmos musculares?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 65,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Enfermedades de los Nervios",
    pregunta: "¿Enfermedades de los nervios (atrapamiento o inflamación túnel carpiano, ciática etc.)?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 66,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Fracturas",
    pregunta: "¿Fracturas?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 67,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Hernias",
    pregunta: "¿Hernias (inguinal, abdominal)?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 68,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Varices",
    pregunta: "¿Varices en las piernas?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 69,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Adormecimiento",
    pregunta: "¿Adormecimiento u hormigueo de miembros inferiores o superiores?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 70,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Disminución de Fuerza",
    pregunta: "¿Disminución de la fuerza?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 71,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Miembros",
    pregunta: "¿Dolor o inflamación de miembros inferiores o superiores?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 72,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Cuello",
    pregunta: "¿Dolor o molestia en el cuello?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 73,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Hombros",
    pregunta: "¿Dolor o molestia en los hombros?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 74,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Codos/Muñecas",
    pregunta: "¿Dolor o molestia en los codos, muñecas o manos?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 75,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Espalda",
    pregunta: "¿Dolor o molestia en la espalda?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 76,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Cintura",
    pregunta: "¿Dolor o molestia en la cintura?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 77,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Rodillas/Pies",
    pregunta: "¿Dolor o molestia en las rodillas, tobillos o pies?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 78,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor con Actividad",
    pregunta: "¿El dolor aumenta con la actividad?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 79,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor con Reposo",
    pregunta: "¿El dolor aumenta con el reposo?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 80,
    categoria: CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS,
    titulo: "Dolor Permanente",
    pregunta: "¿El dolor es permanente?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },

  // ===== CATEGORÍA 7: HISTORIAL MÉDICO (81-90) =====
  {
    id: 81,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Accidentes Laborales",
    pregunta: "¿Ha tenido accidentes en este trabajo?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 82,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Descripción Accidentes",
    pregunta: "Describa el accidente (fecha, parte afectada y tratamiento médico recibido)",
    tipo: "textarea",
    requerida: false,
    dependeDe: 81,
    dependeValor: "Sí"
  },
  {
    id: 83,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Cirugías",
    pregunta: "¿Le han realizado alguna cirugía?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 84,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Descripción Cirugías",
    pregunta: "¿Qué cirugía y en qué fecha?",
    tipo: "textarea",
    requerida: false,
    dependeDe: 83,
    dependeValor: "Sí"
  },
  {
    id: 85,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Alergias",
    pregunta: "¿Tiene alguna alergia?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 86,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Descripción Alergias",
    pregunta: "¿A qué medicamentos o alimentos es alérgico?",
    tipo: "textarea",
    requerida: false,
    dependeDe: 85,
    dependeValor: "Sí"
  },
  {
    id: 87,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Medicamentos",
    pregunta: "¿Toma algún medicamento?",
    tipo: "radio",
    opciones: ["Sí", "No"],
    requerida: true
  },
  {
    id: 88,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Descripción Medicamentos",
    pregunta: "¿Qué medicamento toma?",
    tipo: "textarea",
    requerida: false,
    dependeDe: 87,
    dependeValor: "Sí"
  },
  {
    id: 89,
    categoria: CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO,
    titulo: "Agradecimiento",
    pregunta: "Gracias por su participación",
    tipo: "info",
    requerida: false
  }
];

// Función para obtener preguntas por categoría
export const obtenerPreguntasPorCategoria = (categoria) => {
  return PREGUNTAS_ENCUESTA.filter(pregunta => pregunta.categoria === categoria);
};

// Función para obtener todas las categorías
export const obtenerCategorias = () => {
  return Object.values(CATEGORIAS_ENCUESTA);
};

// Títulos de las categorías para mostrar en la UI
export const TITULOS_CATEGORIAS = {
  [CATEGORIAS_ENCUESTA.DATOS_PERSONALES]: "👤 Datos Personales",
  [CATEGORIAS_ENCUESTA.INFORMACION_LABORAL]: "💼 Información Laboral", 
  [CATEGORIAS_ENCUESTA.PERFIL_SOCIODEMOGRAFICO]: "🏠 Perfil Sociodemográfico",
  [CATEGORIAS_ENCUESTA.ANTECEDENTES_MEDICOS]: "🏥 Antecedentes Médicos",
  [CATEGORIAS_ENCUESTA.HABITOS_VIDA]: "🏃 Hábitos de Vida",
  [CATEGORIAS_ENCUESTA.CONDICIONES_MUSCULOESQUELETICAS]: "🦴 Condiciones Musculoesqueléticas",
  [CATEGORIAS_ENCUESTA.HISTORIAL_MEDICO]: "📋 Historial Médico"
};