// =========================================
// js/auth.js
// AUTENTICACIÓN SIMULADA Y CONTROL DE ROLES
// =========================================

import { usuarios, autos, mantenimientos, usuariosPorId } from './modelos.js';

let usuarioAutenticado = null;

export function obtenerUsuarioActual() {
    return usuarioAutenticado;
}

// INICIO DE SESIÓN FLEXIBLE (ACEPTA ALIAS, CORREO, CÉDULA O NOMBRE)
export function iniciarSesion(usuarioOEmail, contrasena) {
    const credencial = usuarioOEmail.trim().toLowerCase();
    
    const encontrado = usuarios.find(u => {
        const correoUser = u.correo.toLowerCase();
        const aliasUser = correoUser.split('@')[0]; // Extrae "cliente", "admin", "inactivo"
        const nombreUser = u.nombres.toLowerCase();
        const idUser = u.identificacion;

        const coincideUsuario = (
            correoUser === credencial || 
            aliasUser === credencial || 
            nombreUser === credencial || 
            idUser === credencial
        );

        return coincideUsuario && u.contrasena === contrasena;
    });

    if (encontrado) {
        if (encontrado.estadoCuenta !== 'ACTIVA') {
            return { exito: false, mensaje: "La cuenta se encuentra deshabilitada." };
        }
        usuarioAutenticado = encontrado;
        return { exito: true, usuario: encontrado };
    }

    return { exito: false, mensaje: "Credenciales inválidas. Verifique usuario y contraseña." };
}

export function cerrarSesion() {
    usuarioAutenticado = null;
}

// REGISTRO DE CLIENTES NUEVOS DESDE EL FORMULARIO
export function registrarNuevoCliente(datos) {
    const { nombres, apellidos, identificacion, telefono, correo, contrasena } = datos;

    if (!/^\d{10}$/.test(identificacion)) {
        return { exito: false, mensaje: "La cédula debe contener exactamente 10 números." };
    }
    if (!/^\d{10}$/.test(telefono)) {
        return { exito: false, mensaje: "El teléfono debe contener exactamente 10 números." };
    }

    const existeId = usuarios.find(u => u.identificacion === identificacion);
    if (existeId) {
        return { exito: false, mensaje: "Ya existe un usuario registrado con esta identificación." };
    }

    const existeCorreo = usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
    if (existeCorreo) {
        return { exito: false, mensaje: "Ya existe una cuenta asociada a este correo electrónico." };
    }

    const nuevoUsuario = {
        idUsuario: usuarios.length + 1,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        identificacion: identificacion.trim(),
        telefono: telefono.trim(),
        correo: correo.trim().toLowerCase(),
        contrasena: contrasena,
        rol: "USER",
        estadoCuenta: "ACTIVA"
    };

    usuarios.push(nuevoUsuario);
    if (usuariosPorId) {
        usuariosPorId.set(nuevoUsuario.idUsuario, nuevoUsuario);
    }

    return { exito: true, usuario: nuevoUsuario };
}

export function actualizarEstadisticasAdmin() {
    const elemClientes = document.getElementById('stat-clientes');
    const elemVehiculos = document.getElementById('stat-vehiculos');
    const elemMantenimientos = document.getElementById('stat-mantenimientos');
    const elemPendientes = document.getElementById('stat-pendientes');

    if (elemClientes) elemClientes.textContent = usuarios.filter(u => u.rol === 'USER').length;
    if (elemVehiculos) elemVehiculos.textContent = autos.length;
    if (elemMantenimientos) elemMantenimientos.textContent = mantenimientos.length;
    if (elemPendientes) elemPendientes.textContent = mantenimientos.filter(m => m.estado === 'Pendiente').length;
}

// CARGA DE DATOS EN EL DASHBOARD DE CLIENTE
export function cargarDatosClientePanel() {
    if (!usuarioAutenticado) return;

    const contenedorDatos = document.getElementById('cliente-info-personal');
    const saludo = document.getElementById('cliente-nombre-saludo');

    if (saludo) {
        saludo.textContent = `Bienvenido, ${usuarioAutenticado.nombres} ${usuarioAutenticado.apellidos}`;
    }
    
    if (contenedorDatos) {
        contenedorDatos.innerHTML = `
            <p style="margin-bottom: 8px;"><strong>Identificación:</strong> ${usuarioAutenticado.identificacion || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Teléfono:</strong> ${usuarioAutenticado.telefono || 'N/A'}</p>
            <p style="margin-bottom: 8px;"><strong>Correo:</strong> ${usuarioAutenticado.correo || 'N/A'}</p>
        `;
    }

    const contenedorMantenimientos = document.getElementById('cliente-lista-mantenimientos');
    if (!contenedorMantenimientos) return;

    const misMantenimientos = mantenimientos.filter(m => m.idUsuario === usuarioAutenticado.idUsuario);

    if (misMantenimientos.length === 0) {
        contenedorMantenimientos.innerHTML = `<p class="text-muted" style="padding:15px; text-align:center; background:#F8FAFC; border-radius:6px;">No posees solicitudes de mantenimiento registradas a tu nombre.</p>`;
        return;
    }

    let html = `
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
            <thead>
                <tr style="text-align:left; border-bottom:2px solid #E2E8F0; padding:10px;">
                    <th style="padding:10px;">Código</th>
                    <th style="padding:10px;">Servicio</th>
                    <th style="padding:10px;">Fecha y Hora</th>
                    <th style="padding:10px;">Prioridad</th>
                    <th style="padding:10px;">Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    misMantenimientos.forEach(m => {
        const servicioPrincipal = m.servicio || m.tipoServicio || 'Mantenimiento';
        const adicionales = (m.serviciosAdicionales && m.serviciosAdicionales.length > 0) 
            ? ` <br><small style="color:#64748B;">+ ${m.serviciosAdicionales.join(', ')}</small>` 
            : '';
        const fechaHora = (m.fecha && m.hora) ? `${m.fecha} ${m.hora}` : (m.fechaIngreso || 'N/A');
        const prioridad = m.prioridad || 'Media';

        html += `
            <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:10px; font-weight:bold;">${m.codigo}</td>
                <td style="padding:10px;">${servicioPrincipal}${adicionales}</td>
                <td style="padding:10px;">${fechaHora}</td>
                <td style="padding:10px;">${prioridad}</td>
                <td style="padding:10px;"><span class="user-badge badge-user">${m.estado}</span></td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    contenedorMantenimientos.innerHTML = html;
}