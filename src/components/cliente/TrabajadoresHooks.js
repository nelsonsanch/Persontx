// src/components/cliente/TrabajadoresHooks.js

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { toast } from 'react-toastify';

// Hook para manejar trabajadores
export const useTrabajadores = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarTrabajadores = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        collection(db, 'trabajadores'),
        where('clienteId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const trabajadoresData = [];
      
      querySnapshot.forEach((doc) => {
        trabajadoresData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setTrabajadores(trabajadoresData);
      setError(null);
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      setError(error.message);
      toast.error('Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  return { 
    trabajadores, 
    setTrabajadores, 
    loading, 
    error, 
    cargarTrabajadores 
  };
};

// Hook para manejar filtros
export const useFiltros = () => {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    cargo: '',
    area: ''
  });

  const aplicarFiltros = (trabajadores) => {
    return trabajadores.filter(trabajador => {
      const cumpleBusqueda = !filtros.busqueda || 
        trabajador.nombres?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        trabajador.apellidos?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        trabajador.numeroDocumento?.includes(filtros.busqueda);
      
      const cumpleEstado = !filtros.estado || trabajador.estado === filtros.estado;
      
      const cumpleCargo = !filtros.cargo || trabajador.cargo === filtros.cargo;
      
      const cumpleArea = !filtros.area || trabajador.area === filtros.area;
      
      return cumpleBusqueda && cumpleEstado && cumpleCargo && cumpleArea;
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: '',
      cargo: '',
      area: ''
    });
  };

  return { 
    filtros, 
    setFiltros, 
    aplicarFiltros, 
    limpiarFiltros 
  };
};

// Hook para manejar perfiles de cargo
export const usePerfilesCargo = () => {
  const [perfilesCargo, setPerfilesCargo] = useState([]);
  const [loadingPerfiles, setLoadingPerfiles] = useState(true);

  const cargarPerfilesCargo = async () => {
    try {
      setLoadingPerfiles(true);
      const user = auth.currentUser;
      
      if (!user) return;

      const q = query(
        collection(db, 'perfiles_cargo'),
        where('clienteId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const perfilesData = [];
      
      querySnapshot.forEach((doc) => {
        perfilesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ordenar alfabéticamente
      perfilesData.sort((a, b) => 
        (a.nombrePuesto || '').localeCompare(b.nombrePuesto || '')
      );
      
      setPerfilesCargo(perfilesData);
    } catch (error) {
      console.error('Error cargando perfiles de cargo:', error);
    } finally {
      setLoadingPerfiles(false);
    }
  };

  useEffect(() => {
    cargarPerfilesCargo();
  }, []);

  return { 
    perfilesCargo, 
    loadingPerfiles, 
    cargarPerfilesCargo 
  };
};