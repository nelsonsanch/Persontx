import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RecargosIndicators = ({ recargos }) => {
    // 1. Calcular Totales
    const totalHoras = recargos.reduce((sum, r) => sum + parseFloat(r.cantidadHoras || 0), 0);
    const totalValor = recargos.reduce((sum, r) => sum + parseFloat(r.valorTotal || 0), 0);

    // 2. Agrupar por Tipo para Gráfica de Barras
    const porTipo = recargos.reduce((acc, curr) => {
        const tipo = curr.tipoRecargo || 'Desconocido';
        if (!acc[tipo]) acc[tipo] = { name: tipo, horas: 0, valor: 0 };
        acc[tipo].horas += parseFloat(curr.cantidadHoras || 0);
        acc[tipo].valor += parseFloat(curr.valorTotal || 0);
        return acc;
    }, {});
    const dataPorTipo = Object.values(porTipo);

    // 3. Agrupar por Mes (Últimos 6 meses)
    const porMes = recargos.reduce((acc, curr) => {
        const fecha = new Date(curr.fecha);
        const mes = fecha.toLocaleString('es-CO', { month: 'short', year: 'numeric' }); // E.g., "Dic 2025"
        if (!acc[mes]) acc[mes] = { name: mes, valor: 0 };
        acc[mes].valor += parseFloat(curr.valorTotal || 0);
        return acc;
    }, {});
    const dataPorMes = Object.values(porMes);

    // Colores para las gráficas
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="mb-4">
            <h4 className="text-primary mb-3">📊 Indicadores de Gestión de Recargos</h4>

            {/* Tarjetas de Resumen */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center shadow-sm border-primary">
                        <Card.Body>
                            <h6 className="text-muted">Total Valor Pagado</h6>
                            <h3 className="text-primary">
                                ${totalValor.toLocaleString('es-CO')}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm border-success">
                        <Card.Body>
                            <h6 className="text-muted">Total Horas Extras</h6>
                            <h3 className="text-success">{totalHoras.toFixed(1)} h</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center shadow-sm border-info">
                        <Card.Body>
                            <h6 className="text-muted">Promedio por Recargo</h6>
                            <h3 className="text-info">
                                ${recargos.length ? (totalValor / recargos.length).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : 0}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Gráficas */}
            <Row>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white">Distribución por Tipo de Recargo (Valor)</Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dataPorTipo}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="valor"
                                    >
                                        {dataPorTipo.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white">Tendencia Mensual de Costos</Card.Header>
                        <Card.Body>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dataPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="valor" name="Costo Total" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default RecargosIndicators;
