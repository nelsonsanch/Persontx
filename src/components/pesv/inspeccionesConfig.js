export const PREOP_CHECKLIST = [
    {
        category: "1. Estado de Presentación",
        items: [
            { id: "pres_aseo_interno", label: "1.1 Aseo Interno", critical: false },
            { id: "pres_aseo_externo", label: "1.2 Aseo Externo", critical: false },
            { id: "pres_latas", label: "1.3 Latas", critical: false },
            { id: "pres_pintura", label: "1.4 Pintura", critical: false },
        ]
    },
    {
        category: "2. Estado de Comodidad",
        items: [
            { id: "com_aire", label: "2.1 Aire Acondicionado", critical: false },
            { id: "com_silleteria", label: "2.2 Silletería (Anclaje, estado)", critical: false },
            { id: "com_encendedor", label: "2.3 Encendedor", critical: false },
            { id: "com_luz_interior", label: "2.4 Luz Interior o de techo", critical: false },
        ]
    },
    {
        category: "3. Niveles y pérdidas de líquidos",
        items: [
            { id: "liq_nivel_aceite", label: "3.1 Nivel de Aceite de motor", critical: true },
            { id: "liq_nivel_frenos", label: "3.2 Nivel de liquido de frenos", critical: true },
            { id: "liq_nivel_agua_rad", label: "3.3 Nivel de agua del radiador", critical: true },
            { id: "liq_nivel_agua_bat", label: "3.4 Nivel de agua de la batería", critical: false },
            { id: "liq_nivel_hidraulico", label: "3.5 Nivel de aceite hidráulico", critical: false },
            { id: "liq_fuga_acpm", label: "3.6 Fugas de Combustible", critical: true },
            { id: "liq_fuga_agua", label: "3.7 Fugas de Agua", critical: true },
            { id: "liq_fuga_transmision", label: "3.8 Fugas de Aceite de transmisión", critical: true },
            { id: "liq_fuga_caja", label: "3.9 Fuga aceite de caja", critical: true },
            { id: "liq_fuga_frenos", label: "3.10 Fugas de líquidos de frenos", critical: true },
        ]
    },
    {
        category: "4. Tablero de Control",
        items: [
            { id: "tab_instrumentos", label: "4.1 Instrumentos", critical: false },
            { id: "tab_luces_tablero", label: "4.2 Luces de Tablero", critical: false },
            { id: "tab_nivel_combustible", label: "4.3 Nivel de Combustible", critical: false },
            { id: "tab_odometro", label: "4.4 Odómetro", critical: false },
            { id: "tab_pito", label: "4.5 Pito", critical: true },
            { id: "tab_tacometro", label: "4.6 Tacómetro", critical: false },
            { id: "tab_velocimetro", label: "4.7 Velocímetro", critical: false },
            { id: "tab_ind_aceite", label: "4.8 Indicador de Aceite", critical: true },
            { id: "tab_ind_temp", label: "4.9 Indicador de Temperatura", critical: true },
        ]
    },
    {
        category: "5. Seguridad Pasiva",
        items: [
            { id: "seg_cinturones", label: "5.1 Cinturones de Seguridad", critical: true },
            { id: "seg_airbags", label: "5.2 Airbags", critical: true },
            { id: "seg_chasis", label: "5.3 Chasis y carrocería", critical: false },
            { id: "seg_cristales", label: "5.4 Cristales (Vidrios)", critical: false },
            { id: "seg_apoyacabezas", label: "5.5 Apoyacabezas", critical: false },
            { id: "seg_espejo_der", label: "5.6 Espejo Lateral Derecho", critical: true },
            { id: "seg_espejo_izq", label: "5.7 Espejo Lateral Izquierdo", critical: true },
            { id: "seg_espejo_retro", label: "5.8 Espejo Retrovisor", critical: true },
        ]
    },
    {
        category: "6. Seguridad Activa",
        items: [
            { id: "act_direccion", label: "6.1 Estado de la Dirección", critical: true },
            { id: "act_susp_del", label: "6.2 Estado Suspensión Delantera, Amortiguadores", critical: false },
            { id: "act_susp_tras", label: "6.3 Estado suspensión Trasera, Amortiguadores", critical: false },
            { id: "act_parabrisas", label: "6.4 Estado Parabrisas (Vidrio, Limpiabrisas, Lava)", critical: true },
            { id: "act_luces_control", label: "6.5 Estado de Luces (Altas, Bajas, Stop, Direccionales)", critical: true },
            { id: "act_llantas", label: "6.6 Estado Llantas (Labrado, Presión, Repuesto)", critical: true },
            { id: "act_frenos", label: "6.7 Frenos (Estado, Mano, Pastillas)", critical: true },
        ]
    },
    {
        category: "7. Otros",
        items: [
            { id: "otr_elec", label: "7.1 Instalaciones eléctricas", critical: false },
            { id: "otr_clutch", label: "7.2 Clutch", critical: true },
            { id: "otr_exosto", label: "7.3 Exosto", critical: false },
            { id: "otr_alarma_reversa", label: "7.4 Alarma Sonora de Reversa", critical: true },
            { id: "otr_salto_cambios", label: "7.5 Salto de cambios", critical: false },
            { id: "otr_cambios_suaves", label: "7.6 Cambios suaves", critical: false },
            { id: "otr_guaya_acel", label: "7.7 Guaya del acelerador", critical: true },
            { id: "otr_embrague", label: "7.8 Sistema de embrague", critical: true },
            { id: "otr_encendido", label: "7.9 Encendido", critical: false },
            { id: "otr_sincro", label: "7.10 Sincronización", critical: false },
            { id: "otr_placas", label: "7.11 Placas", critical: true },
        ]
    },
    {
        category: "8. Equipo de Carretera",
        items: [
            { id: "eq_gato", label: "8.1 Gato con capacidad elevar vehículo", critical: true },
            { id: "eq_chaleco", label: "8.2 Chaleco reflectivo", critical: false },
            { id: "eq_tacos", label: "8.3 Tacos para bloquear vehículo (2)", critical: true },
            { id: "eq_senales", label: "8.4 Señales de carretera triangulares (2)", critical: true },
            { id: "eq_guantes", label: "8.5 Guantes de trabajo", critical: false },
            { id: "eq_cruceta", label: "8.6 Cruceta", critical: true },
            { id: "eq_cables", label: "8.7 Cables de iniciar", critical: false },
            { id: "eq_extintor", label: "8.8 Extintor Vigente", critical: true },
            { id: "eq_conos", label: "8.9 Conos reflectivos (2)", critical: false },
            { id: "eq_linterna", label: "8.10 Linterna recargable", critical: false },
            { id: "eq_herramientas", label: "8.11 Caja de herramientas básica", critical: false },
        ]
    },
    {
        category: "9. Botiquín",
        items: [
            { id: "bot_suero", label: "9.1 Suero fisiológico/Solución salina (2)", critical: false },
            { id: "bot_vendajes_elas", label: "9.2 Vendajes elásticos (2)", critical: false },
            { id: "bot_guantes", label: "9.3 Guantes quirúrgicos (4 juegos)", critical: false },
            { id: "bot_vendas_alg", label: "9.4 Vendas de algodón (1 paq)", critical: false },
            { id: "bot_copitos", label: "9.5 Aplicadores/Copitos (10)", critical: false },
            { id: "bot_vendajes_tri", label: "9.6 Vendajes triangulares (3)", critical: false },
            { id: "bot_apositos", label: "9.7 Apósitos o toallas (4)", critical: false },
            { id: "bot_compresas", label: "9.8 Compresas (2)", critical: false },
            { id: "bot_mascarilla", label: "9.9 Mascarilla RCP", critical: true },
            { id: "bot_tijera", label: "9.10 Tijera de trauma", critical: false },
            { id: "bot_gasa", label: "9.11 Paquetes de gasa (4)", critical: false },
            { id: "bot_alcohol", label: "9.12 Alcohol antiséptico", critical: false },
            { id: "bot_micropore", label: "9.13 Cinta micropore/Esparadrapo", critical: false },
            { id: "bot_inmov_inf", label: "9.15 Inmovilizadores ext. inferiores (2)", critical: false },
            { id: "bot_inmov_sup", label: "9.16 Inmovilizadores ext. superiores (2)", critical: false },
            { id: "bot_curitas", label: "9.17 Curitas (10)", critical: false },
            { id: "bot_tapabocas", label: "9.18 Tapabocas (10)", critical: false },
            { id: "bot_termometro", label: "9.19 Termómetro", critical: false },
            { id: "bot_libreta", label: "9.20 Libreta y Lápiz", critical: false },
            { id: "bot_manual", label: "9.23 Manual primeros auxilios", critical: false },
            { id: "bot_inmov_cerv", label: "9.24 Inmovilizador cervical", critical: true },
        ]
    }
];

export const HEAVY_MACHINERY_CHECKLIST = [
    {
        category: "Seguridad personal y del área",
        items: [
            { id: "seg_epp", label: "EPP completo según tarea (casco, botas, guantes, gafas, chaleco, etc.)", critical: true },
            { id: "seg_area", label: "Área de trabajo señalizada y sin personas en zona de riesgo", critical: true },
            { id: "seg_terreno", label: "Condiciones del terreno (pendientes, huecos, taludes, obstáculos)", critical: true },
        ]
    },
    {
        category: "Documentos y control",
        items: [
            { id: "doc_operador", label: "Operador autorizado/competente y permiso interno vigente", critical: true },
            { id: "doc_bitacora", label: "Bitácora/permiso de trabajo del día", critical: false },
        ]
    },
    {
        category: "Inspección visual exterior",
        items: [
            { id: "vis_fugas", label: "Fugas visibles (aceite, combustible, hidráulico, refrigerante)", critical: true },
            { id: "vis_mangueras", label: "Estado de mangueras, acoples y conexiones hidráulicas", critical: true },
            { id: "vis_guardas", label: "Guardas y protecciones instaladas", critical: true },
            { id: "vis_llantas", label: "Llantas/orugas (presión, cortes, tensado, rodillos)", critical: true },
            { id: "vis_pernos", label: "Pernos y pasadores de implementos con seguros", critical: true },
            { id: "vis_implemento", label: "Implemento (dientes/cuchilla/pasadores) sin fisuras", critical: true },
            { id: "vis_rops", label: "ROPS/FOPS, barandas, escalas y pasamanos", critical: true },
        ]
    },
    {
        category: "Fluidos (niveles)",
        items: [
            { id: "fl_motor", label: "Aceite de motor", critical: true },
            { id: "fl_refrig", label: "Refrigerante", critical: true },
            { id: "fl_combust", label: "Combustible", critical: false },
            { id: "fl_hidraulico", label: "Aceite hidráulico", critical: true },
            { id: "fl_transmision", label: "Transmisión/convertidor (si aplica)", critical: true },
            { id: "fl_drenaje", label: "Drenaje de agua del decantador de combustible", critical: false },
        ]
    },
    {
        category: "Cabina y controles",
        items: [
            { id: "cab_orden", label: "Cabina sin objetos sueltos; pedales/controles libres", critical: false },
            { id: "cab_asiento", label: "Asiento ajustado y en buen estado", critical: false },
            { id: "cab_cinturon", label: "Cinturón de seguridad funcional", critical: true },
            { id: "cab_espejos", label: "Espejos/cámara limpios y ajustados", critical: true },
            { id: "cab_extintor", label: "Extintor presente, asegurado y accesible", critical: true },
            { id: "cab_botiquin", label: "Botiquín/kit emergencia disponible", critical: false },
        ]
    },
    {
        category: "Arranque y tablero",
        items: [
            { id: "arr_bateria", label: "Batería/interruptor principal y bornes", critical: false },
            { id: "arr_alarmas_tab", label: "Sin alarmas críticas en tablero al encender", critical: true },
            { id: "arr_indicadores", label: "Indicadores en rango (presión aceite, temperatura, voltaje)", critical: true },
        ]
    },
    {
        category: "Pruebas funcionales",
        items: [
            { id: "func_bocina", label: "Bocina/claxon", critical: true },
            { id: "func_alarma_rev", label: "Alarma de reversa", critical: true },
            { id: "func_luces", label: "Luces de trabajo/direccionales/baliza", critical: true },
            { id: "func_freno", label: "Freno de servicio y estacionamiento", critical: true },
            { id: "func_direccion", label: "Dirección/giro", critical: true },
            { id: "func_hidraulicos", label: "Implementos/hidráulicos sin ruidos anormales", critical: true },
            { id: "func_vibracion", label: "Sin vibraciones/ruidos/olor a quemado inusual", critical: true },
        ]
    },
    {
        category: "Cierre de inspección",
        items: [
            { id: "cierr_checklist", label: "Checklist diligenciado y novedades reportadas", critical: true },
        ]
    }
];
