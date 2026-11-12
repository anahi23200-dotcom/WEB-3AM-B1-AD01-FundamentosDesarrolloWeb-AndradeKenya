// =========================================
// js/script.js
// CONTROLADOR CENTRAL SPA Y EVENTOS
// =========================================

import { inicializarDatosBase } from './modelos.js';
import { registrarSolicitudMantenimiento, prepararFormularioSegunSesion } from './formulario.js';
import { 
    iniciarSesion, 
    cerrarSesion, 
    obtenerUsuarioActual, 
    actualizarEstadisticasAdmin, 
    cargarDatosClientePanel,
    registrarNuevoCliente 
} from './auth.js';
import { renderizarTablaAdmin, aplicarFiltrosAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    
    inicializarDatosBase();

    // REFERENCIAS A VISTAS SPA
    const vistas = {
        landing: document.querySelector('main'),
        formulario: document.getElementById('modulo-formulario'),
        login: document.getElementById('modulo-login'),
        admin: document.getElementById('modulo-admin'),
        cliente: document.getElementById('modulo-cliente')
    };

    // FUNCIÓN CENTRAL PARA CAMBIAR DE VISTA
    function irA(vistaDeseada) {
        const footer = document.querySelector('.footer');
        const whatsappBtn = document.querySelector('.whatsapp-float');

        Object.values(vistas).forEach(v => { 
            if (v) v.style.display = 'none'; 
        });
        
        if (vistaDeseada) {
            if (vistaDeseada === vistas.formulario || vistaDeseada === vistas.login) {
                vistaDeseada.style.display = 'flex';
            } else {
                vistaDeseada.style.display = 'block';
            }
        }

        if (vistaDeseada === vistas.landing) {
            if (footer) footer.style.display = 'block';
            if (whatsappBtn) whatsappBtn.style.display = 'flex';
        } else {
            if (footer) footer.style.display = 'none';
            if (whatsappBtn) whatsappBtn.style.display = 'none';
        }

        window.scrollTo(0, 0);
    }

    // ACTUALIZACIÓN DINÁMICA DEL NAVBAR
    function actualizarNavbarSegunSesion(usuario) {
        const navActions = document.getElementById('nav-actions-container');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!navActions) return;

        if (usuario) {
            if (navMenu) navMenu.style.display = 'none';

            navActions.innerHTML = `
                <span style="color: #F8FAFC; margin-right: 15px; font-weight:600;">Hola, ${usuario.nombres}</span>
                <button id="btn-nav-nueva" class="btn btn-primary" style="margin-right: 10px;">+ Nueva Solicitud</button>
                <button id="btn-nav-logout" class="btn btn-outline">Cerrar Sesión</button>
            `;

            document.getElementById('btn-nav-nueva')?.addEventListener('click', (e) => {
                e.preventDefault();
                prepararFormularioSegunSesion(usuario);
                irA(vistas.formulario);
            });

            document.getElementById('btn-nav-logout')?.addEventListener('click', (e) => {
                e.preventDefault();
                Swal.fire({
                    title: '¿Cerrar sesión?',
                    text: '¿Estás seguro de que deseas salir de tu cuenta?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#DC2626',
                    cancelButtonColor: '#64748B',
                    confirmButtonText: 'Sí, salir',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        cerrarSesion();
                        actualizarNavbarSegunSesion(null);
                        irA(vistas.landing);
                    }
                });
            });
        } else {
            if (navMenu) navMenu.style.display = 'flex';

            navActions.innerHTML = `<a href="#" id="btn-login-nav" class="btn btn-outline">Iniciar Sesión</a>`;
            document.getElementById('btn-login-nav')?.addEventListener('click', (e) => {
                e.preventDefault();
                irA(vistas.login);
            });
        }
    }

    // BOTONES DE NAVEGACIÓN PRINCIPAL
    document.getElementById('btn-solicitar-hero')?.addEventListener('click', (e) => {
        e.preventDefault();
        const usr = obtenerUsuarioActual();
        if (!usr) {
            irA(vistas.login);
        } else {
            prepararFormularioSegunSesion(usr);
            irA(vistas.formulario);
        }
    });

    document.getElementById('btn-volver-inicio')?.addEventListener('click', (e) => {
        e.preventDefault();
        const usr = obtenerUsuarioActual();
        if (!usr) {
            irA(vistas.landing);
        } else if (usr.rol === 'ADMIN') {
            actualizarEstadisticasAdmin();
            renderizarTablaAdmin();
            irA(vistas.admin);
        } else {
            cargarDatosClientePanel();
            irA(vistas.cliente);
        }
    });

    document.getElementById('btn-login-volver')?.addEventListener('click', (e) => {
        e.preventDefault();
        irA(vistas.landing);
    });

    // PESTAÑAS LOGIN / REGISTRO
    const boxLogin = document.getElementById('box-login');
    const boxRegistro = document.getElementById('box-registro');

    document.getElementById('link-ir-registro')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (boxLogin) boxLogin.style.display = 'none';
        if (boxRegistro) boxRegistro.style.display = 'block';
    });

    document.getElementById('link-ir-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (boxRegistro) boxRegistro.style.display = 'none';
        if (boxLogin) boxLogin.style.display = 'block';
    });

    // FORMULARIO DE REGISTRO DE CUENTA
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            const datosRegistro = {
                nombres: document.getElementById('reg-nombres').value,
                apellidos: document.getElementById('reg-apellidos').value,
                identificacion: document.getElementById('reg-identificacion').value,
                telefono: document.getElementById('reg-telefono').value,
                correo: document.getElementById('reg-correo').value,
                contrasena: document.getElementById('reg-password').value
            };

            const resultado = registrarNuevoCliente(datosRegistro);
            const msg = document.getElementById('registro-mensaje');

            if (resultado.exito) {
                if (msg) msg.style.display = 'none';
                formRegistro.reset();
                Swal.fire({
                    title: '¡Cuenta creada con éxito!',
                    text: `Bienvenido/a, ${resultado.usuario.nombres}. Inicia sesión para agendar tu mantenimiento.`,
                    icon: 'success',
                    confirmButtonColor: '#0F172A',
                    confirmButtonText: 'Iniciar Sesión'
                }).then(() => {
                    if (boxRegistro) boxRegistro.style.display = 'none';
                    if (boxLogin) boxLogin.style.display = 'block';
                    const inputUsr = document.getElementById('login-usuario');
                    if (inputUsr) inputUsr.value = resultado.usuario.correo;
                });
            } else if (msg) {
                msg.textContent = resultado.mensaje;
                msg.className = 'alert alert-error';
                msg.style.display = 'block';
            }
        });
    }

    // FORMULARIO DE LOGIN
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const userInput = document.getElementById('login-usuario').value;
            const passInput = document.getElementById('login-password').value;
            const msg = document.getElementById('login-mensaje');

            const res = iniciarSesion(userInput, passInput);

            if (res.exito) {
                if (msg) msg.style.display = 'none';
                formLogin.reset();
                actualizarNavbarSegunSesion(res.usuario);
                if (res.usuario.rol === 'ADMIN') {
                    actualizarEstadisticasAdmin();
                    renderizarTablaAdmin();
                    irA(vistas.admin);
                } else {
                    cargarDatosClientePanel();
                    irA(vistas.cliente);
                }
            } else if (msg) {
                msg.textContent = res.mensaje;
                msg.className = 'alert alert-error';
                msg.style.display = 'block';
            }
        });
    }

    // FORMULARIO DE MANTENIMIENTO
    const formMantenimiento = document.getElementById('form-mantenimiento');
    if (formMantenimiento) {
        formMantenimiento.addEventListener('submit', (e) => {
            registrarSolicitudMantenimiento(e, obtenerUsuarioActual());
        });
    }

    // FILTROS ADMIN
    document.getElementById('admin-buscador')?.addEventListener('input', aplicarFiltrosAdmin);
    document.getElementById('admin-filtro-estado')?.addEventListener('change', aplicarFiltrosAdmin);

    // INICIALIZACIÓN DE ESTADO
    actualizarNavbarSegunSesion(obtenerUsuarioActual());
});