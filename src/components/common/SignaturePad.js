import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ onEnd, width = 300, height = 150 }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Configurar contexto para líneas suaves
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000000';
        }
    }, []);

    // Obtener coordenadas relativas al canvas (soporta touch y mouse)
    const getCoordinates = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        // Evitar scroll en móviles mientras se firma
        if (e.type === 'touchstart') e.preventDefault();

        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        if (e.type === 'touchmove') e.preventDefault();

        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            // Notificar al padre con la imagen en base64
            if (onEnd) onEnd(canvas.toDataURL('image/png'));
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onEnd) onEnd(null); // Firma vacía
    };

    return (
        <div className="signature-pad-container text-center">
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', display: 'inline-block', backgroundColor: '#f9f9f9' }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    style={{ touchAction: 'none', cursor: 'crosshair', display: 'block' }}
                />
            </div>
            <div className="mt-2">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clear}
                >
                    <i className="fas fa-trash me-1"></i> Borrar Firma
                </button>
            </div>
            <small className="text-muted d-block mt-1">Firme en el recuadro usando su dedo o mouse</small>
        </div>
    );
};

export default SignaturePad;
