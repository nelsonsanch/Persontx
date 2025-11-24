// src/components/cliente/TrabajadoresUtils.js

import { toast } from 'react-toastify';

// Función para validar cédula
export const validarCedula = (cedula) => {
  if (!cedula || cedula.trim() === '') {
    toast.error('La cédula es obligatoria');
    return false;
  }
  
  if (!/^\d{6,12}$/.test(cedula)) {
    toast.error('La cédula debe tener entre 6 y 12 dígitos');
    return false;
  }
  
  return true;
};

// Función para formatear nombre
export const formatearNombre = (nombre) => {
  if (!nombre) return '';
  return nombre.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Función para calcular edad
export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 0;
  
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};

// Función para validar email
export const validarEmail = (email) => {
  if (!email) return true; // Email es opcional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para formatear teléfono
export const formatearTelefono = (telefono) => {
  if (!telefono) return '';
  
  // Remover caracteres no numéricos
  const numeros = telefono.replace(/\D/g, '');
  
  // Formatear según longitud
  if (numeros.length === 10) {
    return `${numeros.slice(0, 3)}-${numeros.slice(3, 6)}-${numeros.slice(6)}`;
  }
  
  return telefono;
};

// Función para validar formulario completo
export const validarFormularioTrabajador = (formData) => {
  const errores = [];
  
  if (!formData.nombres || formData.nombres.trim() === '') {
    errores.push('El nombre es obligatorio');
  }
  
  if (!formData.apellidos || formData.apellidos.trim() === '') {
    errores.push('Los apellidos son obligatorios');
  }
  
  if (!validarCedula(formData.numeroDocumento)) {
    errores.push('Cédula inválida');
  }
  
  if (formData.correoElectronico && !validarEmail(formData.correoElectronico)) {
    errores.push('Email inválido');
  }
  
  return errores;
};

// Función para generar código único
export const generarCodigoTrabajador = () => {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().slice(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `TR-${año}${mes}${dia}-${random}`;
};