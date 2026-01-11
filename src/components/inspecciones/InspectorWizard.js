import React, { useState } from 'react';
import { Card, Button, ProgressBar } from 'react-bootstrap';
import SeleccionCategoria from './steps/1_SeleccionCategoria';
import SeleccionActivo from './steps/2_SeleccionActivo';
import FormularioCheck from './steps/3_FormularioCheck';
import ResumenFinal from './steps/4_ResumenFinal';

const InspectorWizard = () => {
    const [step, setStep] = useState(1);
    const [inspectionData, setInspectionData] = useState({
        categoria: '',       // 'extintores', 'botiquin'
        configRef: null,     // Referencia al archivo config (campos)
        activoSeleccionado: null, // Objeto del item (Firebase)
        checklist: {},       // Respuestas { 'Manguera': 'Bueno' }
        observaciones: ''
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    // Paso 1: Seleccionar Categoría
    const handleCategorySelect = (categoriaKey, configObj) => {
        setInspectionData({
            ...inspectionData,
            categoria: categoriaKey,
            configRef: configObj,
            activoSeleccionado: null, // Reset si cambia categoría 
            checklist: {}
        });
        nextStep();
    };

    // Paso 2: Seleccionar Activo
    const handleAssetSelect = (asset) => {
        setInspectionData({
            ...inspectionData,
            activoSeleccionado: asset
        });
        nextStep();
    };

    // Reiniciar
    const handleReset = () => {
        setStep(1);
        setInspectionData({
            categoria: '',
            configRef: null,
            activoSeleccionado: null,
            checklist: {},
            observaciones: ''
        });
    };

    // Renderizado condicional de pasos
    const renderStep = () => {
        switch (step) {
            case 1:
                return <SeleccionCategoria onSelect={handleCategorySelect} />;
            case 2:
                return <SeleccionActivo
                    categoria={inspectionData.categoria}
                    config={inspectionData.configRef}
                    onSelect={handleAssetSelect}
                    onBack={prevStep}
                />;
            case 3:
                return <FormularioCheck
                    data={inspectionData}
                    setData={setInspectionData}
                    onNext={nextStep}
                    onBack={prevStep}
                />;
            case 4:
                return <ResumenFinal
                    data={inspectionData}
                    onBack={prevStep}
                    onReset={handleReset}
                />;
            default: return <div>Paso desconocido</div>;
        }
    };

    // Barra de progreso
    const progress = (step / 4) * 100;

    return (
        <div>
            {step < 5 && (
                <div className="mb-4">
                    <ProgressBar now={progress} label={`Paso ${step} de 4`} striped variant="success" />
                </div>
            )}

            <Card className="border-0">
                <Card.Body>
                    {renderStep()}
                </Card.Body>
            </Card>
        </div>
    );
};

export default InspectorWizard;
