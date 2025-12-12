import React, { useState } from 'react';
import SignaturePad from '../common/SignaturePad';
import { generateSurveyPDF } from '../../utils/pdfGenerator';

const FormularioEncuesta = ({ trabajadorData, onSubmit = () => { }, onCancel = () => { } }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({});
  const [firma, setFirma] = useState(null); // Estado para la firma
  const [loading, setLoading] = useState(false);

  // --- CONFIGURACIÓN DE PREGUNTAS ---

  // Paso 1: Datos Sociodemográficos + Emergencia
  const preguntasPagina1 = [
    {
      titulo: "Información Básica", campos: [
        { id: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerida: true },
        {
          id: 'genero', label: 'Género', tipo: 'select', requerida: true,
          opciones: ['Masculino', 'Femenino', 'No binario', 'Prefiero no decirlo']
        },
        {
          id: 'estadoCivil', label: 'Estado civil', tipo: 'select', requerida: true,
          opciones: ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)']
        },
        {
          id: 'escolaridad', label: 'Nivel escolaridad', tipo: 'select', requerida: true,
          opciones: ['Primaria', 'Bachillerato', 'Técnico', 'Universitario', 'Posgrado']
        },
        {
          id: 'estratoSocial', label: 'Estrato social', tipo: 'select', requerida: true,
          opciones: ['1', '2', '3', '4', '5', '6']
        }
      ]
    },
    {
      titulo: "Contacto de Emergencia 🚨", campos: [
        { id: 'nombreEmergencia', label: 'Nombre completo contacto', tipo: 'text', requerida: true },
        {
          id: 'parentescoEmergencia', label: 'Parentesco', tipo: 'select', requerida: true,
          opciones: ['Esposo(a)', 'Padre', 'Madre', 'Hijo(a)', 'Hermano(a)', 'Amigo(a)', 'Otro']
        },
        { id: 'telefonoEmergencia', label: 'Teléfono de contacto', tipo: 'tel', requerida: true },
        { id: 'direccionEmergencia', label: 'Dirección (Opcional)', tipo: 'text', requerida: false }
      ]
    }
  ];

  // Paso 2: Salud
  const preguntasSalud = [
    // I. ¿EL MÉDICO LE HA DIAGNOSTICADO ALGUNA DE LAS SIGUIENTES ENFERMEDADES O CONDICIONES?
    '1. Enfermedades del corazón?',
    '2. Enfermedades de los pulmones como asma, enfisema, bronquitis?',
    '3. Diabetes (azúcar alta en la sangre)?',
    '4. Enfermedades cerebrales como derrames, trombosis, epilepsia?',
    '5. Enfermedades de los huesos o articulaciones como artritis, gota, lupus, reumatismo, osteoporosis?',
    '6. Enfermedades de la columna vertebral como hernia de disco, compresión de raíces nerviosas, ciática, escoliosis o fractura?',
    '7. Enfermedades digestivas (colon, gastritis, otros)?',
    '8. Enfermedades de la piel?',
    '9. Alergias en vías respiratorias?',
    '10. Alteraciones auditivas?',
    '11. Alteraciones visuales?',
    '12. Hipertensión arterial o tensión alta?',
    '13. Colesterol o Triglicéridos elevados?',

    // ¿HA SENTIDO O TENIDO EN ALGÚN MOMENTO EN LOS ÚLTIMOS 6 MESES?
    '14. Dolor en el pecho o palpitaciones',
    '15. Ahogo o asfixia al caminar',
    '16. Tos persistente por más de 1 mes',
    '17. Pérdida de la conciencia, desmayos o alteración del equilibrio',

    // ¿TIENE ALGUNO DE LOS SIGUIENTES HÁBITOS O COSTUMBRES?
    '18. Fuma? (No importa la cantidad ni la frecuencia)',
    '19. Toma bebidas alcohólicas semanal o quincenalmente (no importa la cantidad)',
    '20. ¿Practica deportes de choque o de mano tipo baloncesto, voleibol, fútbol, tenis, squash, ping-pong, otros, mínimo 2 veces al mes?',
    '21. Realiza actividad física o deporte al menos 3 veces por semana?',

    // ¿EL MÉDICO LE HA DIAGNOSTICADO EN LOS ÚLTIMOS 6 MESES ALGUNA DE LAS SIGUIENTES ENFERMEDADES EN MIEMBROS SUPERIORES (BRAZOS) O INFERIORES (PIERNAS)?
    '22. Alteraciones de los músculos, tendones y ligamentos como desgarros, tendinitis, bursitis, esguinces, espasmos musculares?',
    '23. Enfermedades de los nervios (atrapamiento o inflamación de nervios periféricos)',
    '24. Fracturas',
    '25. ¿Hernias (inguinal, abdominal)?',
    '26. Várices en las piernas',

    // ¿HA SENTIDO EN LOS ÚLTIMOS 6 MESES EN MANOS, BRAZOS, PIES O PIERNAS?
    '27. Adormecimiento u hormigueo?',
    '28. Disminución de la fuerza?',
    '29. Dolor o inflamación?',

    // REFIERE ALGUNA DE LAS SIGUIENTES MOLESTIAS
    '30. Dolor o molestia en el cuello',
    '31. Dolor o molestia en los hombros',
    '32. Dolor o molestia en los codos, muñecas o manos',
    '33. Dolor o molestia en la espalda',
    '34. Dolor o molestia en la cintura',
    '35. Dolor o molestia en las rodillas, tobillos o pies',
    '36. Ha sentido algun dolor o molestia que no se haya mencionado?',
    '37. Considera que las molestias que ha mencionado o que su estado de salud, están relacionados con la labor o tareas en la empresa?',
    '38. Se encuentra actualmente en tratamiento médico por alguna de las condiciones anteriormente mencionadas?'
  ];

  // Mapeo de preguntas a páginas
  const preguntasPorPagina = {};
  let numeroPagina = 1;

  // Página 1: Datos Sociodemográficos + Emergencia
  preguntasPorPagina[numeroPagina] = {
    titulo: "Datos Sociodemográficos y Contacto de Emergencia",
    preguntas: preguntasPagina1.flatMap(seccion => seccion.campos)
  };
  numeroPagina++;

  // Páginas de Salud (agrupadas de 5 en 5)
  for (let i = 0; i < preguntasSalud.length; i += 5) {
    const preguntasGrupo = preguntasSalud.slice(i, i + 5);
    preguntasPorPagina[numeroPagina] = {
      titulo: `Salud - Parte ${Math.ceil((i + 1) / 5)}`,
      preguntas: preguntasGrupo.map((pregunta, index) => ({
        id: `salud_${i + index + 1}`,
        label: pregunta,
        tipo: 'radio',
        requerida: true,
        opciones: ['Sí', 'No', 'No sé']
      }))
    };
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())) {
      edad = edad - 1;
    }

    setFormData(prev => ({ ...prev, edad: edad }));
  }
}, [formData.fechaNacimiento]);

const handleInputChange = (preguntaId, valor) => {
  setFormData(prev => ({
    ...prev,
    [preguntaId]: valor
  }));

  // Limpiar error si existe
  if (errors[preguntaId]) {
    setErrors(prev => ({
      ...prev,
      [preguntaId]: null
    }));
  }
};

const validarPagina = (pagina) => {
  const paginaData = preguntasPorPagina[pagina];
  const erroresPagina = {};

  paginaData.preguntas.forEach(pregunta => {
    if (pregunta.requerida && (!formData[pregunta.id] || formData[pregunta.id].toString().trim() === '')) {
      erroresPagina[pregunta.id] = 'Este campo es requerido';
    }

    // Validaciones específicas
    if (formData[pregunta.id]) {
      switch (pregunta.tipo) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[pregunta.id])) {
            erroresPagina[pregunta.id] = 'Email inválido';
          }
          break;
        case 'tel':
          const telRegex = /^\d{7,10}$/;
          if (!telRegex.test(formData[pregunta.id].replace(/\s/g, ''))) {
            erroresPagina[pregunta.id] = 'Teléfono inválido (7-10 dígitos)';
          }
          break;
        case 'number':
          if (pregunta.min && formData[pregunta.id] < pregunta.min) {
            erroresPagina[pregunta.id] = `Valor mínimo: ${pregunta.min}`;
          }
          if (pregunta.max && formData[pregunta.id] > pregunta.max) {
            erroresPagina[pregunta.id] = `Valor máximo: ${pregunta.max}`;
          }
          break;
      }
    }
  });

  setErrors(erroresPagina);
  return Object.keys(erroresPagina).length === 0;
};

const handleNext = () => {
  if (validarPagina(currentPage)) {
    if (currentPage < totalPaginas) {
      setCurrentPage(currentPage + 1);
    }
  }
};

const handlePrevious = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
  }
};

const handleSubmit = async () => {
  if (validarPagina(currentPage)) {
    setLoading(true);
    try {
      if (typeof onSubmit === 'function') {
        await onSubmit(formData);
        // No mostrar alert, dejar que el componente padre maneje la transición
        console.log('✅ Encuesta enviada exitosamente');
      } else {
        console.log('📋 Datos de la encuesta:', formData);
        alert('✅ Encuesta completada (modo demo)');
      }
    } catch (error) {
      console.error('❌ Error al enviar formulario:', error);
      alert('❌ Error al enviar la encuesta: ' + error.message);
    } finally {
      setLoading(false);
    }
  }
};

const renderPregunta = (pregunta) => {
  const valor = formData[pregunta.id] || '';
  const error = errors[pregunta.id];

  return (
    <div key={pregunta.id} className="form-group">
      <label className="form-label">
        {pregunta.label}
        {pregunta.requerida && <span className="text-danger">*</span>}
      </label>

      {pregunta.tipo === 'select' ? (
        <select
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={valor}
          onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
          disabled={pregunta.readonly}
        >
          <option value="">Seleccione una opción</option>
          {pregunta.opciones.map(opcion => (
            <option key={opcion} value={opcion}>{opcion}</option>
          ))}
        </select>
      ) : pregunta.tipo === 'radio' ? (
        <div className="radio-group">
          {pregunta.opciones.map(opcion => (
            <div key={opcion} className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name={pregunta.id}
                id={`${pregunta.id}_${opcion}`}
                value={opcion}
                checked={valor === opcion}
                onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
              />
              <label className="form-check-label" htmlFor={`${pregunta.id}_${opcion}`}>
                {opcion}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <input
          type={pregunta.tipo}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={valor}
          onChange={(e) => handleInputChange(pregunta.id, e.target.value)}
          min={pregunta.min}
          max={pregunta.max}
          readOnly={pregunta.readonly}
          disabled={pregunta.readonly}
        />
      )}

      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

const paginaActual = preguntasPorPagina[currentPage];

return (
  <div className="formulario-encuesta">
    {/* Encabezado con datos del trabajador */}
    <div className="encabezado-trabajador">
      <h3>Encuesta de Salud Ocupacional</h3>
      <div className="datos-trabajador">
        <p><strong>Trabajador:</strong> {trabajadorData?.nombres} {trabajadorData?.apellidos}</p>
        <p><strong>Identificación:</strong> {trabajadorData?.tipoDocumento} {trabajadorData?.numeroDocumento}</p>
        <p><strong>Cargo:</strong> {trabajadorData?.cargo}</p>
        <p><strong>Área:</strong> {trabajadorData?.area}</p>
      </div>
    </div>

    {/* Indicador de progreso */}
    <div className="progress-container">
      <div className="progress">
        <div
          className="progress-bar"
          style={{ width: `${(currentPage / totalPaginas) * 100}%` }}
        ></div>
      </div>
      <span className="progress-text">Página {currentPage} de {totalPaginas}</span>
    </div>

    {/* Contenido de la página actual */}
    <div className="pagina-contenido">
      <h4>{paginaActual.titulo}</h4>
      <div className="preguntas-container">
        {paginaActual.preguntas.map(pregunta => renderPregunta(pregunta))}
      </div>
    </div>

    {/* Botones de navegación */}
    <div className="botones-navegacion">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onCancel}
      >
        Cancelar
      </button>

      {currentPage > 1 && (
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handlePrevious}
        >
          ← Anterior
        </button>
      )}

      {currentPage < totalPaginas ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
        >
          Siguiente →
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Finalizar Encuesta'}
        </button>
      )}
    </div>

    {/* Auto-guardado */}
    <div className="auto-guardado">
      <small className="text-muted">
        ✓ Los datos se guardan automáticamente
      </small>
    </div>
  </div>
);
};

export default FormularioEncuesta;