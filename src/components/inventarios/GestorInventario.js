import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    limit
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { Trash2, Edit, Plus, FileText, Eye, Bomb, Flame, Skull, Biohazard, Radio, Droplet, Zap, Triangle, Ban, Camera } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import html2pdf from 'html2pdf.js';

const GHS_DEFINITIONS = [
    { key: 'Clase 1', label: 'Explosivo', bg: '#ff6600', text: '1', color: 'black', renderIcon: (s) => <Bomb size={s} /> },
    { key: 'Clase 2.1', label: 'Gas Inflamable', bg: '#dc3545', text: '2', color: 'white', renderIcon: (s) => <Flame size={s} /> },
    { key: 'Clase 2.2', label: 'Gas No Inflamable', bg: '#28a745', text: '2', color: 'white', renderIcon: (s) => <span style={{ fontSize: `${s}px`, fontWeight: 'bold' }}>Gas</span> },
    { key: 'Clase 2.3', label: 'Gas TÃ³xico', bg: 'white', text: '2', color: 'black', renderIcon: (s) => <Skull size={s} /> },
    { key: 'Clase 3', label: 'LÃ­quido Inflamable', bg: '#dc3545', text: '3', color: 'white', renderIcon: (s) => <Flame size={s} /> },
    { key: 'Clase 4.1', label: 'SÃ³lido Inflamable', bg: 'repeating-linear-gradient(90deg, #dc3545, #dc3545 10px, white 10px, white 20px)', text: '4', color: 'black', renderIcon: (s) => <Flame size={s} color="black" /> },
    { key: 'Clase 4.2', label: 'CombustiÃ³n Espont.', bg: 'linear-gradient(to bottom, white 50%, #dc3545 50%)', text: '4', color: 'black', renderIcon: (s) => <Flame size={s} color="black" /> },
    { key: 'Clase 4.3', label: 'Peligroso con Agua', bg: '#007bff', text: '4', color: 'white', renderIcon: (s) => <Flame size={s} /> },
    { key: 'Clase 5.1', label: 'Comburente', bg: '#ffc107', text: '5.1', color: 'black', renderIcon: (s) => <Flame size={s} color="black" strokeWidth={3} /> },
    { key: 'Clase 5.2', label: 'PerÃ³xido OrgÃ¡nico', bg: 'linear-gradient(to bottom, #dc3545 50%, #ffc107 50%)', text: '5.2', color: 'black', renderIcon: (s) => <Flame size={s} /> },
    { key: 'Clase 6.1', label: 'TÃ³xico', bg: 'white', text: '6', color: 'black', renderIcon: (s) => <Skull size={s} /> },
    { key: 'Clase 6.2', label: 'Infeccioso', bg: 'white', text: '6', color: 'black', renderIcon: (s) => <Biohazard size={s} /> },
    { key: 'Clase 7', label: 'Radiactivo', bg: 'linear-gradient(to bottom, #ffc107 50%, white 50%)', text: '7', color: 'black', renderIcon: (s) => <Radio size={s} color="black" /> },
    { key: 'Clase 8', label: 'Corrosivo', bg: 'linear-gradient(to bottom, white 50%, black 50%)', text: '8', color: 'white', renderIcon: (s) => <Droplet size={s} color="black" /> },
    { key: 'Clase 9', label: 'MiscelÃ¡neos', bg: 'repeating-linear-gradient(180deg, white, white 10px, black 10px, black 11px) top/100% 50% no-repeat, white bottom/100% 50% no-repeat', text: '9', color: 'black', renderIcon: (s) => <span style={{ fontSize: `${s}px`, fontWeight: 'bold' }}>9</span> },
];

const GHSDiamond = ({ ghs, size = 60, style = {}, className = '', onClick }) => {
    const iconSize = size * 0.4;
    const textSize = Math.max(8, size * 0.18);
    const borderWidth = Math.max(1, size * 0.06);

    return (
        <div
            className={className}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                background: ghs.bg,
                transform: 'rotate(45deg)',
                border: `${borderWidth}px solid black`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
                marginBottom: `${size * 0.2}px`,
                marginTop: `${size * 0.2}px`,
                marginLeft: `${size * 0.2}px`,
                marginRight: `${size * 0.2}px`,
                ...style
            }}
            onClick={onClick}
        >
            <div style={{
                transform: 'rotate(-45deg)',
                color: ghs.color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
            }}>
                {ghs.renderIcon(iconSize)}
                <span style={{ fontSize: `${textSize}px`, fontWeight: 'bold', marginTop: '2px', lineHeight: 1 }}>{ghs.text}</span>
            </div>
        </div>
    );
};

const GestorInventario = ({ config }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [catalogSuggestions, setCatalogSuggestions] = useState([]); // Sugerencias del catÃ¡logo global
    const [catalogQuery, setCatalogQuery] = useState(''); // Lo que escribe el usuario para buscar
    const [uploading, setUploading] = useState(false); // Estado de carga de imagen
    const [dynamicOptions, setDynamicOptions] = useState({}); // Opciones cargadas dinÃ¡micamente

    // Cargar opciones dinÃ¡micas (Firestore Select)
    useEffect(() => {
        if (!user || !config) return;

        const loadDynamicOptions = async () => {
            const dynamicFields = config.campos.filter(c => c.type === 'firestore_select');
            const newOptions = {};

            for (const field of dynamicFields) {
                try {
                    const conditions = [
                        where('clienteId', '==', user.uid), // Siempre filtrar por usuario actual
                    ];

                    if (field.filters) {
                        Object.entries(field.filters).forEach(([key, val]) => {
                            conditions.push(where(key, '==', val));
                        });
                    }

                    const q = query(collection(db, field.collection), ...conditions);
                    const snapshot = await getDocs(q);

                    newOptions[field.name] = snapshot.docs.map(doc => {
                        const data = doc.data();
                        // Construir etiqueta legible (puede ser compuesta)
                        const label = field.displayField.split('+').map(k => data[k.trim()] || '').join(' - ');
                        return { value: data[field.valueField] || doc.id, label, original: data };
                    });
                } catch (error) {
                    console.error(`Error cargando opciones para ${field.name}:`, error);
                }
            }
            setDynamicOptions(newOptions);
        };

        loadDynamicOptions();
    }, [user, config]);

    // Cargar datos en tiempo real
    useEffect(() => {
        if (!user || !config) return;

        setLoading(true);
        const q = query(
            collection(db, config.coleccion),
            where('clienteId', '==', user.uid),
            where('categoria', '==', config.filtroCategoria)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error obteniendo inventario:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, config]);

    // Manejar cambios en inputs
    const handleInputChange = (e, fieldName) => {
        setFormData({ ...formData, [fieldName]: e.target.value });
    };

    // Abrir modal (Crear o Editar)
    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData(item);
        } else {
            setFormData({}); // Limpiar form
        }
        setShowModal(true);
    };

    // Abrir modal de visualizaciÃ³n
    const openViewModal = (item) => {
        setViewingItem(item);
        setViewModalOpen(true);
    };



    // Guardar (Crear o Actualizar)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;

        try {
            const dataToSave = {
                ...formData,
                clienteId: user.uid,
                categoria: config.filtroCategoria, // Asegurar que se guarde con la categorÃ­a correcta
                fechaActualizacion: new Date().toISOString()
            };

            // LÃ³gica EspecÃ­fica para Alturas: Template Key
            if (config.id === 'alturas' && dataToSave.tipo_equipo) {
                // Generar una key segura para templates: 'arnes-cuerpo-completo'
                dataToSave.inspection_template_key = dataToSave.tipo_equipo
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
                    .replace(/[^a-z0-9]/g, '-'); // caracteres especiales a guiones
            }

            if (editingItem) {
                await updateDoc(doc(db, config.coleccion, editingItem.id), dataToSave);
            } else {
                await addDoc(collection(db, config.coleccion), dataToSave);
            }

            setShowModal(false);
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar el Ã­tem");
        }
    };

    // Generar PDF (Acta de Asignación)
    const handleDownloadPdf = (item) => {
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.fontSize = '12px';
        element.style.color = '#333';

        // 1. Encabezado
        const header = `
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
                <h2 style="margin: 0; text-transform: uppercase;">ACTA DE ASIGNACIÓN DE ${config.titulo || 'ACTIVO'}</h2>
                <p style="margin: 5px 0;">Fecha de Generación: ${new Date().toLocaleDateString()}</p>
                <p style="margin: 0; font-style: italic;">Código de Control: ${item.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div style="margin-bottom: 20px;">
                <p>Por medio de la presente, se hace entrega formal del siguiente activo a <strong>${item.propietario || item.responsable || '_______________________'}</strong>, 
                quien asume la responsabilidad de su uso adecuado, custodia y mantenimiento.</p>
            </div>
        `;

        // 2. Detalles del Activo (Tabla)
        let rows = '';
        config.campos.forEach(field => {
            if (field.showInTable === false && field.type !== 'image' && field.type !== 'tri_state_checklist') return; // Opcional: filtrar si se quiere menos info

            const val = item[field.name];
            let displayVal = val || '-';

            // Formateo especial para PDF
            if (field.type === 'firestore_select') {
                const options = dynamicOptions[field.name] || [];
                const selected = options.find(o => o.value === val);
                displayVal = selected ? selected.label : (val || '-');
            } else if (field.type === 'select_with_description') {
                displayVal = val;
            } else if (typeof val === 'object' && val !== null) {
                // Checklist Triestado o normal
                if (field.type === 'tri_state_checklist') {
                    displayVal = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(' | ');
                } else if (field.type === 'checklist' || Array.isArray(val)) {
                    displayVal = (val || []).join(', ');
                } else {
                    displayVal = JSON.stringify(val);
                }
            }

            // No mostrar imágenes grandes en la tabla, mejor al final
            if (field.type !== 'image') {
                rows += `
                    <tr>
                        <td style="padding: 5px; border: 1px solid #ccc; font-weight: bold; width: 40%; background: #f9f9f9;">${field.label}</td>
                        <td style="padding: 5px; border: 1px solid #ccc;">${displayVal}</td>
                    </tr>
                `;
            }
        });

        const table = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tbody>${rows}</tbody>
            </table>
        `;

        // 3. Imágenes (Si las hay)
        let imagesHtml = '';
        const imageFields = config.campos.filter(c => c.type === 'image' && item[c.name]);
        if (imageFields.length > 0) {
            imagesHtml = '<div style="margin-top: 20px; page-break-inside: avoid;"><h4>Registro Fotográfico</h4><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
            imageFields.forEach(f => {
                imagesHtml += `
                    <div style="text-align: center; width: 45%;">
                        <img src="${item[f.name]}" style="max-width: 100%; max-height: 150px; border: 1px solid #ccc;" />
                        <p style="font-size: 10px;">${f.label}</p>
                    </div>
                `;
            });
            imagesHtml += '</div></div>';
        }

        // 4. Firmas
        const signatures = `
            <div style="margin-top: 50px; page-break-inside: avoid;">
                <table style="width: 100%; margin-top: 50px;">
                    <tr>
                        <td style="width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 10px;">
                            <strong>ENTREGADO POR</strong><br/>
                            Firma y Nombre
                        </td>
                        <td style="width: 10%;"></td>
                        <td style="width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 10px;">
                            <strong>RECIBIDO POR</strong><br/>
                            Firma y Cédula:<br/>
                            ${item.identificacion_propietario || item.cedula_responsable || '_________________'}
                        </td>
                    </tr>
                </table>
            </div>
            <div style="margin-top: 20px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 5px;">
                Generado automáticamente por Plataforma S.S.T.
            </div>
        `;

        element.innerHTML = header + table + imagesHtml + signatures;

        const opt = {
            margin: 10,
            filename: `Acta_${config.titulo}_${item.id.substring(0, 6)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    // Eliminar
    const handleDelete = async (id) => {
        if (window.confirm('Â¿EstÃ¡s seguro de eliminar este elemento?')) {
            await deleteDoc(doc(db, config.coleccion, id));
        }
    };

    // Manejar cambios en inputs Checkbox (Array)
    const handleChecklistChange = (fieldName, option) => {
        const currentValues = formData[fieldName] || [];
        if (currentValues.includes(option)) {
            setFormData({ ...formData, [fieldName]: currentValues.filter(v => v !== option) });
        } else {
            setFormData({ ...formData, [fieldName]: [...currentValues, option] });
        }
    };

    // Manejar cambios en inputs de Cantidad (Checklist con Valor)
    const handleQuantityChange = (fieldName, item, value) => {
        const currentData = formData[fieldName] || {};
        // Si el valor estÃ¡ vacÃ­o, lo eliminamos del objeto para no guardar basura
        if (value === '' || value === '0') {
            const newData = { ...currentData };
            delete newData[item];
            setFormData({ ...formData, [fieldName]: newData });
        } else {
            setFormData({ ...formData, [fieldName]: { ...currentData, [item]: value } });
        }
    };

    // Buscar en CatÃ¡logo Global
    const handleCatalogSearch = async (text) => {
        setCatalogQuery(text);
        if (text.length < 3) {
            setCatalogSuggestions([]);
            return;
        }

        try {
            // Busqueda simple por prefijo (case-sensitive en Firestore por defecto, idealmente normalizar)
            const q = query(
                collection(db, 'catalogo_global_activos'),
                where('nombre', '>=', text),
                where('nombre', '<=', text + '\uf8ff'),
                limit(5)
            );
            const snapshot = await getDocs(q);
            setCatalogSuggestions(snapshot.docs.map(d => d.data().nombre));
        } catch (error) {
            console.error("Error buscando en catÃ¡logo:", error);
        }
    };

    // Agregar al CatÃ¡logo Global
    const addToGlobalCatalog = async (fieldName) => {
        if (!catalogQuery) return;
        const nombre = catalogQuery.trim(); // Guardar como estÃ¡ escrito (respetando mayÃºsculas del usuario)

        try {
            // Verificar si ya existe (para no duplicar exactos)
            const q = query(collection(db, 'catalogo_global_activos'), where('nombre', '==', nombre));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                alert("Este Ã­tem ya existe en el catÃ¡logo global.");
            } else {
                await addDoc(collection(db, 'catalogo_global_activos'), {
                    nombre,
                    creadoPor: user.email,
                    fechaCreacion: new Date().toISOString()
                });
                alert("Â¡Agregado al CatÃ¡logo Global! Ahora todos pueden verlo.");
            }
            // Seleccionar el Ã­tem
            setFormData({ ...formData, [fieldName]: nombre });
            setCatalogSuggestions([]);
        } catch (error) {
            console.error("Error creando catÃ¡logo:", error);
            alert("Error al conectar con el catÃ¡logo global.");
        }
    };

    // Seleccionar sugerencia
    const selectCatalogItem = (fieldName, val) => {
        setFormData({ ...formData, [fieldName]: val });
        setCatalogQuery(val);
        setCatalogSuggestions([]);
    };

    // Manejar subida de imagenes
    const handleImageUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `inventarios/${config.filtroCategoria}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setFormData({ ...formData, [fieldName]: url });
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert("Error al subir la imagen");
        }
        setUploading(false);
    };

    // Generar CÃ³digo AutomÃ¡tico
    const generateNextCode = (fieldName) => {
        let prefix = "INV";

        // 1. Determinar Prefijo Inteligente
        if (config.id === 'alturas' && formData.tipo_equipo) {
            // Ejemplo: Eslinga -> ESL, ArnÃ©s -> ARN
            prefix = formData.tipo_equipo.substring(0, 3).toUpperCase();
        } else if (config.filtroCategoria === 'botiquin') {
            prefix = "BOT";
        } else if (config.filtroCategoria === 'extintores') {
            prefix = "EXT";
        } else if (config.filtroCategoria === 'gabinetes') {
            prefix = "GAB";
        } else if (formData.familia) {
            prefix = formData.familia.substring(0, 3).toUpperCase();
        } else if (config.titulo) {
            // Fallback: Primeras 3 letras del tÃ­tulo (ej: Inventario -> INV)
            // Pero mejor usar un default controlado
        }

        // 2. Buscar consecutivo mÃ¡ximo actual para ese prefijo
        // Filtramos items que empiecen con ese prefijo y tengan formato PREFIJO-NUMERO
        const relevantItems = items.filter(i => {
            const val = i[fieldName]; // codigo_interno o codigo
            return typeof val === 'string' && val.startsWith(prefix + '-');
        });

        let maxNum = 0;
        relevantItems.forEach(item => {
            const val = item[fieldName];
            const parts = val.split('-');
            if (parts.length === 2) {
                const num = parseInt(parts[1]);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });

        const nextNum = maxNum + 1;
        const newCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;

        setFormData({ ...formData, [fieldName]: newCode });
    };

    // Renderizar Input DinÃ¡mico
    const renderInput = (field) => {
        // LÃ³gica especial para campo de CÃ³digo con botÃ³n de Generar
        if ((field.name === 'codigo' || field.name === 'codigo_interno') && field.type === 'text') {
            return (
                <div className="input-group">
                    <Form.Control
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        required={field.required}
                        placeholder={field.placeholder || "Ej: BOT-001"}
                    />
                    <Button
                        variant="outline-secondary"
                        onClick={() => generateNextCode(field.name)}
                        title="Generar cÃ³digo consecutivo automÃ¡tico"
                    >
                        ⚡ Generar
                    </Button>
                </div>
            );
        }

        switch (field.type) {
            case 'select':
                return (
                    <Form.Select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        required={field.required}
                    >
                        <option value="">Seleccione...</option>
                        {field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </Form.Select>
                );
            case 'select_with_description':
                // Buscar la descripciÃ³n de la opciÃ³n seleccionada
                const selectedOpt = field.options.find(o => o.value === formData[field.name]);
                return (
                    <div>
                        <Form.Select
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(e, field.name)}
                            required={field.required}
                        >
                            <option value="">Seleccione...</option>
                            {field.options.map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.value}</option>
                            ))}
                        </Form.Select>
                        {selectedOpt && (
                            <Form.Text className="text-muted d-block mt-1">
                                <i className="bi bi-info-circle me-1"></i>
                                {selectedOpt.desc}
                            </Form.Text>
                        )}
                    </div>
                );
            case 'global_catalog_select':
                return (
                    <div>
                        <div className="input-group mb-1">
                            <Form.Control
                                type="text"
                                placeholder={field.placeholder || "Buscar en catÃ¡logo global..."}
                                value={formData[field.name] || catalogQuery}
                                onChange={(e) => {
                                    handleInputChange(e, field.name);
                                    handleCatalogSearch(e.target.value);
                                }}
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => addToGlobalCatalog(field.name)}
                                title="Crear en CatÃ¡logo Global si no existe"
                            >
                                <Plus size={18} /> Crear Nuevo
                            </Button>
                        </div>
                        {/* Lista de Sugerencias */}
                        {catalogSuggestions.length > 0 && (
                            <ul className="list-group position-absolute shadow w-50" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                {catalogSuggestions.map((sug, idx) => (
                                    <li
                                        key={idx}
                                        className="list-group-item list-group-item-action cursor-pointer"
                                        onClick={() => selectCatalogItem(field.name, sug)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {sug}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Form.Text className="text-muted">
                            Si no aparece en la lista, escrÃ­balo completo y haga clic en "Crear Nuevo" para compartirlo con la comunidad.
                        </Form.Text>
                        <Form.Text className="text-muted">
                            Si no aparece en la lista, escrÃ­balo completo y haga clic en "Crear Nuevo" para compartirlo con la comunidad.
                        </Form.Text>
                    </div>
                );
            case 'firestore_select':
                return (
                    <Form.Select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        required={field.required}
                    >
                        <option value="">Seleccione...</option>
                        {(dynamicOptions[field.name] || []).map((opt, idx) => (
                            <option key={idx} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </Form.Select>
                );
            case 'textarea':
                return (
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        placeholder={field.placeholder}
                    />
                );
            case 'image':
                return (
                    <div className="border p-2 rounded">
                        {formData[field.name] ? (
                            <div className="mb-2 text-center position-relative">
                                <img
                                    src={formData[field.name]}
                                    alt="Vista previa"
                                    style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '4px' }}
                                />
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="position-absolute top-0 end-0 m-1"
                                    onClick={() => setFormData({ ...formData, [field.name]: '' })}
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, field.name)}
                                    disabled={uploading}
                                    style={{ display: 'none' }}
                                    id={`file-upload-${field.name}`}
                                />
                                <label htmlFor={`file-upload-${field.name}`} className="w-100">
                                    <Button
                                        variant="outline-secondary"
                                        className="w-100 d-flex align-items-center justify-content-center gap-2"
                                        as="span"
                                        disabled={uploading}
                                    >
                                        <Camera size={20} />
                                        {uploading ? 'Subiendo...' : 'Tomar Foto / Cargar'}
                                    </Button>
                                </label>
                            </>
                        )}
                    </div>
                );
            case 'dependent_select':
                // LÃ³gica de Familia -> Tipo
                const catalog = field.catalog || {};
                const familias = Object.keys(catalog);

                // Valores actuales
                const currentFamily = formData['familia'] || '';
                const currentType = formData['tipo_equipo'] || '';
                const currentSubtype = formData['subtipo'] || '';

                const handleFamilyChange = (e) => {
                    const newFamily = e.target.value;
                    setFormData({
                        ...formData,
                        familia: newFamily,
                        tipo_equipo: '', // Reset tipo
                        subtipo: '' // Reset subtype
                    });
                };

                const handleTypeChange = (e) => {
                    const newType = e.target.value;
                    setFormData({
                        ...formData,
                        tipo_equipo: newType,
                        subtipo: newType === 'Otro (Personalizado)' ? '' : ''
                    });
                };

                const availableTypes = catalog[currentFamily] || [];

                return (
                    <div className="border p-3 rounded bg-light">
                        {/* 1. Selector de Familia */}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold text-primary">Familia del Equipo</Form.Label>
                            <Form.Select
                                value={currentFamily}
                                onChange={handleFamilyChange}
                                required={field.required}
                            >
                                <option value="">Seleccione Familia...</option>
                                {familias.map((f, i) => <option key={i} value={f}>{f}</option>)}
                            </Form.Select>
                        </Form.Group>

                        {/* 2. Selector de Tipo (Dependiente) */}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold text-primary">Tipo de Equipo</Form.Label>
                            <Form.Select
                                value={currentType}
                                onChange={handleTypeChange}
                                required={field.required}
                                disabled={!currentFamily}
                            >
                                <option value="">Seleccione Tipo...</option>
                                {availableTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                            </Form.Select>
                        </Form.Group>

                        {/* 3. Input Custom si es "Otro" */}
                        {currentType === 'Otro (Personalizado)' && (
                            <Form.Group>
                                <Form.Label className="fw-bold text-danger">Especifique el Nombre Personalizado</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={currentSubtype}
                                    onChange={(e) => setFormData({ ...formData, subtipo: e.target.value })}
                                    placeholder="Ej: TrÃ­pode Especial de Rescate X200"
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Este nombre se guardarÃ¡ como el subtipo del equipo.
                                </Form.Text>
                            </Form.Group>
                        )}
                    </div>
                );
            case 'checklist':
                return (
                    <div className="border p-2 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {field.options.map((opt, idx) => (
                            <Form.Check
                                key={idx}
                                type="checkbox"
                                label={opt}
                                checked={(formData[field.name] || []).includes(opt)}
                                onChange={() => handleChecklistChange(field.name, opt)}
                            />
                        ))}
                    </div>
                );
            case 'checklist_with_quantity':
                return (
                    <div className="border p-2 rounded bg-light" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <small className="text-muted d-block mb-2">Ingrese la cantidad para los elementos disponibles:</small>
                        {field.options.map((opt, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                                <label className="small mb-0 flex-grow-1" style={{ lineHeight: '1.2' }}>{opt}</label>
                                <Form.Control
                                    type="number"
                                    size="sm"
                                    style={{ width: '70px' }}
                                    placeholder="Cant."
                                    value={(formData[field.name] || {})[opt] || ''}
                                    onChange={(e) => handleQuantityChange(field.name, opt, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                );
            case 'nfpa_diamond':
                // Inicializar objeto si no existe
                const diamond = formData[field.name] || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '' };

                const handleDiamondChange = (subField, value) => {
                    setFormData({ ...formData, [field.name]: { ...diamond, [subField]: value } });
                };

                return (
                    <div className="d-flex justify-content-center p-3 border rounded bg-light">
                        <div style={{ width: '200px', position: 'relative', height: '200px' }}>
                            {/* Azul - Salud (Izquierda) */}
                            <div style={{ position: 'absolute', left: '0', top: '50px', width: '100px', height: '100px', backgroundColor: '#007bff', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.salud}
                                    onChange={(e) => handleDiamondChange('salud', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                >
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </Form.Control>
                            </div>

                            {/* Rojo - Inflamabilidad (Arriba) */}
                            <div style={{ position: 'absolute', left: '50px', top: '0', width: '100px', height: '100px', backgroundColor: '#dc3545', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.inflamabilidad}
                                    onChange={(e) => handleDiamondChange('inflamabilidad', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                >
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </Form.Control>
                            </div>

                            {/* Amarillo - Reactividad (Derecha) */}
                            <div style={{ position: 'absolute', left: '100px', top: '50px', width: '100px', height: '100px', backgroundColor: '#ffc107', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.reactividad}
                                    onChange={(e) => handleDiamondChange('reactividad', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                >
                                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                </Form.Control>
                            </div>

                            {/* Blanco - Especial (Abajo) */}
                            <div style={{ position: 'absolute', left: '50px', top: '100px', width: '100px', height: '100px', backgroundColor: 'white', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ccc' }}>
                                <Form.Control
                                    as="select"
                                    value={diamond.especial}
                                    onChange={(e) => handleDiamondChange('especial', e.target.value)}
                                    style={{ transform: 'rotate(-45deg)', width: '70px', textAlign: 'center', fontSize: '11px' }}
                                >
                                    <option value="">-</option>
                                    <option value="OX">OX (Oxidante)</option>
                                    <option value="W"><s>W</s> (No Agua)</option>
                                    <option value="ACID">ACID</option>
                                    <option value="ALC">ALC</option>
                                    <option value="BIO">BIO</option>
                                    <option value="RAD">RAD</option>
                                    <option value="COR">COR</option>
                                </Form.Control>
                            </div>
                        </div>
                    </div>
                );
            case 'ghs_pictograms':
                const selectedGHS = formData[field.name] || []; // Array de seleccionados

                const toggleGHS = (key) => {
                    const current = Array.isArray(selectedGHS) ? selectedGHS : [];
                    if (current.includes(key)) {
                        setFormData({ ...formData, [field.name]: current.filter(k => k !== key) });
                    } else {
                        setFormData({ ...formData, [field.name]: [...current, key] });
                    }
                };

                return (
                    <div className="d-flex flex-wrap gap-4 justify-content-center p-3 border rounded bg-light">
                        {GHS_DEFINITIONS.map((ghs) => {
                            const isSelected = Array.isArray(selectedGHS) && selectedGHS.includes(ghs.key);
                            return (
                                <div
                                    key={ghs.key}
                                    onClick={() => toggleGHS(ghs.key)}
                                    className={`d-flex flex-column align-items-center cursor-pointer p-1 rounded ${isSelected ? 'shadow-lg bg-white border border-primary' : 'opacity-75'}`}
                                    style={{
                                        width: '110px',
                                        cursor: 'pointer',
                                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <GHSDiamond ghs={ghs} size={60} />
                                    <span className="text-center small fw-bold mt-1" style={{ lineHeight: '1.2' }}>{ghs.label}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'tri_state_checklist':
                const checklistData = formData[field.name] || {};
                const handleTriStateChange = (item, val) => {
                    setFormData({ ...formData, [field.name]: { ...checklistData, [item]: val } });
                };

                return (
                    <div className="border rounded bg-light p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <Table size="sm" borderless className="mb-0">
                            <thead>
                                <tr>
                                    <th>Ítem</th>
                                    <th className="text-center" width="50">Si</th>
                                    <th className="text-center" width="50">No</th>
                                    <th className="text-center" width="60">N/A</th>
                                </tr>
                            </thead>
                            <tbody>
                                {field.options.map((opt, idx) => (
                                    <tr key={idx} className="border-bottom">
                                        <td className="small align-middle">{opt}</td>
                                        <td className="text-center">
                                            <Form.Check
                                                type="radio"
                                                name={`tri_state_${field.name}_${idx}`}
                                                checked={checklistData[opt] === 'Si'}
                                                onChange={() => handleTriStateChange(opt, 'Si')}
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Form.Check
                                                type="radio"
                                                name={`tri_state_${field.name}_${idx}`}
                                                checked={checklistData[opt] === 'No'}
                                                onChange={() => handleTriStateChange(opt, 'No')}
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Form.Check
                                                type="radio"
                                                name={`tri_state_${field.name}_${idx}`}
                                                checked={checklistData[opt] === 'N/A'}
                                                onChange={() => handleTriStateChange(opt, 'N/A')}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                );
            default: // text, date, number
                return (
                    <Form.Control
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(e, field.name)}
                        required={field.required}
                        placeholder={field.placeholder}
                    />
                );
        }
    };

    // Renderizar Celda Personalizada (Tabla)
    const renderCell = (item, field) => {
        try {
            const value = item[field.name];

            if (field.type === 'nfpa_diamond') {
                const diamond = value || { salud: 0, inflamabilidad: 0, reactividad: 0, especial: '-' };
                return (
                    <div style={{ position: 'relative', width: '40px', height: '40px', margin: '0 auto' }}>
                        {/* Mini Rombo Visual */}
                        <div style={{ position: 'absolute', top: '0', left: '10px', width: '20px', height: '20px', background: '#dc3545', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                            <span style={{ transform: 'rotate(-45deg)' }}>{diamond.inflamabilidad}</span>
                        </div>
                        <div style={{ position: 'absolute', top: '10px', left: '0', width: '20px', height: '20px', background: '#007bff', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                            <span style={{ transform: 'rotate(-45deg)' }}>{diamond.salud}</span>
                        </div>
                        <div style={{ position: 'absolute', top: '10px', left: '20px', width: '20px', height: '20px', background: '#ffc107', color: 'black', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                            <span style={{ transform: 'rotate(-45deg)' }}>{diamond.reactividad}</span>
                        </div>
                        <div style={{ position: 'absolute', top: '20px', left: '10px', width: '20px', height: '20px', background: 'white', border: '1px solid #ccc', color: 'black', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
                            <span style={{ transform: 'rotate(-45deg)', marginTop: '2px' }}>{diamond.especial || '-'}</span>
                        </div>
                    </div>
                );
            }

            if (field.type === 'checklist') {
                return (value || []).length + ' Ã­tems';
            }

            if (field.type === 'checklist_with_quantity') {
                const count = Object.keys(value || {}).length;
                return <Badge bg={count > 0 ? "success" : "secondary"}>{count} elementos</Badge>;
            }

            if (field.type === 'image') {
                return value ? (
                    <img
                        src={value}
                        alt="Img"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => { setViewingItem(item); setViewModalOpen(true); }}
                    />
                ) : <span className="text-muted small">Sin foto</span>;
            }

            if (field.type === 'ghs_pictograms') {
                const selected = value || []; // Array de strings
                if (!Array.isArray(selected) || selected.length === 0) return '-';

                return (
                    <div className="d-flex gap-1 justify-content-center flex-wrap">
                        {selected.map((k, i) => {
                            const ghs = GHS_DEFINITIONS.find(g => g.key === k);
                            if (!ghs) return null;
                            return (
                                <div key={i} title={ghs.label}>
                                    <GHSDiamond ghs={ghs} size={40} />
                                </div>
                            );
                        })}
                    </div>
                );
            }

            if (field.type === 'tri_state_checklist') {
                const data = value || {};
                const countSi = Object.values(data).filter(v => v === 'Si').length;
                return (
                    <Badge bg="info">{countSi} / {field.options.length}</Badge>
                );
            }

            if (field.name === 'fechaProximaRecarga' && value) {
                const dateVal = new Date(value);
                const today = new Date();
                const diffTime = dateVal - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let variant = 'success';
                let msg = 'Vigente';

                if (diffDays < 0) {
                    variant = 'danger';
                    msg = `Vencido hace ${Math.abs(diffDays)} dÃ­as`;
                } else if (diffDays <= 30) {
                    variant = 'warning';
                    msg = `Vence en ${diffDays} dÃ­as`;
                    return (
                        <div className="d-flex flex-column align-items-center">
                            <span className="mb-1">{value}</span>
                            <Badge bg={variant}>{msg}</Badge>
                        </div>
                    );
                }

                return value;
            }

            // Fallback para objetos no manejados (evita crash)
            if (typeof value === 'object' && value !== null) {
                return <small className="text-muted" title={JSON.stringify(value)}>{Object.keys(value).length} datos</small>;
            }

            // Renderizado especial para Alturas en la tabla
            if (field.type === 'dependent_select') {
                const familia = item['familia'] || '-';
                const tipo = item['tipo_equipo'] || '-';
                const subtipo = item['subtipo'];

                return (
                    <div className="text-start">
                        <Badge bg="primary" className="mb-1">{familia}</Badge>
                        <div className="fw-bold">{tipo}</div>
                        {tipo === 'Otro (Personalizado)' && subtipo && (
                            <div className="text-muted small fst-italic">"{subtipo}"</div>
                        )}
                    </div>
                );
            }

            // --- SAFE GUARD: Evitar que Objetos rompan el render ---
            if (typeof value === 'object' && value !== null && !React.isValidElement(value)) {
                return JSON.stringify(value);
            }

            return value;
        } catch (err) {
            console.error("Error renderizando celda:", err);
            return <span className="text-danger small">Error</span>;
        }
    };

    // Campos a mostrar en la tabla (filtrados por showInTable o los primeros 5 por defecto)
    const tableFields = config.campos.filter(f => f.showInTable);
    const fieldsToRender = tableFields.length > 0 ? tableFields : config.campos.slice(0, 5);

    // Estado para bÃºsqueda local y conteo
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar items basado en la bÃºsqueda
    const filteredItems = items.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();

        // Buscar en todos los valores del objeto
        return Object.values(item).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(searchLower);
        });
    });

    // Exportar a Excel
    const handleExportExcel = () => {
        if (filteredItems.length === 0) return alert("No hay datos para exportar");

        const dataToExport = filteredItems.map(item => {
            const row = {};
            // Mapear cada campo segÃºn la configuraciÃ³n
            config.campos.forEach(field => {
                // OMITIR IMÃGENES: No exportar columnas de tipo imagen
                if (field.type === 'image') return;

                const val = item[field.name];

                // Formatear valores especiales
                if (val === null || val === undefined) {
                    row[field.label] = '';
                } else if (field.type === 'checklist') {
                    row[field.label] = Array.isArray(val) ? val.join(', ') : val;
                } else if (field.type === 'ghs_pictograms') {
                    row[field.label] = Array.isArray(val) ? val.join(', ') : val;
                } else if (field.type === 'nfpa_diamond') {
                    row[field.label] = `Salud: ${val.salud}, Inflam: ${val.inflamabilidad}, React: ${val.reactividad}, Esp: ${val.especial || '-'}`;
                } else if (field.type === 'checklist_with_quantity') {
                    row[field.label] = Object.entries(val || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('; ');
                } else {
                    row[field.label] = val;
                }
            });
            return row;
        });

        const ws = utils.json_to_sheet(dataToExport);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Inventario");
        writeFile(wb, `${config.titulo.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Exportar a PDF
    const [pdfGenerating, setPdfGenerating] = useState(false);

    const handleExportPDF = () => {
        if (filteredItems.length === 0) return alert("No hay datos para exportar");
        setPdfGenerating(true);

        // Esperar a que el estado actualice el DOM y muestre el contenedor
        setTimeout(() => {
            const element = document.getElementById('inventory-pdf-container');

            const opt = {
                margin: 10, // mm
                filename: `${config.titulo.replace(/ /g, '_')}_Reporte.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                setPdfGenerating(false);
            }).catch(err => {
                console.error("Error generando PDF:", err);
                setPdfGenerating(false);
                alert("Error al generar el PDF. Intente nuevamente.");
            });
        }, 500);
    };

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0 text-primary">{config.titulo}</h4>
                    <span className="text-muted small">
                        Total Registros: <strong>{items.length}</strong>
                        {searchTerm && filteredItems.length !== items.length && (
                            <span> (Filtrados: {filteredItems.length})</span>
                        )}
                    </span>
                </div>

                <div className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Buscar en este inventario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '250px' }}
                    />
                    <Button
                        variant="outline-danger"
                        onClick={handleExportPDF}
                        disabled={pdfGenerating}
                        title="Descargar Reporte PDF"
                        className="d-flex align-items-center"
                    >
                        <FileText size={18} className="me-2" />
                        {pdfGenerating ? 'Generando...' : 'PDF'}
                    </Button>
                    <Button variant="outline-success" onClick={handleExportExcel} title="Descargar Excel">
                        <FileText size={18} className="me-2" />
                        Excel
                    </Button>
                    <Button onClick={() => openModal()} variant="success">
                        <Plus size={18} className="me-2" />
                        Agregar Nuevo
                    </Button>
                </div>
            </div>

            {loading ? (
                <p>Cargando inventario...</p>
            ) : filteredItems.length === 0 ? (
                <Alert variant="info">
                    {items.length === 0 ? "No hay elementos registrados en este inventario." : "No se encontraron resultados para tu bÃºsqueda."}
                </Alert>
            ) : (
                <div className="table-responsive shadow-sm rounded">
                    <Table hover striped bordered className="align-middle">
                        <thead className="bg-light">
                            <tr>
                                {fieldsToRender.map((field, idx) => (
                                    <th key={idx} className="text-center">{field.label}</th>
                                ))}
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id}>
                                    {fieldsToRender.map((field, idx) => (
                                        <td key={idx} className="text-center">
                                            {renderCell(item, field)}
                                        </td>
                                    ))}
                                    <td className="text-center">
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            className="me-2"
                                            title="Ver Detalle"
                                            onClick={() => openViewModal(item)}
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => openModal(item)}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Modal de CreaciÃ³n/EdiciÃ³n */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? 'Editar Elemento' : 'Nuevo Elemento'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <div className="row">
                            {config.campos.map((field, idx) => (
                                <div key={idx} className="col-md-6 mb-3">
                                    <Form.Group>
                                        <Form.Label>{field.label}</Form.Label>
                                        {renderInput(field)}
                                    </Form.Group>
                                </div>
                            ))}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de VisualizaciÃ³n (Solo Lectura) */}
            <Modal show={viewModalOpen} onHide={() => setViewModalOpen(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Detalle del Elemento</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {viewingItem && (
                        <div className="row">
                            {config.campos.map((field, idx) => {
                                const val = viewingItem[field.name];
                                return (
                                    <div key={idx} className="col-md-6 mb-4">
                                        <h6 className="text-muted small text-uppercase mb-1">{field.label}</h6>

                                        {field.type === 'nfpa_diamond' ? (
                                            // Renderizar Rombo ReadOnly
                                            renderCell(viewingItem, field)
                                        ) : field.type === 'checklist_with_quantity' ? (
                                            // Renderizar Lista de Cantidades
                                            <div className="border rounded p-2 bg-light">
                                                {val && Object.keys(val).length > 0 ? (
                                                    <ul className="list-unstyled mb-0 small">
                                                        {Object.entries(val).map(([k, v], i) => (
                                                            <li key={i} className="d-flex justify-content-between border-bottom py-1">
                                                                <span>{k}</span>
                                                                <Badge bg="primary" pill>{v}</Badge>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <span className="text-muted fst-italic">Sin elementos registrados</span>}
                                            </div>
                                        ) : field.type === 'checklist' ? (
                                            <ul className="list-unstyled mb-0 small border rounded p-2 bg-light">
                                                {val && val.length > 0 ? val.map((opt, i) => (
                                                    <li key={i}>✓ {opt}</li>
                                                )) : <span className="text-muted">Ninguno</span>}
                                            </ul>
                                        ) : field.type === 'firestore_select' ? (
                                            // Renderizar Select Firestore (Buscar Label en dynamicOptions)
                                            <p className="fw-bold mb-0">
                                                {(() => {
                                                    const options = dynamicOptions[field.name] || [];
                                                    const selected = options.find(o => o.value === val);
                                                    return selected ? selected.label : (val || '-');
                                                })()}
                                            </p>
                                        ) : field.type === 'tri_state_checklist' ? (
                                            // Renderizar Checklist Triestado
                                            <div className="border rounded p-2 bg-light small">
                                                {val && Object.keys(val).length > 0 ? (
                                                    <table className="table table-sm table-borderless mb-0">
                                                        <tbody>
                                                            {Object.entries(val).map(([k, v], i) => {
                                                                let badgeBg = 'secondary';
                                                                if (v === 'Si') badgeBg = 'success';
                                                                if (v === 'No') badgeBg = 'danger';
                                                                return (
                                                                    <tr key={i} className="border-bottom">
                                                                        <td width="70%">{k}</td>
                                                                        <td width="30%" className="text-end">
                                                                            <Badge bg={badgeBg}>{v}</Badge>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                ) : <span className="text-muted">Sin datos</span>}
                                            </div>
                                        ) : field.type !== 'image' && (
                                            // Texto plano (Fallback seguro)
                                            <p className="fw-bold mb-0">
                                                {typeof val === 'object' && val !== null ? JSON.stringify(val) : (val || '-')}
                                            </p>
                                        )}

                                        {/* Caso Especial: Si es Imagen renderizar abajo */}
                                        {field.type === 'image' && val && (
                                            <div className="mt-2 text-center">
                                                <img src={val} alt="Detalle" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '300px' }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-primary" onClick={() => handleDownloadPdf(viewingItem)}>
                        <FileText size={18} className="me-2" />
                        Descargar Acta PDF
                    </Button>
                    <Button variant="secondary" onClick={() => setViewModalOpen(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
            {pdfGenerating && (
                <div
                    id="inventory-pdf-container"
                    style={{
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        zIndex: 99999,
                        background: 'white',
                        overflow: 'auto',
                        padding: '20px'
                    }}
                >
                    <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px', borderRadius: '5px', zIndex: 100000 }}>
                        Generando PDF... Por favor espere.
                    </div>

                    <div style={{ width: '210mm', minHeight: '297mm', background: 'white', margin: '0 auto', padding: '15mm', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                        <div className="text-center mb-4 pb-2 border-bottom">
                            <h2 className="mb-1 text-uppercase fw-bold" style={{ color: '#0d6efd' }}>{config.titulo}</h2>
                            <h5 className="text-muted">Reporte de Inventario / Acta de Entrega</h5>
                            <div className="d-flex justify-content-between mt-3 small text-muted">
                                <span><strong>Fecha de GeneraciÃ³n:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                                <span><strong>Total Ãtems:</strong> {filteredItems.length}</span>
                            </div>
                        </div>
                        {filteredItems.map((item, index) => (
                            <div key={item.id} className="border rounded p-3 mb-2 keep-together" style={{ pageBreakInside: 'avoid', backgroundColor: '#f8f9fa' }}>
                                <div className="row align-items-center">
                                    {/* InformaciÃ³n del Ãtem */}
                                    <div className="col-8">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '30px', height: '30px', fontSize: '14px', fontWeight: 'bold' }}>
                                                {index + 1}
                                            </div>
                                            <h5 className="mb-0 fw-bold">ID: {item.codigo || item.id}</h5>
                                        </div>

                                        <div className="row g-2">
                                            {config.campos.filter(f => f.type !== 'image' && f.type !== 'ghs_pictograms' && f.type !== 'nfpa_diamond').map((field, idx) => {
                                                const val = item[field.name];
                                                if (!val) return null;
                                                return (
                                                    <div key={idx} className="col-6" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                                        <strong className="text-secondary d-block" style={{ fontSize: '10px' }}>{field.label}:</strong>
                                                        {field.type === 'checklist' || field.type === 'checklist_with_quantity' ? (
                                                            <span>{renderCell(item, field)}</span>
                                                        ) : (
                                                            <span>{val}</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Visuales (Foto y Rombos) */}
                                    <div className="col-4 d-flex flex-column align-items-center justify-content-center border-start ps-3">
                                        {/* Imagen Principal */}
                                        {config.campos.find(f => f.type === 'image') && item[config.campos.find(f => f.type === 'image').name] ? (
                                            <img
                                                src={item[config.campos.find(f => f.type === 'image').name]}
                                                alt="Item"
                                                crossOrigin="anonymous"
                                                className="img-fluid rounded border mb-2 shadow-sm"
                                                style={{ maxHeight: '120px', objectFit: 'contain', backgroundColor: 'white' }}
                                            />
                                        ) : (
                                            <div className="text-center text-muted border rounded d-flex align-items-center justify-content-center p-2 mb-2" style={{ width: '80px', height: '80px', backgroundColor: '#e9ecef', fontSize: '10px' }}>
                                                Sin Foto
                                            </div>
                                        )}

                                        {/* Rombos y Pictogramas */}
                                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                                            {config.campos.find(f => f.type === 'nfpa_diamond') && (
                                                <div style={{ transform: 'scale(0.8)' }}>
                                                    {renderCell(item, config.campos.find(f => f.type === 'nfpa_diamond'))}
                                                </div>
                                            )}
                                            {config.campos.find(f => f.type === 'ghs_pictograms') && (
                                                <div style={{ transform: 'scale(0.8)' }}>
                                                    {renderCell(item, config.campos.find(f => f.type === 'ghs_pictograms'))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Pie de PÃ¡gina / Firmas */}
                        <div className="mt-5 pt-5 border-top">
                            <div className="row text-center mt-3">
                                <div className="col-6">
                                    <div className="border-top border-dark w-75 mx-auto pt-2" style={{ borderTopWidth: '2px !important' }}>
                                        <strong>Entregado Por</strong><br />
                                        <span className="small text-muted">{user?.email}</span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="border-top border-dark w-75 mx-auto pt-2" style={{ borderTopWidth: '2px !important' }}>
                                        <strong>Recibido Por</strong><br />
                                        <span className="small text-muted">Nombre y Firma</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default GestorInventario;
