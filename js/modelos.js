// =========================================
// js/modelos.js
// ESTRUCTURAS DE DATOS Y PERSISTENCIA EN MEMORIA (RAM)
// =========================================

// ARRAYS PRINCIPALES CON USUARIOS PRECARGADOS (EXIGENCIA DE RÚBRICA)
export const usuarios = [
    {
        idUsuario: 1,
        nombres: "Administrador",
        apellidos: "General",
        identificacion: "1700000001",
        telefono: "0999999999",
        correo: "admin@autofix.com",
        contrasena: "Admin123*",
        rol: "ADMIN",
        estadoCuenta: "ACTIVA"
    },
    {
        idUsuario: 2,
        nombres: "Jhon",
        apellidos: "Sisalema",
        identificacion: "1203450208",
        telefono: "0999536376",
        correo: "cliente@autofix.com",
        contrasena: "Cliente123*",
        rol: "USER",
        estadoCuenta: "ACTIVA"
    },
    {
        idUsuario: 3,
        nombres: "Carlos",
        apellidos: "Mendoza",
        identificacion: "1723456789",
        telefono: "0987654321",
        correo: "inactivo@autofix.com",
        contrasena: "Cliente123*",
        rol: "USER",
        estadoCuenta: "INACTIVA" // Cumple con el Caso de Prueba 2 (Cuenta deshabilitada)
    }
];

export const autos = [
    {
        idAuto: 1,
        idUsuario: 2,
        placa: "ABC-1234",
        marca: "Toyota",
        modelo: "Corolla",
        anio: 2020,
        color: "Negro",
        kilometraje: 45000,
        combustible: "Gasolina"
    }
];

export const mantenimientos = [
    {
        idMantenimiento: 1,
        codigo: "MNT-0001",
        idUsuario: 2,
        idAuto: 1,
        servicio: "Revisión de frenos",
        tipoServicio: "Revisión de frenos",
        serviciosAdicionales: ["Revisión de Niveles"],
        fecha: "2026-11-20",
        hora: "10:00",
        fechaIngreso: "2026-11-20 10:00",
        prioridad: "Media",
        descripcion: "Revisión preventiva de pastillas de freno.",
        estado: "Pendiente"
    }
];

// DICCIONARIOS (MAPS) PARA BÚSQUEDAS EFICIENTES POR ID
export const usuariosPorId = new Map();
export const autosPorId = new Map();
export const mantenimientosPorId = new Map();

// INICIALIZACIÓN DE MAPS AL CARGAR EL SISTEMA
export function inicializarDatosBase() {
    usuariosPorId.clear();
    autosPorId.clear();
    mantenimientosPorId.clear();

    usuarios.forEach(u => usuariosPorId.set(u.idUsuario, u));
    autos.forEach(a => autosPorId.set(a.idAuto, a));
    mantenimientos.forEach(m => mantenimientosPorId.set(m.idMantenimiento, m));
}