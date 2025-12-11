import React, { useState } from 'react';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardSalud = ({ respuestas = [], trabajadores = [] }) => {
  const [activeTab, setActiveTab] = useState('demograficos');

  // Función para calcular distribuciones demográficas
  const calcularDistribucionDemografica = () => {
    const distribuciones = {
      genero: {},
      raza: {},
      rangoEdad: {},
      escolaridad: {},
      estadoCivil: {},
      estratoSocial: {},
      grupoSanguineo: {},
      distribucionSalarial: {},
      rangoPeso: {},
      rangoEstatura: {}
    };

    respuestas.forEach(respuesta => {
      // Acceder a los datos dentro del objeto respuestas
      const datos = respuesta.respuestas || {};

      // Distribución por género
      const genero = datos.genero || 'No especificado';
      distribuciones.genero[genero] = (distribuciones.genero[genero] || 0) + 1;

      // Distribución por raza
      const raza = datos.raza || 'No especificado';
      distribuciones.raza[raza] = (distribuciones.raza[raza] || 0) + 1;

      // Distribución por rango de edad
      const edad = datos.edad || 0;
      let rangoEdad = 'No especificado';
      if (edad >= 18 && edad <= 25) rangoEdad = '18-25 años';
      else if (edad >= 26 && edad <= 35) rangoEdad = '26-35 años';
      else if (edad >= 36 && edad <= 45) rangoEdad = '36-45 años';
      else if (edad >= 46 && edad <= 55) rangoEdad = '46-55 años';
      else if (edad >= 56) rangoEdad = '56+ años';
      distribuciones.rangoEdad[rangoEdad] = (distribuciones.rangoEdad[rangoEdad] || 0) + 1;

      // Distribución por escolaridad
      const escolaridad = datos.escolaridad || 'No especificado';
      distribuciones.escolaridad[escolaridad] = (distribuciones.escolaridad[escolaridad] || 0) + 1;

      // Distribución por estado civil
      const estadoCivil = datos.estadoCivil || 'No especificado';
      distribuciones.estadoCivil[estadoCivil] = (distribuciones.estadoCivil[estadoCivil] || 0) + 1;

      // Distribución por estrato social
      const estratoSocial = datos.estratoSocial || 'No especificado';
      distribuciones.estratoSocial[estratoSocial] = (distribuciones.estratoSocial[estratoSocial] || 0) + 1;

      // Distribución por grupo sanguíneo
      const grupoSanguineo = datos.grupoSanguineo || 'No especificado';
      distribuciones.grupoSanguineo[grupoSanguineo] = (distribuciones.grupoSanguineo[grupoSanguineo] || 0) + 1;

      // Distribución salarial
      const salario = datos.salario || 'No especificado';
      distribuciones.distribucionSalarial[salario] = (distribuciones.distribucionSalarial[salario] || 0) + 1;

      // Distribución por peso
      const peso = datos.peso || 0;
      let rangoPeso = 'No especificado';
      if (peso > 0 && peso < 50) rangoPeso = 'Menos de 50kg';
      else if (peso >= 50 && peso < 60) rangoPeso = '50-59kg';
      else if (peso >= 60 && peso < 70) rangoPeso = '60-69kg';
      else if (peso >= 70 && peso < 80) rangoPeso = '70-79kg';
      else if (peso >= 80 && peso < 90) rangoPeso = '80-89kg';
      else if (peso >= 90) rangoPeso = '90kg o más';
      distribuciones.rangoPeso[rangoPeso] = (distribuciones.rangoPeso[rangoPeso] || 0) + 1;

      // Distribución por estatura
      const estatura = datos.estatura || 0;
      let rangoEstatura = 'No especificado';
      if (estatura > 0 && estatura < 150) rangoEstatura = 'Menos de 150cm';
      else if (estatura >= 150 && estatura < 160) rangoEstatura = '150-159cm';
      else if (estatura >= 160 && estatura < 170) rangoEstatura = '160-169cm';
      else if (estatura >= 170 && estatura < 180) rangoEstatura = '170-179cm';
      else if (estatura >= 180) rangoEstatura = '180cm o más';
      distribuciones.rangoEstatura[rangoEstatura] = (distribuciones.rangoEstatura[rangoEstatura] || 0) + 1;
    });

    return distribuciones;
  };

  // Función para calcular distribuciones de condiciones de salud
  const calcularDistribucionSalud = () => {
    const preguntasSalud = [
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
      '14. Dolor en el pecho o palpitaciones',
      '15. Ahogo o asfixia al caminar',
      '16. Tos persistente por más de 1 mes',
      '17. Pérdida de la conciencia, desmayos o alteración del equilibrio',
      '18. Fuma? (No importa la cantidad ni la frecuencia)',
      '19. Toma bebidas alcohólicas semanal o quincenalmente (no importa la cantidad)',
      '20. ¿Practica deportes de choque o de mano tipo baloncesto, voleibol, fútbol, tenis, squash, ping-pong, otros, mínimo 2 veces al mes?',
      '21. Realiza actividad física o deporte al menos 3 veces por semana?',
      '22. Alteraciones de los músculos, tendones y ligamentos como desgarros, tendinitis, bursitis, esguinces, espasmos musculares?',
      '23. Enfermedades de los nervios (atrapamiento o inflamación de nervios periféricos)',
      '24. Fracturas',
      '25. ¿Hernias (inguinal, abdominal)?',
      '26. Várices en las piernas',
      '27. Adormecimiento u hormigueo?',
      '28. Disminución de la fuerza?',
      '29. Dolor o inflamación?',
      '30. Dolor o molestia en el cuello',
      '31. Dolor o molestia en los hombros',
      '32. Dolor o molestia en los codos, muñecas o manos',
      '33. Dolor o molestia en la espalda',
      '34. Dolor o molestia en la cintura',
      '35. Dolor o molestia en las rodillas, tobillos o pies',
      '36. El dolor aumenta con la actividad',
      '37. El dolor aumenta con el reposo',
      '38. El dolor es permanente'
    ];

    const distribucionesSalud = {};

    preguntasSalud.forEach((pregunta, index) => {
      const preguntaId = `salud_${index + 1}`;
      // Inicializar contadores incluyendo "No sé" que es la opción real del formulario
      distribucionesSalud[pregunta] = { 'Sí': 0, 'No': 0, 'No sé': 0 };

      respuestas.forEach(respuesta => {
        const datos = respuesta.respuestas || {};
        let valor = datos[preguntaId];

        // Normalizar valor si viene vacío o difiere
        if (!valor) valor = 'No sé';

        // Asegurarse de que el valor exista en nuestra distribución, si no, lo ignoramos o lo sumamos a No sé
        if (distribucionesSalud[pregunta][valor] !== undefined) {
          distribucionesSalud[pregunta][valor]++;
        } else {
          // Si llega algo raro, lo contamos como No sé para no perder la cuenta total? 
          // O mejor no hacemos nada para data corrupta.
          // Asumamos que "No se" (sin tilde) podría llegar
          if (valor === 'No se') distribucionesSalud[pregunta]['No sé']++;
        }
      });
    });

    return distribucionesSalud;
  };

  const distribuciones = calcularDistribucionDemografica();
  const distribucionesSalud = calcularDistribucionSalud();

  // Función para crear datos de gráfico
  const crearDatosGrafico = (datos, colores = null) => {
    const labels = Object.keys(datos);
    const values = Object.values(datos);

    const coloresPredeterminados = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colores || coloresPredeterminados.slice(0, labels.length),
        borderWidth: 1
      }]
    };
  };

  // Función para crear datos de gráfico de barras para condiciones de salud
  const crearDatosBarras = (pregunta, datos) => {
    return {
      labels: ['Sí', 'No', 'No sé'],
      datasets: [{
        label: 'Respuestas',
        data: [datos['Sí'], datos['No'], datos['No sé']],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 1
      }]
    };
  };

  const opcionesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const opcionesBarras = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="dashboard-salud">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">📊 Dashboard de Salud Ocupacional con IA</h5>
          <p className="text-muted mb-0">Análisis inteligente de condiciones de salud laboral</p>
        </div>

        <div className="card-body">
          {/* Tabs de navegación */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'demograficos' ? 'active' : ''}`}
                onClick={() => setActiveTab('demograficos')}
              >
                📈 Datos Demográficos
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'salud' ? 'active' : ''}`}
                onClick={() => setActiveTab('salud')}
              >
                🏥 Condiciones de Salud
              </button>
            </li>
          </ul>

          {/* Contenido de datos demográficos */}
          {activeTab === 'demograficos' && (
            <div className="row">
              {/* Distribución por Género */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">👥 Distribución por Género</h6>
                  </div>
                  <div className="card-body">
                    <Pie data={crearDatosGrafico(distribuciones.genero)} options={opcionesGrafico} />
                  </div>
                </div>
              </div>

              {/* Distribución por Raza */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">🌍 Distribución por Raza/Etnia</h6>
                  </div>
                  <div className="card-body">
                    <Doughnut data={crearDatosGrafico(distribuciones.raza)} options={opcionesGrafico} />
                  </div>
                </div>
              </div>

              {/* Distribución por Rango de Edad */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">📅 Distribución por Rango de Edad</h6>
                  </div>
                  <div className="card-body">
                    <Bar data={crearDatosGrafico(distribuciones.rangoEdad)} options={opcionesBarras} />
                  </div>
                </div>
              </div>

              {/* Distribución Salarial */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">💰 Distribución Salarial</h6>
                  </div>
                  <div className="card-body">
                    <Pie data={crearDatosGrafico(distribuciones.distribucionSalarial)} options={opcionesGrafico} />
                  </div>
                </div>
              </div>

              {/* Distribución por Peso */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">⚖️ Distribución por Peso</h6>
                  </div>
                  <div className="card-body">
                    <Bar data={crearDatosGrafico(distribuciones.rangoPeso)} options={opcionesBarras} />
                  </div>
                </div>
              </div>

              {/* Distribución por Estatura */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">📏 Distribución por Estatura</h6>
                  </div>
                  <div className="card-body">
                    <Bar data={crearDatosGrafico(distribuciones.rangoEstatura)} options={opcionesBarras} />
                  </div>
                </div>
              </div>

              {/* Distribución por Escolaridad */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">🎓 Distribución por Escolaridad</h6>
                  </div>
                  <div className="card-body">
                    <Doughnut data={crearDatosGrafico(distribuciones.escolaridad)} options={opcionesGrafico} />
                  </div>
                </div>
              </div>

              {/* Distribución por Estado Civil */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">💑 Distribución por Estado Civil</h6>
                  </div>
                  <div className="card-body">
                    <Pie data={crearDatosGrafico(distribuciones.estadoCivil)} options={opcionesGrafico} />
                  </div>
                </div>
              </div>

              {/* Distribución por Estrato Social */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">🏘️ Distribución por Estrato Social</h6>
                  </div>
                  <div className="card-body">
                    <Bar data={crearDatosGrafico(distribuciones.estratoSocial)} options={opcionesBarras} />
                  </div>
                </div>
              </div>

              {/* Distribución por Grupo Sanguíneo */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">🩸 Distribución por Grupo Sanguíneo</h6>
                  </div>
                  <div className="card-body">
                    <Doughnut data={crearDatosGrafico(distribuciones.grupoSanguineo)} options={opcionesGrafico} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de condiciones de salud */}
          {activeTab === 'salud' && (
            <div className="condiciones-salud">
              <div className="row">
                {Object.entries(distribucionesSalud).map(([pregunta, datos], index) => (
                  <div key={index} className="col-md-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header">
                        <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                          {pregunta.length > 50 ? pregunta.substring(0, 50) + '...' : pregunta}
                        </h6>
                      </div>
                      <div className="card-body">
                        <Bar
                          data={crearDatosBarras(pregunta, datos)}
                          options={{
                            ...opcionesBarras,
                            plugins: {
                              ...opcionesBarras.plugins,
                              tooltip: {
                                callbacks: {
                                  title: () => pregunta,
                                  label: function (context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((context.parsed.y * 100) / total).toFixed(1) : 0;
                                    return `${context.label}: ${context.parsed.y} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                        <div className="mt-2">
                          <small className="text-muted">
                            Total respuestas: {datos['Sí'] + datos['No'] + datos['No sé']}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen estadístico */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">📋 Resumen Estadístico</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-primary">{respuestas.length}</h4>
                        <p className="mb-0">Total Encuestas</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-success">{Object.keys(distribuciones.genero).length}</h4>
                        <p className="mb-0">Géneros Representados</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-info">{Object.keys(distribuciones.raza).length}</h4>
                        <p className="mb-0">Etnias Representadas</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-warning">38</h4>
                        <p className="mb-0">Condiciones Evaluadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSalud;