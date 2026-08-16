/**
 * PartyPOS - Engine Optimizado para Móviles y PC
 */

// Función de manejo seguro de localStorage para móviles
const Storage = {
  get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn("localStorage bloqueado o no disponible en móvil:", e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e);
    }
  },
  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("No se pudo limpiar localStorage:", e);
    }
  }
};

const App = {
  evento: Storage.get('pp_evento', {
    nombre: 'Fiesta Epic Night 2026',
    lugar: 'Explanada Principal - Zona VIP',
    fecha: '2026-08-16',
    hora: '21:00',
    supervisor: 'Iban Jhordi Serrano'
  }),
  catalogo: Storage.get('pp_catalogo', []),
  ventas: Storage.get('pp_ventas', []),
  puntoActivo: 1,
  chartDoughnut: null,
  chartPie: null,

  init() {
    this.bindNavegacion();
    this.bindEvento();
    this.bindCatalogo();
    this.bindPOS();
    this.renderTodo();
  },

  guardarYRenderizar() {
    Storage.set('pp_evento', this.evento);
    Storage.set('pp_catalogo', this.catalogo);
    Storage.set('pp_ventas', this.ventas);
    this.renderTodo();
  },

  renderTodo() {
    this.renderHeaderBanner();
    this.renderDashboard();
    this.renderCatalogo();
    this.renderPOS();
    this.renderConsolidado();
  },

  bindNavegacion() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    navBtns.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabs.forEach(t => t.style.display = 'none');
        if (tabs[idx]) tabs[idx].style.display = 'block';
      });
    });
  },

  bindEvento() {
    const form = document.getElementById('form-evento');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.evento = {
        nombre: document.getElementById('ev-nombre').value,
        lugar: document.getElementById('ev-lugar').value,
        fecha: document.getElementById('ev-fecha').value,
        hora: document.getElementById('ev-hora').value,
        supervisor: document.getElementById('ev-supervisor').value
      };
      this.guardarYRenderizar();
    });
  },

  renderHeaderBanner() {
    const banner = document.getElementById('live-banner');
    if (banner) {
      banner.innerHTML = `📍 <strong>${this.evento.lugar}</strong> | 📅 ${this.evento.fecha} | ⏰ ${this.evento.hora}`;
    }
  },

  renderDashboard() {
    const totalVentas = this.ventas.reduce((sum, v) => sum + v.total, 0);
    const totalUnids = this.ventas.reduce((sum, v) => sum + v.cantidad, 0);
    const ticket = this.ventas.length > 0 ? totalVentas / this.ventas.length : 0;

    const elVentas = document.getElementById('dash-ventas');
    const elUnids = document.getElementById('dash-unidades');
    const elTicket = document.getElementById('dash-ticket');
    const elTop = document.getElementById('dash-top-punto');

    if (elVentas) elVentas.innerText = `S/ ${totalVentas.toFixed(2)}`;
    if (elUnids) elUnids.innerText = `${totalUnids} Unids`;
    if (elTicket) elTicket.innerText = `S/ ${ticket.toFixed(2)}`;

    const ventasPuntos = {};
    for (let i = 1; i <= 8; i++) ventasPuntos[i] = 0;
    const ventasProds = {};

    this.ventas.forEach(v => {
      ventasPuntos[v.punto] = (ventasPuntos[v.punto] || 0) + v.total;
      ventasProds[v.producto] = (ventasProds[v.producto] || 0) + v.cantidad;
    });

    let topPunto = 'Sin ventas';
    let max = 0;
    for (const [p, val] of Object.entries(ventasPuntos)) {
      if (val > max) { max = val; topPunto = `Punto ${p} (S/ ${val.toFixed(2)})`; }
    }
    if (elTop) elTop.innerText = topPunto;

    this.renderCharts(ventasPuntos, ventasProds);
  },

  renderCharts(ventasPuntos, ventasProds) {
    if (typeof Chart === 'undefined') return;

    const ctxDoughnut = document.getElementById('chartDoughnutPuntos');
    const ctxPie = document.getElementById('chartPieProductos');

    if (!ctxDoughnut || !ctxPie) return;

    const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    if (this.chartDoughnut) this.chartDoughnut.destroy();
    if (this.chartPie) this.chartPie.destroy();

    this.chartDoughnut = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: Object.keys(ventasPuntos).map(p => `Punto ${p}`),
        datasets: [{ data: Object.values(ventasPuntos), backgroundColor: colors, borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f8fafc', font: { size: 10 } } } } }
    });

    const prodLabels = Object.keys(ventasProds);
    const prodData = Object.values(ventasProds);

    this.chartPie = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: prodLabels.length > 0 ? prodLabels : ['Sin registros'],
        datasets: [{ data: prodData.length > 0 ? prodData : [1], backgroundColor: prodData.length > 0 ? colors : ['#2e2452'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f8fafc', font: { size: 10 } } } } }
    });
  },

  bindCatalogo() {
    const btn = document.getElementById('btn-guardar-catalogo');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('cat-nombre').value.trim();
      const categoria = document.getElementById('cat-categoria').value;
      const precio = parseFloat(document.getElementById('cat-precio').value);

      if (!nombre || isNaN(precio) || precio <= 0) return;

      this.catalogo.push({
        id: Date.now(),
        codigo: `PRD-${String(this.catalogo.length + 1).padStart(2, '0')}`,
        nombre,
        categoria,
        precio
      });

      document.getElementById('cat-nombre').value = '';
      document.getElementById('cat-precio').value = '';
      this.guardarYRenderizar();
    });
  },

  renderCatalogo() {
    const tbody = document.getElementById('cat-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (this.catalogo.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Sin productos en catálogo.</td></tr>`;
      return;
    }

    this.catalogo.forEach((prod, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${prod.codigo}</strong></td>
        <td>${prod.nombre}</td>
        <td>${prod.categoria}</td>
        <td>S/ ${prod.precio.toFixed(2)}</td>
        <td><button onclick="App.eliminarProducto(${index})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    });
  },

  eliminarProducto(index) {
    this.catalogo.splice(index, 1);
    this.guardarYRenderizar();
  },

  bindPOS() {
    const btn = document.getElementById('btn-registrar-pos');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const select = document.getElementById('pos-select-producto');
      const cantInput = document.getElementById('pos-input-cant');

      if (!select || !select.value) return;

      const prodId = Number(select.value);
      const cantidad = parseInt(cantInput.value) || 1;
      const producto = this.catalogo.find(p => p.id === prodId);

      if (!producto) return;

      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      this.ventas.push({
        id: Date.now(),
        punto: this.puntoActivo,
        producto: producto.nombre,
        precio: producto.precio,
        cantidad,
        total: producto.precio * cantidad,
        hora: horaActual
      });

      cantInput.value = '1';
      this.guardarYRenderizar();
    });
  },

  renderPOS() {
    const tabsContainer = document.getElementById('pos-selector-container');
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      for (let i = 1; i <= 8; i++) {
        const activeClass = this.puntoActivo === i ? 'active' : '';
        tabsContainer.innerHTML += `<button class="pos-tab-btn ${activeClass}" onclick="App.cambiarPunto(${i})">🎪 Punto ${i}</button>`;
      }
    }

    const title = document.getElementById('pos-active-title');
    if (title) title.innerText = `🎪 Punto ${this.puntoActivo} - Registro de Venta`;

    const select = document.getElementById('pos-select-producto');
    if (select) {
      select.innerHTML = '<option value="">-- Seleccionar Producto --</option>';
      this.catalogo.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nombre} - S/ ${p.precio.toFixed(2)}</option>`;
      });
    }

    const tbody = document.getElementById('pos-tbody-ventas');
    if (!tbody) return;
    tbody.innerHTML = '';

    const ventasPunto = this.ventas.filter(v => v.punto === this.puntoActivo);

    if (ventasPunto.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Sin ventas en el Punto ${this.puntoActivo}.</td></tr>`;
      return;
    }

    ventasPunto.forEach(v => {
      tbody.innerHTML += `<tr><td>${v.hora}</td><td>${v.producto}</td><td>${v.cantidad}</td><td>S/ ${v.total.toFixed(2)}</td></tr>`;
    });
  },

  cambiarPunto(punto) {
    this.puntoActivo = punto;
    this.renderPOS();
  },

  renderConsolidado() {
    const container = document.getElementById('consolidado-puntos-container');
    const globalTbody = document.getElementById('consolidado-global-tbody');

    if (!container || !globalTbody) return;

    container.innerHTML = '';
    globalTbody.innerHTML = '';

    const resumenGlobal = {};

    for (let i = 1; i <= 8; i++) {
      const ventasPunto = this.ventas.filter(v => v.punto === i);
      const totalPunto = ventasPunto.reduce((sum, v) => sum + v.total, 0);

      let filasHTML = '';
      if (ventasPunto.length === 0) {
        filasHTML = `<tr><td colspan="3" style="color:var(--text-muted);">Sin actividad registrada.</td></tr>`;
      } else {
        ventasPunto.forEach(v => {
          filasHTML += `<tr><td>${v.producto}</td><td>${v.cantidad}</td><td>S/ ${v.total.toFixed(2)}</td></tr>`;
          if (!resumenGlobal[v.producto]) resumenGlobal[v.producto] = { cantidad: 0, total: 0 };
          resumenGlobal[v.producto].cantidad += v.cantidad;
          resumenGlobal[v.producto].total += v.total;
        });
      }

      container.innerHTML += `
        <div style="margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <h4 style="margin-bottom: 8px;">📍 Punto ${i} (Total: S/ ${totalPunto.toFixed(2)})</h4>
          <div class="table-responsive">
            <table>
              <thead><tr><th>PRODUCTO</th><th>CANT.</th><th>SUBTOTAL</th></tr></thead>
              <tbody>${filasHTML}</tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (Object.keys(resumenGlobal).length === 0) {
      globalTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No hay registros globales para consolidar.</td></tr>`;
      return;
    }

    let sumaTotalSoles = 0;
    for (const [prodNombre, datos] of Object.entries(resumenGlobal)) {
      sumaTotalSoles += datos.total;
      globalTbody.innerHTML += `<tr><td><strong>${prodNombre}</strong></td><td>${datos.cantidad} Unids</td><td>S/ ${datos.total.toFixed(2)}</td></tr>`;
    }

    globalTbody.innerHTML += `
      <tr style="background: rgba(168, 85, 247, 0.1); font-weight:700;">
        <td>TOTAL GENERAL RECAUDADO</td>
        <td>-</td>
        <td style="color:#22c55e; font-size:16px;">S/ ${sumaTotalSoles.toFixed(2)}</td>
      </tr>
    `;
  },

  resetearSistema() {
    if (confirm('⚠️ ¿Estás seguro de que deseas ELIMINAR TODOS los datos?')) {
      Storage.clear();
      this.evento = { nombre: 'Fiesta Epic Night 2026', lugar: 'Explanada Principal - Zona VIP', fecha: '2026-08-16', hora: '21:00', supervisor: 'Iban Jhordi Serrano' };
      this.catalogo = [];
      this.ventas = [];
      this.puntoActivo = 1;
      this.guardarYRenderizar();
    }
  },

  exportarExcel() {
    if (typeof XLSX === 'undefined') {
      alert('⚠️ La librería de Excel aún se está cargando. Intenta de nuevo.');
      return;
    }
    if (this.ventas.length === 0) {
      alert('🚫 No hay datos de ventas registradas.');
      return;
    }

    const dataExcel = this.ventas.map((v, index) => ({
      '# Item': index + 1,
      'Punto de Venta': `Punto ${v.punto}`,
      'Hora': v.hora,
      'Producto': v.producto,
      'Precio Unitario (S/)': v.precio,
      'Cantidad': v.cantidad,
      'Subtotal (S/)': v.total,
      'Evento': this.evento.nombre,
      'Lugar': this.evento.lugar,
      'Supervisor': this.evento.supervisor
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria_Ventas');
    XLSX.writeFile(workbook, `PartyPOS_Auditoria_${this.evento.fecha}.xlsx`);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());