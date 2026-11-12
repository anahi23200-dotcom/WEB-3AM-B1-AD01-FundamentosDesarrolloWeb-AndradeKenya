// =========================================
// js/admin.js
// GESTIÓN DEL PANEL ADMINISTRADOR (CRUD COMPLETO)
// =========================================

import { mantenimientos, mantenimientosPorId, autosPorId, usuariosPorId } from './modelos.js';
import { actualizarEstadisticasAdmin } from './auth.js';

let mantenimientosFiltrados = [];

export function renderizarTablaAdmin(datos = null) {
    const tbody = document.getElementById('admin-tabla-mantenimientos');
    if (!tbody) return;

    const lista = datos || mantenimientos;
    mantenimientosFiltrados = lista;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748B; padding: 20px;">No se encontraron solicitudes de mantenimiento.</td></tr>`;
        return;
    }

    let html = '';
    lista.forEach(m => {
        const cliente = usuariosPorId.get(m.idUsuario);
        const auto = autosPorId.get(m.idAuto);

        const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Cliente No Registrado';
        const infoAuto = auto ? `${auto.marca} ${auto.modelo} (${auto.placa})` : 'Vehículo N/A';
        const servicio = m.servicio || m.tipoServicio || 'Mantenimiento';
        const fechaHora = (m.fecha && m.hora) ? `${m.fecha} ${m.hora}` : (m.fechaIngreso || 'N/A');

        html += `
            <tr>
                <td><strong>${m.codigo}</strong></td>
                <td>${nombreCliente}</td>
                <td>${infoAuto}</td>
                <td>${servicio}</td>
                <td>${fechaHora}</td>
                <td>
                    <select class="select-estado-admin" data-id="${m.idMantenimiento}">
                        <option value="Pendiente" ${m.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En proceso" ${m.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="Finalizado" ${m.estado === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                    </select>
                </td>
                <td style="text-align:center; display: flex; gap: 6px; justify-content: center; align-items: center;">
                    <button class="btn-editar-admin" data-id="${m.idMantenimiento}">✏️ Editar</button>
                    <button class="btn-eliminar-admin" data-id="${m.idMantenimiento}">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    asignarEventosTablaAdmin();
}

function asignarEventosTablaAdmin() {
    // CAMBIO DE ESTADO
    document.querySelectorAll('.select-estado-admin').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const mant = mantenimientosPorId.get(id);
            if (mant) {
                mant.estado = e.target.value;
                actualizarEstadisticasAdmin();
                Swal.fire({
                    title: '¡Estado Actualizado!',
                    text: `La solicitud ${mant.codigo} cambió a "${mant.estado}".`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    });

    // BOTÓN EDITAR (CRUD UPDATE)
    document.querySelectorAll('.btn-editar-admin').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            abrirModalEdicion(id);
        });
    });

    // BOTÓN ELIMINAR (CRUD DELETE)
    document.querySelectorAll('.btn-eliminar-admin').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const mant = mantenimientosPorId.get(id);
            if (!mant) return;

            Swal.fire({
                title: '¿Eliminar solicitud?',
                text: `Se eliminará la solicitud ${mant.codigo} permanentemente.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#64748B',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    eliminarMantenimiento(id);
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'La solicitud ha sido eliminada con éxito.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        });
    });
}

// MODAL PARA EDITAR DETALLES DE LA SOLICITUD
function abrirModalEdicion(id) {
    const mant = mantenimientosPorId.get(id);
    if (!mant) return;

    const servicioActual = mant.servicio || mant.tipoServicio || 'Cambio de aceite';
    const fechaActual = mant.fecha || '';
    const horaActual = mant.hora || '';
    const prioridadActual = mant.prioridad || 'Media';
    const descripcionActual = mant.descripcion || '';

    Swal.fire({
        title: `Editar Solicitud ${mant.codigo}`,
        html: `
            <div style="text-align: left; display: flex; flex-direction: column; gap: 12px; font-family: inherit;">
                <div>
                    <label style="font-weight:600; font-size:0.85rem; color:#1E293B;">Tipo de Servicio:</label>
                    <select id="swal-edit-servicio" class="swal2-input" style="width:100%; margin:4px 0 0 0; font-size:0.9rem;">
                        <option value="Cambio de aceite" ${servicioActual === 'Cambio de aceite' ? 'selected' : ''}>Cambio de aceite</option>
                        <option value="Revisión de frenos" ${servicioActual === 'Revisión de frenos' ? 'selected' : ''}>Revisión de frenos</option>
                        <option value="Mantenimiento preventivo" ${servicioActual === 'Mantenimiento preventivo' ? 'selected' : ''}>Mantenimiento preventivo</option>
                        <option value="Diagnóstico general" ${servicioActual === 'Diagnóstico general' ? 'selected' : ''}>Diagnóstico general</option>
                    </select>
                </div>
                <div style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label style="font-weight:600; font-size:0.85rem; color:#1E293B;">Fecha:</label>
                        <input type="date" id="swal-edit-fecha" class="swal2-input" value="${fechaActual}" style="width:100%; margin:4px 0 0 0; font-size:0.9rem;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-weight:600; font-size:0.85rem; color:#1E293B;">Hora:</label>
                        <input type="time" id="swal-edit-hora" class="swal2-input" value="${horaActual}" style="width:100%; margin:4px 0 0 0; font-size:0.9rem;">
                    </div>
                </div>
                <div>
                    <label style="font-weight:600; font-size:0.85rem; color:#1E293B;">Prioridad:</label>
                    <select id="swal-edit-prioridad" class="swal2-input" style="width:100%; margin:4px 0 0 0; font-size:0.9rem;">
                        <option value="Baja" ${prioridadActual === 'Baja' ? 'selected' : ''}>Baja</option>
                        <option value="Media" ${prioridadActual === 'Media' ? 'selected' : ''}>Media</option>
                        <option value="Alta" ${prioridadActual === 'Alta' ? 'selected' : ''}>Alta</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight:600; font-size:0.85rem; color:#1E293B;">Descripción:</label>
                    <textarea id="swal-edit-descripcion" class="swal2-textarea" style="width:100%; margin:4px 0 0 0; height:70px; font-size:0.9rem;">${descripcionActual}</textarea>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0F172A',
        cancelButtonColor: '#64748B',
        preConfirm: () => {
            const servicio = document.getElementById('swal-edit-servicio').value;
            const fecha = document.getElementById('swal-edit-fecha').value;
            const hora = document.getElementById('swal-edit-hora').value;
            const prioridad = document.getElementById('swal-edit-prioridad').value;
            const descripcion = document.getElementById('swal-edit-descripcion').value;

            if (!fecha || !hora) {
                Swal.showValidationMessage('La fecha y la hora son obligatorias.');
                return false;
            }

            return { servicio, fecha, hora, prioridad, descripcion };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const datos = result.value;
            
            // Actualizar datos en el objeto de memoria RAM
            mant.servicio = datos.servicio;
            mant.tipoServicio = datos.servicio;
            mant.fecha = datos.fecha;
            mant.hora = datos.hora;
            mant.prioridad = datos.prioridad;
            mant.descripcion = datos.descripcion;

            renderizarTablaAdmin();
            actualizarEstadisticasAdmin();

            Swal.fire({
                title: '¡Guardado!',
                text: 'La solicitud ha sido modificada correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

function eliminarMantenimiento(id) {
    const index = mantenimientos.findIndex(m => m.idMantenimiento === id);
    if (index !== -1) {
        mantenimientos.splice(index, 1);
        mantenimientosPorId.delete(id);
        renderizarTablaAdmin();
        actualizarEstadisticasAdmin();
    }
}

export function aplicarFiltrosAdmin() {
    const textoBuscador = document.getElementById('admin-buscador')?.value.toLowerCase().trim() || '';
    const estadoFiltro = document.getElementById('admin-filtro-estado')?.value || 'TODOS';

    const resultado = mantenimientos.filter(m => {
        const cliente = usuariosPorId.get(m.idUsuario);
        const auto = autosPorId.get(m.idAuto);

        const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}`.toLowerCase() : '';
        const placa = auto ? auto.placa.toLowerCase() : '';
        const codigo = m.codigo ? m.codigo.toLowerCase() : '';

        const coincideTexto = nombreCliente.includes(textoBuscador) || placa.includes(textoBuscador) || codigo.includes(textoBuscador);
        const coincideEstado = (estadoFiltro === 'TODOS') || (m.estado === estadoFiltro);

        return coincideTexto && coincideEstado;
    });

    renderizarTablaAdmin(resultado);
}