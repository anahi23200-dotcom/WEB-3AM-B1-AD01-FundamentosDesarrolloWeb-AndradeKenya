// =========================================
// js/formulario.js
// REGISTRO Y VALIDACIÓN COMPLETA DE MANTENIMIENTOS
// =========================================

import { mantenimientos, mantenimientosPorId, autos, autosPorId, usuarios, usuariosPorId } from './modelos.js';

// Prepara el formulario con datos del usuario si hay sesión iniciada y establece restricciones de fecha
export function prepararFormularioSegunSesion(usuario) {
    const form = document.getElementById('form-mantenimiento');
    if (!form) return;

    form.reset();

    // Desmarcar checkboxes de servicios adicionales al limpiar el formulario
    document.querySelectorAll('input[name="servicios_adicionales"]').forEach(cb => cb.checked = false);

    // RESTRICCIÓN DE FECHA: Establece la fecha mínima como HOY en el input tipo date HTML5
    const inputFecha = document.getElementById('mantenimiento-fecha');
    if (inputFecha) {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        inputFecha.min = `${año}-${mes}-${dia}`;
    }

    // Si el usuario es un Cliente, autocompletar y bloquear sus datos personales (readonly)
    if (usuario && usuario.rol === 'USER') {
        const inputNombres = document.getElementById('cliente-nombres');
        const inputApellidos = document.getElementById('cliente-apellidos');
        const inputId = document.getElementById('cliente-identificacion');
        const inputTel = document.getElementById('cliente-telefono');
        const inputCorreo = document.getElementById('cliente-correo');

        if (inputNombres) { inputNombres.value = usuario.nombres; inputNombres.readOnly = true; }
        if (inputApellidos) { inputApellidos.value = usuario.apellidos; inputApellidos.readOnly = true; }
        if (inputId) { inputId.value = usuario.identificacion; inputId.readOnly = true; }
        if (inputTel) { inputTel.value = usuario.telefono; inputTel.readOnly = true; }
        if (inputCorreo) { inputCorreo.value = usuario.correo; inputCorreo.readOnly = true; }
    } else {
        // Si es Admin o invitado, habilitar edición
        const inputs = ['cliente-nombres', 'cliente-apellidos', 'cliente-identificacion', 'cliente-telefono', 'cliente-correo'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.readOnly = false;
        });
    }
}

// Procesa el submit del formulario con validaciones estrictas
export function registrarSolicitudMantenimiento(e, usuarioActual) {
    e.preventDefault();

    // 1. OBTENCIÓN DE VALORES
    const nombres = document.getElementById('cliente-nombres').value.trim();
    const apellidos = document.getElementById('cliente-apellidos').value.trim();
    const identificacion = document.getElementById('cliente-identificacion').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const correo = document.getElementById('cliente-correo').value.trim();

    const placa = document.getElementById('auto-placa').value.trim().toUpperCase();
    const marca = document.getElementById('auto-marca').value.trim();
    const modelo = document.getElementById('auto-modelo').value.trim();
    const anio = parseInt(document.getElementById('auto-anio').value);
    const color = document.getElementById('auto-color').value.trim();
    const kilometraje = parseInt(document.getElementById('auto-kilometraje').value);
    const combustible = document.getElementById('auto-combustible').value;

    const servicio = document.getElementById('mantenimiento-servicio').value;

    // CAPTURA DE CHECKBOXES (Array de servicios adicionales)
    const checkboxesSeleccionados = document.querySelectorAll('input[name="servicios_adicionales"]:checked');
    const adicionales = Array.from(checkboxesSeleccionados).map(cb => cb.value);

    const fecha = document.getElementById('mantenimiento-fecha').value;
    const hora = document.getElementById('mantenimiento-hora').value;
    const prioridadElem = document.querySelector('input[name="prioridad"]:checked');
    const prioridad = prioridadElem ? prioridadElem.value : 'Media';
    const descripcion = document.getElementById('mantenimiento-descripcion').value.trim();

    // =========================================================================
    // 2. VALIDACIONES DE CAMPOS OBLIGATORIOS Y FORMATO
    // =========================================================================

    // Validar Datos del Cliente
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(nombres)) {
        return mostrarAlertaError('Los nombres solo deben contener letras (mínimo 2 caracteres).');
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(apellidos)) {
        return mostrarAlertaError('Los apellidos solo deben contener letras (mínimo 2 caracteres).');
    }
    if (!/^\d{10}$/.test(identificacion)) {
        return mostrarAlertaError('La cédula/identificación debe contener exactamente 10 dígitos numéricos.');
    }
    if (!/^\d{10}$/.test(telefono)) {
        return mostrarAlertaError('El número de teléfono debe contener exactamente 10 dígitos.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return mostrarAlertaError('Ingrese un formato de correo electrónico válido.');
    }

    // Validar Datos del Vehículo
    if (!/^[A-Z]{3}-\d{3,4}$/.test(placa)) {
        return mostrarAlertaError('La placa debe tener un formato ecuatoriano válido (Ejemplo: ABC-1234 o ABC-123).');
    }
    if (marca.length < 2) {
        return mostrarAlertaError('La marca del vehículo no es válida.');
    }
    if (modelo.length < 1) {
        return mostrarAlertaError('El modelo del vehículo no puede estar vacío.');
    }
    
    const anioActual = new Date().getFullYear();
    if (isNaN(anio) || anio < 1950 || anio > (anioActual + 1)) {
        return mostrarAlertaError(`El año del vehículo debe estar comprendido entre 1950 y ${anioActual + 1}.`);
    }
    if (isNaN(kilometraje) || kilometraje < 0 || kilometraje > 1000000) {
        return mostrarAlertaError('El kilometraje debe ser un número positivo coherente.');
    }
    if (!combustible) {
        return mostrarAlertaError('Seleccione el tipo de combustible del vehículo.');
    }

    // Validar Detalles del Servicio
    if (!servicio) {
        return mostrarAlertaError('Seleccione un tipo de servicio de mantenimiento.');
    }

    // =========================================================================
    // 3. VALIDACIÓN DE FECHA Y HORA
    // =========================================================================
    if (!fecha) {
        return mostrarAlertaError('Debe seleccionar una fecha para el servicio.');
    }

    const ahora = new Date();
    const hoyCero = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    
    const partesFecha = fecha.split('-');
    const fechaIngresada = new Date(parseInt(partesFecha[0]), parseInt(partesFecha[1]) - 1, parseInt(partesFecha[2]));

    if (fechaIngresada < hoyCero) {
        return mostrarAlertaError('No se puede agendar una solicitud en una fecha anterior al día de hoy.');
    }

    if (!hora) {
        return mostrarAlertaError('Debe seleccionar una hora para la atención.');
    }
    const [horasSel, minutosSel] = hora.split(':').map(Number);
    if (horasSel < 8 || horasSel >= 17) {
        return mostrarAlertaError('La hora debe estar dentro del horario de atención del taller (08:00 AM a 05:00 PM).');
    }

    if (fechaIngresada.getTime() === hoyCero.getTime()) {
        const horaActualNum = ahora.getHours();
        const minActualNum = ahora.getMinutes();

        if (horasSel < horaActualNum || (horasSel === horaActualNum && minutosSel < minActualNum)) {
            return mostrarAlertaError('Para solicitudes en el día de hoy, debe elegir una hora posterior al momento actual.');
        }
    }

    if (descripcion.length < 5) {
        return mostrarAlertaError('Ingrese una descripción o motivo más detallado para el servicio (mínimo 5 caracteres).');
    }

    // =========================================================================
    // 4. PERSISTENCIA Y REGISTRO EN MEMORIA RAM
    // =========================================================================

    let idClienteFinal;
    if (usuarioActual && usuarioActual.rol === 'USER') {
        idClienteFinal = usuarioActual.idUsuario;
    } else {
        let clienteExistente = usuarios.find(u => u.identificacion === identificacion);
        if (!clienteExistente) {
            clienteExistente = {
                idUsuario: usuarios.length + 1,
                nombres,
                apellidos,
                identificacion,
                telefono,
                correo,
                contrasena: "Cliente123*",
                rol: "USER",
                estadoCuenta: "ACTIVA"
            };
            usuarios.push(clienteExistente);
            if (usuariosPorId) usuariosPorId.set(clienteExistente.idUsuario, clienteExistente);
        }
        idClienteFinal = clienteExistente.idUsuario;
    }

    let autoExistente = autos.find(a => a.placa === placa);
    if (!autoExistente) {
        autoExistente = {
            idAuto: autos.length + 1,
            idUsuario: idClienteFinal,
            placa,
            marca,
            modelo,
            anio,
            color,
            kilometraje,
            combustible
        };
        autos.push(autoExistente);
        if (autosPorId) autosPorId.set(autoExistente.idAuto, autoExistente);
    } else {
        autoExistente.kilometraje = kilometraje;
    }

    const idNuevoMantenimiento = mantenimientos.length + 1;
    const codigoMantenimiento = `MNT-${String(idNuevoMantenimiento).padStart(4, '0')}`;

    const nuevoMantenimiento = {
        idMantenimiento: idNuevoMantenimiento,
        codigo: codigoMantenimiento,
        idUsuario: idClienteFinal,
        idAuto: autoExistente.idAuto,
        servicio,
        tipoServicio: servicio,
        serviciosAdicionales: adicionales, // Guardado del array de checkboxes
        fecha,
        hora,
        fechaIngreso: `${fecha} ${hora}`,
        prioridad,
        descripcion,
        estado: 'Pendiente'
    };

    mantenimientos.push(nuevoMantenimiento);
    if (mantenimientosPorId) mantenimientosPorId.set(nuevoMantenimiento.idMantenimiento, nuevoMantenimiento);

    // =========================================================================
    // 5. RESPUESTA VISUAL CON SWEETALERT2
    // =========================================================================
    Swal.fire({
        title: '¡Solicitud Registrada!',
        html: `La orden de mantenimiento fue creada con éxito.<br><br>Código asignado: <strong>${codigoMantenimiento}</strong>`,
        icon: 'success',
        confirmButtonColor: '#0F172A',
        confirmButtonText: 'Ir a mi panel'
    }).then(() => {
        prepararFormularioSegunSesion(usuarioActual);
        const btnVolver = document.getElementById('btn-volver-inicio');
        if (btnVolver) btnVolver.click();
    });
}

// Función auxiliar para emitir notificaciones de error con SweetAlert2
function mostrarAlertaError(mensaje) {
    Swal.fire({
        title: 'Atención en los Datos',
        text: mensaje,
        icon: 'error',
        confirmButtonColor: '#DC2626',
        confirmButtonText: 'Corregir'
    });
    return false;
}