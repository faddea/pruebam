// ==========================================
// 1. CONFIGURACIÓN Y SERVICIO DE BASE DE DATOS (MOCK LOCALSTORAGE)
// ==========================================

const DB_KEY = 'walletflow_db';

// Datos de prueba iniciales para que la app se vea espectacular y viva desde el primer segundo
const DEFAULT_MOCK_DATA = {
  cuentas: [
    { id: 1, nombre: 'Mercado Pago', saldo: 48500.00, color: '#009EE3' },
    { id: 2, nombre: 'Galicia Sueldo', saldo: 120000.00, color: '#F59E0B' },
    { id: 3, nombre: 'Efectivo', saldo: 8300.00, color: '#10B981' }
  ],
  gastos: [
    { id: 101, cuenta_id: 2, monto: 12500.00, descripcion: 'Supermercado Coto', categoria: 'Alimentos', fecha: '2026-05-17T18:30:00.000Z' },
    { id: 102, cuenta_id: 1, monto: 1200.00, descripcion: 'Carga Tarjeta SUBE', categoria: 'Transporte', fecha: '2026-05-17T10:15:00.000Z' },
    { id: 103, cuenta_id: 3, monto: 8700.00, descripcion: 'Cena con Amigos', categoria: 'Entretenimiento', fecha: '2026-05-16T22:00:00.000Z' },
    { id: 104, cuenta_id: 2, monto: 15000.00, descripcion: 'Nafta Shell', categoria: 'Transporte', fecha: '2026-05-15T09:45:00.000Z' },
    { id: 105, cuenta_id: 1, monto: 3200.00, descripcion: 'Metrogas Mayo', categoria: 'Servicios', fecha: '2026-05-10T11:00:00.000Z' }
  ],
  pagos: [
    { id: 201, nombre: 'Impuesto Municipal', monto: 8400.00, fecha_vencimiento: '2026-05-19', pagado: false, fecha_pago: null, cuenta_id: null },
    { id: 202, nombre: 'Internet Fibertel', monto: 9800.00, fecha_vencimiento: '2026-05-20', pagado: false, fecha_pago: null, cuenta_id: null },
    { id: 203, nombre: 'Netflix Premium', monto: 4500.00, fecha_vencimiento: '2026-05-24', pagado: false, fecha_pago: null, cuenta_id: null },
    { id: 204, nombre: 'Luz Edesur', monto: 12000.00, fecha_vencimiento: '2026-05-28', pagado: false, fecha_pago: null, cuenta_id: null },
    { id: 205, nombre: 'Metrogas Mayo', monto: 3200.00, fecha_vencimiento: '2026-05-10', pagado: true, fecha_pago: '2026-05-10T11:00:00.000Z', cuenta_id: 1 }
  ]
};

// Obtiene la base de datos de LocalStorage
function getDB() {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_MOCK_DATA));
    return DEFAULT_MOCK_DATA;
  }
  return JSON.parse(data);
}

// Guarda la base de datos a LocalStorage
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  triggerRenders(); // Ejecuta re-render en cascada
}

// ==========================================
// 2. SISTEMA DE TEMA (CLARO, OSCURO, SISTEMA)
// ==========================================

function setTheme(theme) {
  localStorage.setItem('walletflow_theme', theme);
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.classList.remove('dark');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemDark) {
      document.documentElement.classList.add('dark');
    }
  }

  // Actualizar las clases visuales de los botones del modal de ajustes
  const themes = ['light', 'dark', 'system'];
  themes.forEach(t => {
    const btn = document.getElementById(`theme-btn-${t}`);
    if (!btn) return;
    if (t === theme) {
      btn.className = 'py-2.5 rounded-xl border border-primary bg-primary/10 text-primary text-sm font-extrabold flex flex-col items-center justify-center gap-1 transition-all shadow-sm';
    } else {
      btn.className = 'py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60 bg-transparent';
    }
  });
}

// Escuchar cambios de tema del sistema operativo
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  const savedTheme = localStorage.getItem('walletflow_theme') || 'system';
  if (savedTheme === 'system') {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
});

// Restablecer datos por defecto
function resetToDefaults() {
  if (!confirm('¿Seguro que querés restablecer todos tus datos? Volverás a tener las cuentas y vencimientos de prueba iniciales.')) return;
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem('walletflow_theme');
  window.location.reload();
}

// ==========================================
// 3. NAVEGACIÓN SPA (TAB SYSTEM)
// ==========================================

let activeTab = 'dashboard';
let activeGastoDate = new Date(); // Para el control mensual de gastos
let activePagoDate = new Date(); // Para el control mensual de la agenda
let pagosSubTab = 'pendientes'; // pendientes vs pagados

let activeCalendarDate = new Date(); // Para el control mensual del calendario
let selectedCalendarDay = new Date().toISOString().split('T')[0]; // Día seleccionado (hoy por defecto)

function showTab(tabId) {
  activeTab = tabId;

  const tabs = ['dashboard', 'gastos', 'calendario', 'pagos', 'cuentas'];

  // Ocultar secciones y actualizar clases activas del bottom-nav
  tabs.forEach(tab => {
    const viewEl = document.getElementById(`${tab}-view`);
    const navBtn = document.getElementById(`nav-${tab}`);

    if (tab === tabId) {
      viewEl.classList.remove('hidden');
      navBtn.className = 'flex flex-col items-center gap-0.5 text-primary transition-all scale-105 active:scale-90';
    } else {
      viewEl.classList.add('hidden');
      navBtn.className = 'flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all active:scale-90';
    }
  });

  triggerRenders();
}

function setPagosSubTab(subTab) {
  pagosSubTab = subTab;
  const btnPendientes = document.getElementById('pagos-tab-pendientes');
  const btnPagados = document.getElementById('pagos-tab-pagados');

  if (subTab === 'pendientes') {
    btnPendientes.className = 'flex-1 py-1 text-base font-bold rounded-lg text-center transition-all bg-primary text-white shadow-sm';
    btnPagados.className = 'flex-1 py-1 text-base font-bold rounded-lg text-center transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
  } else {
    btnPagados.className = 'flex-1 py-1 text-base font-bold rounded-lg text-center transition-all bg-primary text-white shadow-sm';
    btnPendientes.className = 'flex-1 py-1 text-base font-bold rounded-lg text-center transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
  }
  renderPagosView();
}

// ==========================================
// 4. CONTROLES DE MODALES
// ==========================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('pointer-events-none', 'opacity-0');
  modal.classList.add('opacity-100');

  const innerCard = modal.querySelector('.glass-modal');
  if (innerCard) {
    innerCard.classList.remove('translate-y-10');
    innerCard.classList.add('translate-y-0');
  }

  // Carga e inicialización de selectores
  if (modalId === 'add-gasto-modal') {
    populateAccountSelect('gasto-cuenta-select');
    document.getElementById('gasto-fecha').valueAsDate = new Date();
  } else if (modalId === 'pay-confirm-modal') {
    populateAccountSelect('pay-cuenta-select');
  } else if (modalId === 'add-pago-modal') {
    document.getElementById('pago-vencimiento').valueAsDate = new Date();
  } else if (modalId === 'settings-modal') {
    const savedTheme = localStorage.getItem('walletflow_theme') || 'system';
    applyTheme(savedTheme);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('pointer-events-none', 'opacity-0');
  modal.classList.remove('opacity-100');

  const innerCard = modal.querySelector('.glass-modal');
  if (innerCard) {
    innerCard.classList.add('translate-y-10');
    innerCard.classList.remove('translate-y-0');
  }
}

function openSidebar() {
  const overlay = document.getElementById('sidebar-overlay');
  const panel = document.getElementById('sidebar-panel');

  overlay.classList.remove('pointer-events-none', 'opacity-0');
  overlay.classList.add('opacity-100');

  panel.classList.remove('translate-x-full');
  panel.classList.add('translate-x-0');

  renderConsolidados();
}

function closeSidebar() {
  const overlay = document.getElementById('sidebar-overlay');
  const panel = document.getElementById('sidebar-panel');

  overlay.classList.add('pointer-events-none', 'opacity-0');
  overlay.classList.remove('opacity-100');

  panel.classList.add('translate-x-full');
  panel.classList.remove('translate-x-0');
}

function populateAccountSelect(selectId) {
  const db = getDB();
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = db.cuentas.map(c =>
    `<option value="${c.id}">${c.nombre} ($${formatNumber(c.saldo)})</option>`
  ).join('');
}

// ==========================================
// 5. FORMATO Y UTILIDADES
// ==========================================

function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(val);
}

function formatNumber(val) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}

function getRelativeTimeString(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();

  const dateReset = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dateReset - nowReset;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays < -1) return `Venció hace ${Math.abs(diffDays)} d`;
  return `Vence en ${diffDays} d`;
}

function getMonthName(date) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[date.getMonth()];
}

// ==========================================
// 6. ACCIONES Y MANEJADORES DE NEGOCIO (LOGIC)
// ==========================================

// Registrar Cuenta
function handleCreateCuenta(e) {
  e.preventDefault();
  const db = getDB();
  const nombre = document.getElementById('cuenta-nombre').value.trim();
  const saldo = parseFloat(document.getElementById('cuenta-saldo').value);
  const colorRadio = document.querySelector('input[name="cuenta-color"]:checked');
  const color = colorRadio ? colorRadio.value : '#009EE3';

  if (!nombre) return;

  const newCuenta = {
    id: Date.now(),
    nombre,
    saldo,
    color
  };

  db.cuentas.push(newCuenta);
  saveDB(db);

  closeModal('add-cuenta-modal');
  document.getElementById('form-cuenta').reset();
}

// Registrar Gasto
function handleCreateGasto(e) {
  e.preventDefault();
  const db = getDB();
  const monto = parseFloat(document.getElementById('gasto-monto').value);
  const descripcion = document.getElementById('gasto-descripcion').value.trim();
  const cuentaId = parseInt(document.getElementById('gasto-cuenta-select').value);
  const categoria = document.getElementById('gasto-categoria-select').value;
  const fechaVal = document.getElementById('gasto-fecha').value;

  if (!monto || !descripcion || !cuentaId || !fechaVal) return;

  const cuenta = db.cuentas.find(c => c.id === cuentaId);
  if (!cuenta) return;

  cuenta.saldo -= monto;

  const newGasto = {
    id: Date.now(),
    cuenta_id: cuentaId,
    monto,
    descripcion,
    categoria,
    fecha: new Date(fechaVal).toISOString()
  };

  db.gastos.push(newGasto);
  saveDB(db);

  closeModal('add-gasto-modal');
  document.getElementById('form-gasto').reset();
}

// Eliminar Gasto
function deleteGasto(id) {
  if (!confirm('¿Querés eliminar este gasto? Se devolverá el saldo a la cuenta.')) return;
  const db = getDB();
  const index = db.gastos.findIndex(g => g.id === id);
  if (index === -1) return;

  const gasto = db.gastos[index];
  const cuenta = db.cuentas.find(c => c.id === gasto.cuenta_id);
  if (cuenta) {
    cuenta.saldo += gasto.monto;
  }

  db.gastos.splice(index, 1);
  saveDB(db);
}

// Programar Pago Pendiente
function handleCreatePago(e) {
  e.preventDefault();
  const db = getDB();
  const nombre = document.getElementById('pago-nombre').value.trim();
  const monto = parseFloat(document.getElementById('pago-monto-input').value);
  const vencimiento = document.getElementById('pago-vencimiento').value;

  if (!nombre || !monto || !vencimiento) return;

  const newPago = {
    id: Date.now(),
    nombre,
    monto,
    fecha_vencimiento: vencimiento,
    pagado: false,
    fecha_pago: null,
    cuenta_id: null
  };

  db.pagos.push(newPago);
  saveDB(db);

  closeModal('add-pago-modal');
  document.getElementById('form-pago').reset();
}

// Iniciar pago
function initiatePayment(pagoId, nombre, monto) {
  document.getElementById('pay-service-id').value = pagoId;
  document.getElementById('pay-service-name').innerText = nombre;
  document.getElementById('pay-service-amount').innerText = formatCurrency(monto);
  openModal('pay-confirm-modal');
}

// Confirmar Pago
function handleConfirmPayment(e) {
  e.preventDefault();
  const db = getDB();
  const pagoId = parseInt(document.getElementById('pay-service-id').value);
  const cuentaId = parseInt(document.getElementById('pay-cuenta-select').value);

  if (!pagoId || !cuentaId) return;

  const pagoIndex = db.pagos.findIndex(p => p.id === pagoId);
  if (pagoIndex === -1) return;

  const pago = db.pagos[pagoIndex];
  const cuenta = db.cuentas.find(c => c.id === cuentaId);
  if (!cuenta) return;

  cuenta.saldo -= pago.monto;
  pago.pagado = true;
  pago.fecha_pago = new Date().toISOString();
  pago.cuenta_id = cuentaId;

  // Registrar transacción de salida automatizada
  const newGasto = {
    id: Date.now(),
    cuenta_id: cuentaId,
    monto: pago.monto,
    descripcion: `Pago: ${pago.nombre}`,
    categoria: 'Servicios',
    fecha: new Date().toISOString()
  };
  db.gastos.push(newGasto);

  saveDB(db);
  closeModal('pay-confirm-modal');
}

// Deshacer Pago
function undoPayment(pagoId) {
  if (!confirm('¿Deshacer el pago de este servicio? Volverá a pendiente y se restaurará el saldo.')) return;
  const db = getDB();
  const pago = db.pagos.find(p => p.id === pagoId);
  if (!pago || !pago.pagado) return;

  const gastoIndex = db.gastos.findIndex(g =>
    g.cuenta_id === pago.cuenta_id &&
    g.monto === pago.monto &&
    g.descripcion === `Pago: ${pago.nombre}`
  );

  const cuenta = db.cuentas.find(c => c.id === pago.cuenta_id);
  if (cuenta) {
    cuenta.saldo += pago.monto;
  }

  if (gastoIndex !== -1) {
    db.gastos.splice(gastoIndex, 1);
  }

  pago.pagado = false;
  pago.fecha_pago = null;
  pago.cuenta_id = null;

  saveDB(db);
}

// Quitar Pago
function deletePago(id) {
  if (!confirm('¿Quitar este servicio de la agenda?')) return;
  const db = getDB();
  db.pagos = db.pagos.filter(p => p.id !== id);
  saveDB(db);
}

// Eliminar Cuenta
function deleteCuenta(id) {
  const db = getDB();
  if (db.cuentas.length <= 1) {
    alert('Tenés que mantener al menos una cuenta activa.');
    return;
  }

  const cuenta = db.cuentas.find(c => c.id === id);
  if (!cuenta) return;

  const gastosVinculados = db.gastos.filter(g => g.cuenta_id === id).length;
  const msg = gastosVinculados > 0
    ? `Eliminar "${cuenta.nombre}" dejará huérfanos a sus ${gastosVinculados} gastos. ¿Deseás continuar?`
    : `¿Seguro que querés eliminar la cuenta "${cuenta.nombre}"?`;

  if (!confirm(msg)) return;

  db.cuentas = db.cuentas.filter(c => c.id !== id);
  saveDB(db);
}

// Ajustar Saldo Manualmente
function adjustCuentaSaldo(id) {
  const db = getDB();
  const cuenta = db.cuentas.find(c => c.id === id);
  if (!cuenta) return;

  const nuevoSaldoStr = prompt(`Ajustar saldo para ${cuenta.nombre}:\n(Saldo actual: $${formatNumber(cuenta.saldo)})`, cuenta.saldo.toFixed(2));
  if (nuevoSaldoStr === null) return;

  const nuevoSaldo = parseFloat(nuevoSaldoStr);
  if (isNaN(nuevoSaldo)) {
    alert('Ingresá un número válido.');
    return;
  }

  cuenta.saldo = nuevoSaldo;
  saveDB(db);
}

// ==========================================
// 7. RENDERIZACIÓN ADAPTATIVA DEL DOM (VIEW ENGINE)
// ==========================================

function triggerRenders() {
  renderConsolidados();
  if (activeTab === 'dashboard') {
    renderDashboard();
  } else if (activeTab === 'gastos') {
    renderGastosView();
  } else if (activeTab === 'calendario') {
    renderCalendarView();
  } else if (activeTab === 'pagos') {
    renderPagosView();
  } else if (activeTab === 'cuentas') {
    renderCuentasView();
  }

  lucide.createIcons();
}

function renderConsolidados() {
  const db = getDB();
  const total = db.cuentas.reduce((sum, c) => sum + c.saldo, 0);

  const headerEl = document.getElementById('total-balance-header');
  if (headerEl) headerEl.innerText = formatCurrency(total);

  const sidebarEl = document.getElementById('total-balance-sidebar');
  if (sidebarEl) sidebarEl.innerText = formatCurrency(total);

  const elCard = document.getElementById('total-balance-card');
  if (elCard) elCard.innerText = formatCurrency(total);
}

// RENDER: PESTAÑA INICIO (DASHBOARD)
function renderDashboard() {
  const db = getDB();

  // 1. Vencimientos impagos urgentes
  const hoyStr = new Date().toISOString().split('T')[0];
  const vencidosHoy = db.pagos.filter(p => !p.pagado && p.fecha_vencimiento <= hoyStr).length;
  document.getElementById('vencimientos-hoy-count').innerText = vencidosHoy;

  // 2. Gastos acumulados mes
  const hoy = new Date();
  const gastosMesMonto = db.gastos
    .filter(g => {
      const gDate = new Date(g.fecha);
      return gDate.getFullYear() === hoy.getFullYear() && gDate.getMonth() === hoy.getMonth();
    })
    .reduce((sum, g) => sum + g.monto, 0);
  document.getElementById('gastos-mes-monto').innerText = formatCurrency(gastosMesMonto);

  // 3. Render de Cuentas (Carrusel simplificado y adaptativo)
  const carrousel = document.getElementById('cuentas-carrousel');
  if (carrousel) {
    if (db.cuentas.length === 0) {
      carrousel.innerHTML = `<div class="p-3 text-center text-base text-slate-400 dark:text-slate-500">No tenés cuentas creadas.</div>`;
    } else {
      let html = db.cuentas.map(c => {
        return `
          <div onclick="adjustCuentaSaldo(${c.id})" class="flex-shrink-0 w-44 glass-card rounded-xl p-3 flex flex-col justify-between h-24 relative cursor-pointer hover:scale-102 transition-all active:scale-98" 
               style="border-left: 4px solid ${c.color}">
            <div class="flex justify-between items-start">
              <span class="text-sm font-bold text-slate-500 dark:text-slate-400 truncate w-24 block">${c.nombre}</span>
              <i data-lucide="edit-3" class="w-4 h-4 text-slate-400 dark:text-slate-500"></i>
            </div>
            <div>
              <span class="text-base font-black text-slate-800 dark:text-slate-100">$${formatNumber(c.saldo)}</span>
            </div>
          </div>
        `;
      }).join('');

      // Caja rápida agregar cuenta
      html += `
        <div onclick="openModal('add-cuenta-modal')" class="flex-shrink-0 w-28 glass-card rounded-xl p-3 flex flex-col items-center justify-center h-24 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-95 cursor-pointer transition-all">
          <i data-lucide="plus" class="w-6 h-6 text-primary mb-0.5"></i>
          <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nueva</span>
        </div>
      `;
      carrousel.innerHTML = html;
    }
  }

  // 4. Vencimientos Próximos
  const urgentesList = document.getElementById('vencimientos-urgentes-list');
  if (urgentesList) {
    const limDate = new Date();
    limDate.setDate(limDate.getDate() + 4);
    const limDateStr = limDate.toISOString().split('T')[0];

    const proximos = db.pagos
      .filter(p => !p.pagado && p.fecha_vencimiento <= limDateStr)
      .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
      .slice(0, 3);

    if (proximos.length === 0) {
      urgentesList.innerHTML = `
        <div class="glass-card rounded-2xl p-4 text-center">
          <p class="text-base text-slate-400 dark:text-slate-500">No tenés facturas ni pagos próximos.</p>
        </div>
      `;
    } else {
      urgentesList.innerHTML = proximos.map(p => {
        const relativeTime = getRelativeTimeString(p.fecha_vencimiento);
        const isOverdue = new Date(p.fecha_vencimiento) < new Date(new Date().toISOString().split('T')[0]);
        const timeBadgeColor = isOverdue ? 'bg-accent-red/10 text-accent-red border-accent-red/20' : 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20';

        return `
          <div class="glass-card rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button onclick="initiatePayment(${p.id}, '${p.nombre}', ${p.monto})" class="w-10 h-10 rounded-lg bg-accent-yellow/10 flex items-center justify-center text-accent-yellow hover:bg-accent-yellow hover:text-white transition-all active:scale-90">
                <i data-lucide="check" class="w-5 h-5"></i>
              </button>
              <div>
                <h4 class="text-base font-bold text-slate-800 dark:text-slate-100">${p.nombre}</h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs px-1.5 py-0.2 rounded border ${timeBadgeColor}">
                    ${relativeTime}
                  </span>
                  <span class="text-xs text-slate-400 dark:text-slate-500 font-bold">${p.fecha_vencimiento.split('-').reverse().slice(0, 2).join('/')}</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <span class="text-base font-extrabold text-slate-800 dark:text-slate-100">$${formatNumber(p.monto)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// RENDER: PESTAÑA GASTOS
function renderGastosView() {
  const db = getDB();
  document.getElementById('gasto-active-month').innerText = `${getMonthName(activeGastoDate)} ${activeGastoDate.getFullYear()}`;

  const filterCuenta = document.getElementById('gasto-filter-cuenta');
  if (filterCuenta && filterCuenta.options.length <= 1) {
    db.cuentas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre;
      filterCuenta.appendChild(opt);
    });
  }

  populateAccountSelect('gasto-cuenta-select');
  filterGastos();
}

function changeGastoMonth(val) {
  activeGastoDate.setMonth(activeGastoDate.getMonth() + val);
  renderGastosView();
}

function filterGastos() {
  const db = getDB();
  const query = document.getElementById('gasto-search').value.toLowerCase().trim();
  const cuentaId = document.getElementById('gasto-filter-cuenta').value;
  const categoria = document.getElementById('gasto-filter-categoria').value;

  let filtrados = db.gastos.filter(g => {
    const gDate = new Date(g.fecha);
    return gDate.getFullYear() === activeGastoDate.getFullYear() && gDate.getMonth() === activeGastoDate.getMonth();
  });

  if (query) filtrados = filtrados.filter(g => g.descripcion.toLowerCase().includes(query));
  if (cuentaId) filtrados = filtrados.filter(g => g.cuenta_id === parseInt(cuentaId));
  if (categoria) filtrados = filtrados.filter(g => g.categoria === categoria);

  const total = filtrados.reduce((sum, g) => sum + g.monto, 0);
  document.getElementById('gastos-view-total').innerText = `Total este mes: $${formatNumber(total)}`;

  const grupos = {};
  filtrados.forEach(g => {
    const fechaLocal = new Date(g.fecha).toLocaleDateString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
    const fechaCap = fechaLocal.charAt(0).toUpperCase() + fechaLocal.slice(1);
    if (!grupos[fechaCap]) grupos[fechaCap] = [];
    grupos[fechaCap].push(g);
  });

  const listContainer = document.getElementById('gastos-grouped-list');
  if (listContainer) {
    if (filtrados.length === 0) {
      listContainer.innerHTML = `
        <div class="glass-card rounded-2xl p-6 text-center">
          <p class="text-base text-slate-400 dark:text-slate-500">Ningún gasto registrado en este mes.</p>
        </div>
      `;
    } else {
      const fechasOrdenadas = Object.keys(grupos).sort((a, b) => {
        return new Date(grupos[b][0].fecha) - new Date(grupos[a][0].fecha);
      });

      listContainer.innerHTML = fechasOrdenadas.map(fecha => {
        const itemHTML = grupos[fecha].map(g => {
          const cuenta = db.cuentas.find(c => c.id === g.cuenta_id);
          const cuentaNombre = cuenta ? cuenta.nombre : 'Cuenta';
          const cuentaColor = cuenta ? cuenta.color : '#009EE3';

          let catIcon = 'shopping-bag';
          if (g.categoria === 'Alimentos') catIcon = 'coffee';
          else if (g.categoria === 'Servicios') catIcon = 'plug-zap';
          else if (g.categoria === 'Transporte') catIcon = 'bus';
          else if (g.categoria === 'Entretenimiento') catIcon = 'clapperboard';

          const bgAlpha = cuentaColor + '12';
          const borderAlpha = cuentaColor + '20';

          return `
            <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-900/40 last:border-b-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <i data-lucide="${catIcon}" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="text-base font-bold text-slate-800 dark:text-slate-100">${g.descripcion}</h4>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-[10px] font-extrabold px-1.5 py-0.2 rounded border" style="background: ${bgAlpha}; border: 1px solid ${borderAlpha}; color: ${cuentaColor}">
                      ${cuentaNombre}
                    </span>
                    <span class="text-xs text-slate-400 dark:text-slate-500 font-bold">${g.categoria}</span>
                  </div>
                </div>
              </div>
              <div class="text-right flex items-center gap-1.5">
                <span class="text-base font-extrabold text-accent-red">-$${formatNumber(g.monto)}</span>
                <button onclick="deleteGasto(${g.id})" class="text-slate-300 dark:text-slate-600 hover:text-accent-red p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="glass-card rounded-xl p-3.5 space-y-2">
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/40 pb-1">${fecha}</h3>
            <div class="divide-y divide-slate-100 dark:divide-slate-900/40 space-y-0.5">
              ${itemHTML}
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();
    }
  }
}

// RENDER: PESTAÑA AGENDA DE VENCIMIENTOS
function renderPagosView() {
  const db = getDB();
  document.getElementById('pago-active-month').innerText = `${getMonthName(activePagoDate)} ${activePagoDate.getFullYear()}`;

  let filtrados = db.pagos.filter(p => {
    const pDate = new Date(p.fecha_vencimiento);
    const inMonth = pDate.getFullYear() === activePagoDate.getFullYear() && pDate.getMonth() === activePagoDate.getMonth();
    return inMonth && p.pagado === (pagosSubTab === 'pagados');
  });

  if (pagosSubTab === 'pendientes') {
    filtrados.sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));
  } else {
    filtrados.sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago));
  }

  const container = document.getElementById('pagos-list');
  if (container) {
    if (filtrados.length === 0) {
      container.innerHTML = `
        <div class="glass-card rounded-2xl p-6 text-center">
          <p class="text-base text-slate-400 dark:text-slate-500">No tenés facturas ${pagosSubTab === 'pendientes' ? 'pendientes' : 'pagadas'} este mes.</p>
        </div>
      `;
    } else {
      container.innerHTML = filtrados.map(p => {
        const relativeTime = getRelativeTimeString(p.fecha_vencimiento);
        const isOverdue = !p.pagado && new Date(p.fecha_vencimiento) < new Date(new Date().toISOString().split('T')[0]);

        let statusBadge = '';
        let borderClass = '';
        let actionButton = '';

        if (p.pagado) {
          const cuenta = db.cuentas.find(c => c.id === p.cuenta_id);
          const cuentaNombre = cuenta ? cuenta.nombre : 'Cuenta';
          statusBadge = `<span class="text-[10px] px-1.5 py-0.2 rounded bg-accent-green/10 text-accent-green border border-accent-green/20 font-extrabold uppercase">Pagado con ${cuentaNombre}</span>`;
          borderClass = 'border-left: 4px solid #10B981';
          actionButton = `
            <button onclick="undoPayment(${p.id})" class="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green hover:bg-accent-red/10 hover:text-accent-red transition-all active:scale-90">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
            </button>
          `;
        } else {
          const badgeColor = isOverdue ? 'bg-accent-red/10 text-accent-red border-accent-red/20' : 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20';
          borderClass = isOverdue ? 'border-left: 4px solid #EF4444' : 'border-left: 4px solid #F59E0B';
          statusBadge = `<span class="text-[10px] px-1.5 py-0.2 rounded border ${badgeColor} font-extrabold uppercase">${relativeTime}</span>`;
          actionButton = `
            <button onclick="initiatePayment(${p.id}, '${p.nombre}', ${p.monto})" class="w-10 h-10 rounded-lg bg-accent-yellow/10 flex items-center justify-center text-accent-yellow hover:bg-accent-yellow hover:text-white transition-all active:scale-90">
              <i data-lucide="check" class="w-5 h-5"></i>
            </button>
          `;
        }

        return `
          <div class="glass-card rounded-xl p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all" style="${borderClass}">
            <div class="flex items-center gap-3">
              ${actionButton}
              <div>
                <h4 class="text-base font-bold text-slate-800 dark:text-slate-100">${p.nombre}</h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  ${statusBadge}
                  <span class="text-xs text-slate-400 dark:text-slate-500 font-bold">${p.fecha_vencimiento.split('-').reverse().slice(0, 2).join('/')}</span>
                </div>
              </div>
            </div>
            <div class="text-right flex items-center gap-2">
              <span class="text-base font-extrabold text-slate-800 dark:text-slate-100">$${formatNumber(p.monto)}</span>
              <button onclick="deletePago(${p.id})" class="text-slate-300 dark:text-slate-600 hover:text-accent-red p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();
    }
  }
}

// RENDER: PESTAÑA CUENTAS
function renderCuentasView() {
  const db = getDB();
  const grid = document.getElementById('cuentas-admin-grid');

  if (grid) {
    if (db.cuentas.length === 0) {
      grid.innerHTML = `<div class="glass-card rounded-2xl p-6 text-center text-base text-slate-400 dark:text-slate-500">Sin cuentas activas.</div>`;
    } else {
      grid.innerHTML = db.cuentas.map(c => {
        const gastosCount = db.gastos.filter(g => g.cuenta_id === c.id).length;

        return `
          <div class="glass-card rounded-xl p-3 flex items-center justify-between" style="border-left: 4px solid ${c.color}">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white" style="background-color: ${c.color}">
                <i data-lucide="wallet" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-base font-bold text-slate-800 dark:text-slate-100">${c.nombre}</h4>
                <span class="text-xs text-slate-400 dark:text-slate-500 font-bold">${gastosCount} gastos vinculados</span>
              </div>
            </div>
            <div class="text-right flex items-center gap-3">
              <div>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 uppercase block tracking-wider font-bold">Saldo</span>
                <span class="text-base font-black text-slate-800 dark:text-slate-100">$${formatNumber(c.saldo)}</span>
              </div>
              <div class="flex gap-0.5">
                <button onclick="adjustCuentaSaldo(${c.id})" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-slate-400 hover:text-primary flex items-center justify-center">
                  <i data-lucide="edit-2" class="w-5 h-5"></i>
                </button>
                <button onclick="deleteCuenta(${c.id})" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-slate-400 hover:text-accent-red flex items-center justify-center">
                  <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();
    }
  }
}

// ==========================================
// 8. VISTA DEDICADA DE CALENDARIO (MONTHLY GRID VIEW)
// ==========================================

function changeCalendarMonth(offset) {
  activeCalendarDate.setMonth(activeCalendarDate.getMonth() + offset);
  renderCalendarView();
}

function selectCalendarDay(dayStr) {
  selectedCalendarDay = dayStr;
  renderCalendarView();
}

function renderCalendarView() {
  const db = getDB();

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const activeYear = activeCalendarDate.getFullYear();
  const activeMonth = activeCalendarDate.getMonth();

  document.getElementById('calendar-active-month').innerText = `${monthNames[activeMonth]} ${activeYear}`;

  // Calcular primer día y cantidad total de días del mes
  const firstDayIndex = new Date(activeYear, activeMonth, 1).getDay(); // 0 = Domingo, 1 = Lunes...
  const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate();

  const prevMonthTotalDays = new Date(activeYear, activeMonth, 0).getDate();

  const gridContainer = document.getElementById('calendar-grid');
  gridContainer.innerHTML = '';

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Relleno de días del mes anterior (grisados)
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = prevMonthTotalDays - i;
    const cell = document.createElement('div');
    cell.className = 'aspect-square rounded-xl flex items-center justify-center text-sm text-slate-300 dark:text-slate-700 opacity-20 pointer-events-none';
    cell.innerText = dNum;
    gridContainer.appendChild(cell);
  }

  // 2. Renderizar días del mes activo
  for (let d = 1; d <= totalDays; d++) {
    const mStr = String(activeMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dayStr = `${activeYear}-${mStr}-${dStr}`;

    const isToday = dayStr === todayStr;
    const isSelected = dayStr === selectedCalendarDay;

    // Obtener gastos y pagos de este día
    const dayGastos = db.gastos.filter(g => g.fecha === dayStr);
    const dayPagos = db.pagos.filter(p => p.fecha_vencimiento === dayStr);

    const hasExpenses = dayGastos.length > 0;
    const hasPendingBills = dayPagos.some(p => !p.pagado);
    const hasPaidBills = dayPagos.some(p => p.pagado);

    const cell = document.createElement('div');
    cell.onclick = () => selectCalendarDay(dayStr);

    let cellClasses = 'aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 cursor-pointer transition-all active:scale-90 relative ';

    if (isSelected) {
      cellClasses += 'bg-primary text-white font-extrabold shadow-md scale-102';
    } else if (isToday) {
      cellClasses += 'border-2 border-primary text-primary font-black bg-primary/5';
    } else {
      cellClasses += 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-850/50 text-slate-700 dark:text-slate-300 font-bold';
    }

    cell.className = cellClasses;

    let dotIndicators = '';
    if (hasExpenses || hasPendingBills || hasPaidBills) {
      dotIndicators += '<div class="flex gap-0.5 justify-center w-full mt-0.5">';
      if (hasExpenses) {
        dotIndicators += `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-red'}"></span>`;
      }
      if (hasPendingBills) {
        dotIndicators += `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-yellow'}"></span>`;
      }
      if (hasPaidBills) {
        dotIndicators += `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-green'}"></span>`;
      }
      dotIndicators += '</div>';
    }

    cell.innerHTML = `
      <span class="text-sm">${d}</span>
      ${dotIndicators}
    `;

    gridContainer.appendChild(cell);
  }

  // 3. Relleno de días del próximo mes
  const totalRenderedDays = firstDayIndex + totalDays;
  const nextMonthPadding = (7 - (totalRenderedDays % 7)) % 7;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const cell = document.createElement('div');
    cell.className = 'aspect-square rounded-xl flex items-center justify-center text-sm text-slate-300 dark:text-slate-700 opacity-20 pointer-events-none';
    cell.innerText = i;
    gridContainer.appendChild(cell);
  }

  // 4. Detalles del día
  renderCalendarDayDetails(db, selectedCalendarDay);
}

function renderCalendarDayDetails(db, dayStr) {
  const dateParts = dayStr.split('-');
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const titleText = `${daysOfWeek[dateObj.getDay()]} ${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
  document.getElementById('calendar-selected-day-title').innerText = titleText;

  const itemsContainer = document.getElementById('calendar-day-items');
  itemsContainer.innerHTML = '';

  const dayGastos = db.gastos.filter(g => g.fecha === dayStr);
  const dayPagos = db.pagos.filter(p => p.fecha_vencimiento === dayStr);

  if (dayGastos.length === 0 && dayPagos.length === 0) {
    itemsContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500">
        <i data-lucide="check-circle" class="w-10 h-10 mb-2 opacity-30 text-slate-400"></i>
        <p class="text-sm font-bold">Sin movimientos este día</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Gastos
  dayGastos.forEach(g => {
    const cuenta = db.cuentas.find(c => c.id === g.cuenta_id);
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80';
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent-red/10 text-accent-red flex items-center justify-center">
          <i data-lucide="minus-circle" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="text-base font-extrabold text-slate-800 dark:text-slate-100 block">${g.descripcion}</span>
          <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">${g.categoria} • ${cuenta ? cuenta.nombre : 'Sin cuenta'}</span>
        </div>
      </div>
      <span class="text-base font-black text-accent-red">-$${formatNumber(g.monto)}</span>
    `;
    itemsContainer.appendChild(item);
  });

  // Pagos
  dayPagos.forEach(p => {
    const item = document.createElement('div');
    item.className = `flex items-center justify-between p-3.5 rounded-2xl border ${p.pagado
      ? 'bg-accent-green/5 border-accent-green/20'
      : 'bg-accent-yellow/5 border-accent-yellow/20'
      }`;

    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center ${p.pagado
        ? 'bg-accent-green/10 text-accent-green'
        : 'bg-accent-yellow/10 text-accent-yellow'
      }">
          <i data-lucide="${p.pagado ? 'check-circle' : 'alert-circle'}" class="w-5 h-5"></i>
        </div>
        <div>
          <span class="text-base font-extrabold text-slate-800 dark:text-slate-100 block">${p.nombre}</span>
          <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
            ${p.pagado ? 'Pagado' : 'Pendiente'} • Vence hoy
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-base font-black ${p.pagado ? 'text-accent-green' : 'text-accent-yellow'}">
          $${formatNumber(p.monto)}
        </span>
        ${!p.pagado ? `
          <button onclick="initiatePayment(${p.id}, '${p.descripcion}', ${p.monto})" class="px-3 py-1 rounded-xl bg-accent-yellow hover:bg-accent-yellow/90 text-white text-xs font-black shadow-sm transition-all active:scale-95">
            PAGAR
          </button>
        ` : ''}
      </div>
    `;
    itemsContainer.appendChild(item);
  });

  lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTRATEGIA DE APERTURA DE MERCADO PAGO (2025)
//
// ❌ LO QUE NO FUNCIONA DESDE UN NAVEGADOR WEB EXTERNO:
//   - mercadopago://        → Chrome/Samsung Internet lo ignoran o van a Play Store
//   - intent://mercadopago  → Android no encuentra ninguna Activity registrada como BROWSABLE
//   - mpago://              → Solo funcionaba en iOS; en Android moderno está bloqueado
//
// ✅ LO QUE SÍ FUNCIONA:
//   - Los links "mpago.la/..." son Android App Links oficiales de Mercado Pago.
//     Mercado Pago tiene configurado un `assetlinks.json` en ese dominio, por lo
//     que Android los verifica y abre la app directamente SIN pasar por Play Store.
//   - Si la app está instalada: Android abre la app en el flujo correspondiente.
//   - Si NO está instalada: el navegador abre la versión web del enlace (graceful fallback).
//
// 🔧 CÓMO OBTENER TU LINK DE COBRO PERSONALIZADO:
//   1. Abrí la app de Mercado Pago → "Cobrar" → "Link de pago"
//   2. Creá un link (puede ser sin monto fijo, solo con tu alias)
//   3. Copiá el link que te genera (ej: https://mpago.la/xxxxxxx)
//   4. Reemplazá MP_PAYMENT_LINK_URL abajo con ese link
//
// ⚠️ NO existe ningún deep link público de Mercado Pago para abrir directamente
//    la pantalla de "Transferencias" o "Enviar dinero" desde fuera de su app.
//    Mercado Pago deliberadamente no expone esas rutas internas a terceros.
// ─────────────────────────────────────────────────────────────────────────────

// Reemplazá este valor con tu link de cobro real generado desde tu cuenta de MP
const MP_PAYMENT_LINK_URL = "https://mpago.la";

function openMercadoPagoApp() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid || isIOS) {
    // Los links mpago.la son App Links verificados por Android y Universal Links en iOS.
    // El sistema operativo intercepta el dominio mpago.la y abre la app de MP directamente.
    // Si la app NO está instalada, el SO deja que el navegador abra la URL (fallback a web).
    // NO necesitamos detectar si está instalada ni hacer setTimeout: el OS lo maneja solo.
    window.location.href = MP_PAYMENT_LINK_URL;
  } else {
    // En desktop, abrimos el link en pestaña nueva (también funciona como página web)
    window.open(MP_PAYMENT_LINK_URL, "_blank", "noopener,noreferrer");
  }
}

// ==========================================
// 9. INICIALIZADOR DE LA APP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Aseguramos que la DB exista y esté cargada
  getDB();

  // Inicializamos el tema guardado
  const savedTheme = localStorage.getItem('walletflow_theme') || 'system';
  applyTheme(savedTheme);

  // Seleccionamos la pestaña inicial
  showTab('dashboard');
});
