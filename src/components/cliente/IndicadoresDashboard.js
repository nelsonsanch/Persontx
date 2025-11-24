import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const IndicadoresDashboard = () => {
  const [novedades, setNovedades] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear(),
    mes: '',
    tipoNovedad: '',
    estado: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.error('Usuario no autenticado');
        setLoading(false);
        return;
      }

      // Cargar novedades
      const novedadesQuery = query(
        collection(db, 'novedades'),
        where('clienteId', '==', user.uid)
      );
      const novedadesSnapshot = await getDocs(novedadesQuery);
      const novedadesData = [];
      novedadesSnapshot.forEach((doc) => {
        novedadesData.push({ id: doc.id, ...doc.data() });
      });

      // Cargar trabajadores
      const trabajadoresQuery = query(
        collection(db, 'trabajadores'),
        where('clienteId', '==', user.uid)
      );
      const trabajadoresSnapshot = await getDocs(trabajadoresQuery);
      const trabajadoresData = [];
      trabajadoresSnapshot.forEach((doc) => {
        trabajadoresData.push({ id: doc.id, ...doc.data() });
      });

      setNovedades(novedadesData);
      setTrabajadores(trabajadoresData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar novedades según los filtros aplicados
  const filtrarNovedades = () => {
    return novedades.filter(novedad => {
      const fechaInicio = new Date(novedad.fechaInicio);
      const añoNovedad = fechaInicio.getFullYear();
      const mesNovedad = fechaInicio.getMonth() + 1;

      // Filtro por año
      if (filtros.año && añoNovedad !== parseInt(filtros.año)) {
        return false;
      }

      // Filtro por mes
      if (filtros.mes && mesNovedad !== parseInt(filtros.mes)) {
        return false;
      }

      // Filtro por tipo de novedad
      if (filtros.tipoNovedad && novedad.tipoNovedad !== filtros.tipoNovedad) {
        return false;
      }

      // Filtro por estado
      if (filtros.estado && novedad.estado !== filtros.estado) {
        return false;
      }

      return true;
    });
  };

  const novedadesFiltradas = filtrarNovedades();

  // FUNCIÓN: Calcular "No Recuperable" por responsable de pago
  const calcularNoRecuperable = (responsable) => {
    let total = 0;
    
    novedadesFiltradas.forEach(novedad => {
      // Filtrar por responsable
      let esDelResponsable = false;
      if (responsable === 'EPS' && novedad.responsablePago === 'EPS') esDelResponsable = true;
      if (responsable === 'ARL' && novedad.responsablePago === 'ARL') esDelResponsable = true;
      if (responsable === 'Otros' && !['EPS', 'ARL'].includes(novedad.responsablePago)) esDelResponsable = true;
      
      if (!esDelResponsable) return;
      
      const valorPagado = parseFloat(novedad.valorPagado) || 0;
      const valorPendiente = parseFloat(novedad.valorPendiente) || 0;
      const estado = novedad.estado || '';
      
      // Condiciones para "No Recuperable"
      const tienePagado = valorPagado > 0;
      const tienePendiente = valorPendiente > 0;
      const estadoPagado = estado.toLowerCase().includes('pagada') || 
                          estado.toLowerCase().includes('pagado') ||
                          estado === 'Radicada pagada' ||
                          estado === 'radicada_pagada';
      
      if (tienePagado && tienePendiente && estadoPagado) {
        total += valorPendiente;
      }
    });
    
    return total;
  };

  // FUNCIÓN: Calcular Pendiente Real (Pendiente - No Recuperable)
  const calcularPendienteReal = (responsable) => {
    const pendienteTotal = novedadesFiltradas
      .filter(n => {
        if (responsable === 'EPS') return n.responsablePago === 'EPS';
        if (responsable === 'ARL') return n.responsablePago === 'ARL';
        if (responsable === 'Otros') return !['EPS', 'ARL'].includes(n.responsablePago);
        return false;
      })
      .reduce((sum, n) => sum + (n.valorPendiente || 0), 0);
    
    const noRecuperable = calcularNoRecuperable(responsable);
    return pendienteTotal - noRecuperable;
  };

  // FUNCIONES: Calcular porcentajes para todos los valores
  const calcularPorcentajePagado = (responsable) => {
    const valorTotal = novedadesFiltradas
      .filter(n => {
        if (responsable === 'EPS') return n.responsablePago === 'EPS';
        if (responsable === 'ARL') return n.responsablePago === 'ARL';
        if (responsable === 'Otros') return !['EPS', 'ARL'].includes(n.responsablePago);
        return false;
      })
      .reduce((sum, n) => sum + (n.valorTotal || 0), 0);
    
    const valorPagado = novedadesFiltradas
      .filter(n => {
        if (responsable === 'EPS') return n.responsablePago === 'EPS';
        if (responsable === 'ARL') return n.responsablePago === 'ARL';
        if (responsable === 'Otros') return !['EPS', 'ARL'].includes(n.responsablePago);
        return false;
      })
      .reduce((sum, n) => sum + (n.valorPagado || 0), 0);
    
    if (valorTotal === 0) return 0;
    return ((valorPagado / valorTotal) * 100).toFixed(1);
  };

  const calcularPorcentajePendienteReal = (responsable) => {
    const valorTotal = novedadesFiltradas
      .filter(n => {
        if (responsable === 'EPS') return n.responsablePago === 'EPS';
        if (responsable === 'ARL') return n.responsablePago === 'ARL';
        if (responsable === 'Otros') return !['EPS', 'ARL'].includes(n.responsablePago);
        return false;
      })
      .reduce((sum, n) => sum + (n.valorTotal || 0), 0);
    
    const pendienteReal = calcularPendienteReal(responsable);
    
    if (valorTotal === 0) return 0;
    return ((pendienteReal / valorTotal) * 100).toFixed(1);
  };

  const calcularPorcentajeNoRecuperable = (responsable) => {
    const valorTotal = novedadesFiltradas
      .filter(n => {
        if (responsable === 'EPS') return n.responsablePago === 'EPS';
        if (responsable === 'ARL') return n.responsablePago === 'ARL';
        if (responsable === 'Otros') return !['EPS', 'ARL'].includes(n.responsablePago);
        return false;
      })
      .reduce((sum, n) => sum + (n.valorTotal || 0), 0);
    
    const noRecuperable = calcularNoRecuperable(responsable);
    
    if (valorTotal === 0) return 0;
    return ((noRecuperable / valorTotal) * 100).toFixed(1);
  };

  // FUNCIÓN: Generar datos para gráfico de dona por responsable
  const generarDatosDonaResponsable = (responsable) => {
    const valorPagado = novedadesFiltradas
      .filter(n => {
        if (responsable === 'EPS') return n.responsablePago === 'EPS';
        if (responsable === 'ARL') return n.responsablePago === 'ARL';
        if (responsable === 'Otros') return !['EPS', 'ARL'].includes(n.responsablePago);
        return false;
      })
      .reduce((sum, n) => sum + (n.valorPagado || 0), 0);

    const pendienteReal = calcularPendienteReal(responsable);
    const noRecuperable = calcularNoRecuperable(responsable);

    const total = valorPagado + pendienteReal + noRecuperable;

    if (total === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderWidth: 0
        }]
      };
    }

    return {
      labels: ['Pagado', 'Pendiente Real', 'No Recuperable'],
      datasets: [{
        data: [valorPagado, pendienteReal, noRecuperable],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'], // Verde, Amarillo, Rojo
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  // Opciones para gráficos de dona
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((sum, value) => sum + value, 0);
              
              return data.labels.map((label, i) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%' // Hace que sea una dona en lugar de un círculo completo
  };

  // Cálculos de indicadores principales
  const totalNovedades = novedadesFiltradas.length;
  const totalDias = novedadesFiltradas.reduce((sum, novedad) => sum + (novedad.dias || 0), 0);
  const valorTotal = novedadesFiltradas.reduce((sum, novedad) => sum + (novedad.valorTotal || 0), 0);
  
  // CORREGIDO: Solo contar trabajadores activos
  const totalTrabajadoresActivos = trabajadores.filter(t => t.estado === 'activo').length;
  
  const pendientes = novedadesFiltradas.filter(n => 
    n.estado === 'pendiente_por_radicar_sin_informacion' || 
    n.estado === 'pendiente_por_gestionar'
  ).length;
  
  // CORREGIDO: Usar trabajadores activos para calcular tasa de ausentismo
  const tasaAusentismo = totalTrabajadoresActivos > 0 ? ((totalDias / (totalTrabajadoresActivos * 30)) * 100) : 0;

  // AT Ocurridos - Solo "Accidente de Trabajo"
  const atOcurridos = novedadesFiltradas.filter(n => n.tipoNovedad === 'Accidente de Trabajo').length;

  // Función para copiar gráfico al portapapeles
  const copiarGrafico = async (chartId) => {
    try {
      const canvas = document.getElementById(chartId);
      if (canvas) {
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Gráfico copiado al portapapeles');
          } catch (err) {
            console.error('Error al copiar:', err);
            alert('Error al copiar el gráfico');
          }
        });
      }
    } catch (error) {
      console.error('Error al copiar gráfico:', error);
    }
  };

  // Configuraciones de gráficos
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 9
          },
          maxRotation: 45
        }
      }
    }
  };

  const barOptionsCompact = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 9
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 8
          },
          maxRotation: 45
        }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  // Opciones especiales para Top Trabajadores (con doble eje Y)
  const topTrabajadoresOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const topTrabajadores = Object.entries(novedadesFiltradas.reduce((acc, novedad) => {
              const key = novedad.empleadoNombre || 'Sin nombre';
              if (!acc[key]) {
                acc[key] = {
                  novedades: 0,
                  dias: 0,
                  valorTotal: 0,
                  cedula: novedad.numeroDocumento || 'Sin cédula'
                };
              }
              acc[key].novedades += 1;
              acc[key].dias += novedad.dias || 0;
              acc[key].valorTotal += novedad.valorTotal || 0;
              return acc;
            }, {}))
            .sort(([,a], [,b]) => b.novedades - a.novedades)
            .slice(0, 10);

            const trabajador = topTrabajadores[dataIndex];
            if (trabajador) {
              return [
                `Cédula: ${trabajador[1].cedula}`,
                `Valor total: $${trabajador[1].valorTotal.toLocaleString()}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        ticks: {
          font: {
            size: 8
          },
          maxRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Cantidad de Novedades',
          font: {
            size: 10
          }
        },
        ticks: {
          font: {
            size: 9
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Días de Ausentismo',
          font: {
            size: 10
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 9
          }
        }
      },
    },
  };

  // Funciones para generar datos de gráficos
  const generarEvolucionMensual = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const diasPorMes = meses.map((_, index) => {
      return novedadesFiltradas
        .filter(n => {
          const fecha = new Date(n.fechaInicio);
          return fecha.getMonth() === index;
        })
        .reduce((sum, n) => sum + (n.dias || 0), 0);
    });

    const cantidadPorMes = meses.map((_, index) => {
      return novedadesFiltradas
        .filter(n => {
          const fecha = new Date(n.fechaInicio);
          return fecha.getMonth() === index;
        }).length;
    });

    return {
      labels: meses,
      datasets: [
        {
          label: 'Días de Ausentismo',
          data: diasPorMes,
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Cantidad de Novedades',
          data: cantidadPorMes,
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  };

  const generarNovedadesPorTipo = () => {
    const tiposCount = {};
    novedadesFiltradas.forEach(novedad => {
      const tipo = novedad.tipoNovedad || 'Sin tipo';
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });

    return {
      labels: Object.keys(tiposCount),
      datasets: [{
        data: Object.values(tiposCount),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    };
  };

  const generarDiasAusentismoPorTipo = () => {
    const tiposDias = {};
    novedadesFiltradas.forEach(novedad => {
      const tipo = novedad.tipoNovedad || 'Sin tipo';
      tiposDias[tipo] = (tiposDias[tipo] || 0) + (novedad.dias || 0);
    });

    return {
      labels: Object.keys(tiposDias),
      datasets: [{
        label: 'Días de Ausentismo',
        data: Object.values(tiposDias),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40'
        ]
      }]
    };
  };

  const generarEstadosNovedades = () => {
    const estados = {
      'Pendiente por radicar': novedadesFiltradas.filter(n => n.estado === 'pendiente_por_radicar_sin_informacion').length,
      'Radicada sin pago': novedadesFiltradas.filter(n => n.estado === 'radicada_sin_pago').length,
      'Radicada pagada': novedadesFiltradas.filter(n => n.estado === 'radicada_pagada').length,
      'Gestionada': novedadesFiltradas.filter(n => n.estado === 'gestionada').length,
      'Pendiente por gestionar': novedadesFiltradas.filter(n => n.estado === 'pendiente_por_gestionar').length
    };

    return {
      labels: Object.keys(estados),
      datasets: [{
        data: Object.values(estados),
        backgroundColor: ['#dc3545', '#ffc107', '#28a745', '#17a2b8', '#fd7e14']
      }]
    };
  };

  const generarEstadosInvestigacion = () => {
    const estados = {
      'Investigado cerrado': novedadesFiltradas.filter(n => n.estadoInvestigacion === 'investigado_cerrado').length,
      'Investigado en seguimiento': novedadesFiltradas.filter(n => n.estadoInvestigacion === 'investigado_en_seguimiento').length,
      'Pendiente por investigar': novedadesFiltradas.filter(n => n.estadoInvestigacion === 'pendiente_por_investigar').length,
      'En investigación': novedadesFiltradas.filter(n => n.estadoInvestigacion === 'en_investigacion').length,
      'Calificada con PCL': novedadesFiltradas.filter(n => n.estadoInvestigacion === 'calificada_con_pcl').length
    };

    return {
      labels: Object.keys(estados),
      datasets: [{
        data: Object.values(estados),
        backgroundColor: ['#28a745', '#17a2b8', '#dc3545', '#ffc107', '#007bff']
      }]
    };
  };

  const generarDiagnosticosFrecuentes = () => {
    const diagnosticos = {};
    novedadesFiltradas.forEach(novedad => {
      if (novedad.diagnosticoEnfermedad) {
        const diag = novedad.diagnosticoEnfermedad;
        diagnosticos[diag] = (diagnosticos[diag] || 0) + 1;
      }
    });

    const diagnosticosOrdenados = Object.entries(diagnosticos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: diagnosticosOrdenados.map(([diag]) => diag),
      datasets: [{
        label: 'Frecuencia de Diagnósticos',
        data: diagnosticosOrdenados.map(([,count]) => count),
        backgroundColor: '#36A2EB'
      }]
    };
  };

  const generarTiposLesion = () => {
    const lesiones = {};
    novedadesFiltradas.forEach(novedad => {
      if (novedad.tipoLesion) {
        const lesion = novedad.tipoLesion;
        lesiones[lesion] = (lesiones[lesion] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(lesiones),
      datasets: [{
        label: 'Tipos de Lesión',
        data: Object.values(lesiones),
        backgroundColor: '#FF6384'
      }]
    };
  };

  const generarSegmentosCorporales = () => {
    const segmentos = {};
    novedadesFiltradas.forEach(novedad => {
      if (novedad.segmentoCorporal) {
        const segmento = novedad.segmentoCorporal;
        segmentos[segmento] = (segmentos[segmento] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(segmentos),
      datasets: [{
        data: Object.values(segmentos),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40'
        ]
      }]
    };
  };

  const generarMecanismosAccidente = () => {
    const mecanismos = {};
    novedadesFiltradas.forEach(novedad => {
      if (novedad.mecanismoAccidente) {
        const mecanismo = novedad.mecanismoAccidente;
        mecanismos[mecanismo] = (mecanismos[mecanismo] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(mecanismos),
      datasets: [{
        label: 'Mecanismos de Accidente',
        data: Object.values(mecanismos),
        backgroundColor: '#9966FF'
      }]
    };
  };

  // Top trabajadores con más novedades
  const generarTopTrabajadores = () => {
    const trabajadoresStats = novedadesFiltradas.reduce((acc, novedad) => {
      const key = novedad.empleadoNombre || 'Sin nombre';
      if (!acc[key]) {
        acc[key] = {
          novedades: 0,
          dias: 0,
          valorTotal: 0,
          cedula: novedad.numeroDocumento || 'Sin cédula'
        };
      }
      acc[key].novedades += 1;
      acc[key].dias += novedad.dias || 0;
      acc[key].valorTotal += novedad.valorTotal || 0;
      return acc;
    }, {});

    const topTrabajadores = Object.entries(trabajadoresStats)
      .sort(([,a], [,b]) => b.novedades - a.novedades)
      .slice(0, 10);

    const nombres = topTrabajadores.map(([nombre]) => {
      const partesNombre = nombre.split(' ');
      return partesNombre.length > 2 ? `${partesNombre[0]} ${partesNombre[1]}` : nombre;
    });

    return {
      labels: nombres,
      datasets: [
        {
          label: 'Cantidad de Novedades',
          data: topTrabajadores.map(([,stats]) => stats.novedades),
          backgroundColor: '#FF6384',
          yAxisID: 'y'
        },
        {
          label: 'Total Días de Ausentismo',
          data: topTrabajadores.map(([,stats]) => stats.dias),
          backgroundColor: '#36A2EB',
          yAxisID: 'y1'
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📊 Dashboard de Indicadores</h2>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🔍 Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Año</label>
              <select
                className="form-select"
                value={filtros.año}
                onChange={(e) => setFiltros({...filtros, año: e.target.value})}
              >
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Mes</label>
              <select
                className="form-select"
                value={filtros.mes}
                onChange={(e) => setFiltros({...filtros, mes: e.target.value})}
              >
                <option value="">Todos los meses</option>
                {[
                  {value: 1, label: 'Enero'}, {value: 2, label: 'Febrero'}, {value: 3, label: 'Marzo'},
                  {value: 4, label: 'Abril'}, {value: 5, label: 'Mayo'}, {value: 6, label: 'Junio'},
                  {value: 7, label: 'Julio'}, {value: 8, label: 'Agosto'}, {value: 9, label: 'Septiembre'},
                  {value: 10, label: 'Octubre'}, {value: 11, label: 'Noviembre'}, {value: 12, label: 'Diciembre'}
                ].map(mes => (
                  <option key={mes.value} value={mes.value}>{mes.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo de Novedad</label>
              <select
                className="form-select"
                value={filtros.tipoNovedad}
                onChange={(e) => setFiltros({...filtros, tipoNovedad: e.target.value})}
              >
                <option value="">Todos los tipos</option>
                {[...new Set(novedades.map(n => n.tipoNovedad))].map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente_por_radicar_sin_informacion">Pendiente por radicar</option>
                <option value="radicada_sin_pago">Radicada sin pago</option>
                <option value="radicada_pagada">Radicada pagada</option>
                <option value="gestionada">Gestionada</option>
                <option value="pendiente_por_gestionar">Pendiente por gestionar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen - 6 tarjetas principales */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#e3f2fd' }}>
            <div className="card-body">
              <h2 className="text-primary mb-1">{totalNovedades}</h2>
              <p className="card-text mb-0">Total Novedades</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#fff3e0' }}>
            <div className="card-body">
              <h2 className="text-warning mb-1">{totalDias}</h2>
              <p className="card-text mb-0">Total Días</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#e8f5e8' }}>
            <div className="card-body">
              <h2 className="text-success mb-1">${valorTotal.toLocaleString()}</h2>
              <p className="card-text mb-0">Valor Total</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#e0f2f1' }}>
            <div className="card-body">
              <h2 className="text-info mb-1">{totalTrabajadoresActivos}</h2>
              <p className="card-text mb-0">Trabajadores Activos</p>
              <small className="text-muted">Solo estado "activo"</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#ffebee' }}>
            <div className="card-body">
              <h2 className="text-danger mb-1">{pendientes}</h2>
              <p className="card-text mb-0">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#f3e5f5' }}>
            <div className="card-body">
              <h2 className="text-secondary mb-1">{tasaAusentismo.toFixed(2)}%</h2>
              <p className="card-text mb-0">Tasa Ausentismo</p>
              <small className="text-muted">Base: trabajadores activos</small>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Valores por Responsable de Pago - VERSIÓN FINAL CON PORCENTAJES Y DONAS */}
      <div className="alert alert-warning">
        <h6>💰 Valores por Responsable de Pago</h6>
      </div>

      <div className="row mb-4">
        {/* EPS */}
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border-success">
            <div className="card-header bg-success text-white d-flex align-items-center">
              <span className="me-2">🏥</span>
              <strong>EPS</strong>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <small className="text-muted">Cantidad de Novedades</small>
                  <h4 className="text-success">{novedadesFiltradas.filter(n => n.responsablePago === 'EPS').length}</h4>
                </div>
                <div className="col-6">
                  <small className="text-muted">Valor Total</small>
                  <h4 className="text-success">${novedadesFiltradas.filter(n => n.responsablePago === 'EPS').reduce((sum, n) => sum + (n.valorTotal || 0), 0).toLocaleString()}</h4>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">Pagado</small>
                  <p className="text-success mb-0">${novedadesFiltradas.filter(n => n.responsablePago === 'EPS').reduce((sum, n) => sum + (n.valorPagado || 0), 0).toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% Pagado</small>
                  <p className="text-success mb-0">{calcularPorcentajePagado('EPS')}%</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">Pendiente Real</small>
                  <p className="text-warning mb-0">${calcularPendienteReal('EPS').toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% Pendiente Real</small>
                  <p className="text-warning mb-0">{calcularPorcentajePendienteReal('EPS')}%</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">No Recuperable</small>
                  <p className="text-danger mb-0">${calcularNoRecuperable('EPS').toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% No Recuperable</small>
                  <p className="text-danger mb-0">{calcularPorcentajeNoRecuperable('EPS')}%</p>
                </div>
              </div>
              {/* Gráfico de Dona para EPS */}
              <div className="mt-3" style={{ height: '200px' }}>
                <Doughnut 
                  id="dona-eps-chart"
                  data={generarDatosDonaResponsable('EPS')} 
                  options={donutOptions} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* ARL */}
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border-warning">
            <div className="card-header bg-warning text-dark d-flex align-items-center">
              <span className="me-2">🏭</span>
              <strong>ARL</strong>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <small className="text-muted">Cantidad de Novedades</small>
                  <h4 className="text-warning">{novedadesFiltradas.filter(n => n.responsablePago === 'ARL').length}</h4>
                </div>
                <div className="col-6">
                  <small className="text-muted">Valor Total</small>
                  <h4 className="text-warning">${novedadesFiltradas.filter(n => n.responsablePago === 'ARL').reduce((sum, n) => sum + (n.valorTotal || 0), 0).toLocaleString()}</h4>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">Pagado</small>
                  <p className="text-success mb-0">${novedadesFiltradas.filter(n => n.responsablePago === 'ARL').reduce((sum, n) => sum + (n.valorPagado || 0), 0).toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% Pagado</small>
                  <p className="text-success mb-0">{calcularPorcentajePagado('ARL')}%</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">Pendiente Real</small>
                  <p className="text-warning mb-0">${calcularPendienteReal('ARL').toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% Pendiente Real</small>
                  <p className="text-warning mb-0">{calcularPorcentajePendienteReal('ARL')}%</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">No Recuperable</small>
                  <p className="text-danger mb-0">${calcularNoRecuperable('ARL').toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% No Recuperable</small>
                  <p className="text-danger mb-0">{calcularPorcentajeNoRecuperable('ARL')}%</p>
                </div>
              </div>
              {/* Gráfico de Dona para ARL */}
              <div className="mt-3" style={{ height: '200px' }}>
                <Doughnut 
                  id="dona-arl-chart"
                  data={generarDatosDonaResponsable('ARL')} 
                  options={donutOptions} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Otros */}
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card border-info">
            <div className="card-header bg-info text-white d-flex align-items-center">
              <span className="me-2">📋</span>
              <strong>Otros</strong>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <small className="text-muted">Cantidad de Novedades</small>
                  <h4 className="text-info">{novedadesFiltradas.filter(n => !['EPS', 'ARL'].includes(n.responsablePago)).length}</h4>
                </div>
                <div className="col-6">
                  <small className="text-muted">Valor Total</small>
                  <h4 className="text-info">${novedadesFiltradas.filter(n => !['EPS', 'ARL'].includes(n.responsablePago)).reduce((sum, n) => sum + (n.valorTotal || 0), 0).toLocaleString()}</h4>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">Pagado</small>
                  <p className="text-success mb-0">${novedadesFiltradas.filter(n => !['EPS', 'ARL'].includes(n.responsablePago)).reduce((sum, n) => sum + (n.valorPagado || 0), 0).toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% Pagado</small>
                  <p className="text-success mb-0">{calcularPorcentajePagado('Otros')}%</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">Pendiente Real</small>
                  <p className="text-warning mb-0">${calcularPendienteReal('Otros').toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% Pendiente Real</small>
                  <p className="text-warning mb-0">{calcularPorcentajePendienteReal('Otros')}%</p>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-6">
                  <small className="text-muted">No Recuperable</small>
                  <p className="text-danger mb-0">${calcularNoRecuperable('Otros').toLocaleString()}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">% No Recuperable</small>
                  <p className="text-danger mb-0">{calcularPorcentajeNoRecuperable('Otros')}%</p>
                </div>
              </div>
              {/* Gráfico de Dona para Otros */}
              <div className="mt-3" style={{ height: '200px' }}>
                <Doughnut 
                  id="dona-otros-chart"
                  data={generarDatosDonaResponsable('Otros')} 
                  options={donutOptions} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN EXPLICATIVA ACTUALIZADA */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <h6 className="alert-heading">
              <i className="fas fa-info-circle me-2"></i>
              Explicación de Indicadores
            </h6>
            <div className="row">
              <div className="col-md-4">
                <p className="mb-2">
                  <strong>🟢 Pagado:</strong> Valor ya recuperado. Se muestra en valor absoluto y como porcentaje del valor total.
                </p>
              </div>
              <div className="col-md-4">
                <p className="mb-2">
                  <strong>🟡 Pendiente Real:</strong> Valor pendiente menos el valor no recuperable. 
                  Representa lo que realmente se puede cobrar.
                </p>
              </div>
              <div className="col-md-4">
                <p className="mb-2">
                  <strong>🔴 No Recuperable:</strong> Valor pendiente de novedades parcialmente pagadas 
                  que no se podrá recuperar.
                </p>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>Trabajadores Activos:</strong> Solo se cuentan trabajadores con estado "activo" 
                  para el total y la tasa de ausentismo.
                </small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>Los gráficos de dona muestran la distribución visual de estos tres componentes con sus respectivos porcentajes.</strong>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primera fila de gráficos - 3 por fila */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📈 Evolución Mensual</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('evolucion-mensual-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Line 
                id="evolucion-mensual-chart"
                data={generarEvolucionMensual()} 
                options={lineOptions} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📊 Novedades por Tipo</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('novedades-tipo-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Pie 
                id="novedades-tipo-chart"
                data={generarNovedadesPorTipo()} 
                options={pieOptions} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📅 Días Ausentismo por Tipo</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('dias-ausentismo-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Bar 
                id="dias-ausentismo-chart"
                data={generarDiasAusentismoPorTipo()} 
                options={barOptions} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primera fila de gráficos pequeños - 4 por fila */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📋 Estados Novedades</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('estados-novedades-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Pie 
                id="estados-novedades-chart"
                data={generarEstadosNovedades()} 
                options={pieOptions} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">🔍 Estados Investigación</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('estados-investigacion-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Pie 
                id="estados-investigacion-chart"
                data={generarEstadosInvestigacion()} 
                options={pieOptions} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">🏥 Diagnósticos Frecuentes</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('diagnosticos-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Bar 
                id="diagnosticos-chart"
                data={generarDiagnosticosFrecuentes()} 
                options={barOptionsCompact} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">🏭 Tipos de Lesión</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('tipos-lesion-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Bar 
                id="tipos-lesion-chart"
                data={generarTiposLesion()} 
                options={barOptionsCompact} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila de gráficos - 4 por fila */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">🫀 Segmentos Corporales</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('segmentos-corporales-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Pie 
                id="segmentos-corporales-chart"
                data={generarSegmentosCorporales()} 
                options={pieOptions} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">⚙️ Mecanismos Accidente</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('mecanismos-accidente-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Bar 
                id="mecanismos-accidente-chart"
                data={generarMecanismosAccidente()} 
                options={barOptionsCompact} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">👥 Top Trabajadores</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => copiarGrafico('top-trabajadores-chart')}
                title="Copiar gráfico"
              >
                📋
              </button>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Bar 
                id="top-trabajadores-chart"
                data={generarTopTrabajadores()} 
                options={topTrabajadoresOptions} 
              />
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card text-center h-100" style={{ backgroundColor: '#fff8e1', minHeight: '300px' }}>
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">⚠️ AT Ocurridos</h6>
            </div>
            <div className="card-body d-flex flex-column justify-content-center">
              <div className="mb-3">
                <h1 className="display-1 text-warning mb-0">{atOcurridos}</h1>
                <h5 className="text-muted">Accidentes de Trabajo</h5>
              </div>
              <div className="mt-auto">
                <small className="text-muted">
                  Solo cuenta "Accidente de Trabajo"<br/>
                  (No incluye incapacidades derivadas)
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicadoresDashboard;