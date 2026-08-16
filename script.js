/**
 * PartyPOS - Engine Avanzado con Gráficos Circulares y Exportación Excel
 */

const App = {
  evento: JSON.parse(localStorage.getItem('pp_evento')) || {
    nombre: 'Fiesta Epic Night 2026',
    lugar: 'Explanada Principal - Zona VIP',
    fecha: '2026-08-16',
    hora: '21:00',
    supervisor: 'Iban Jhordi Serrano'
  },
  catalogo: JSON.parse(localStorage.getItem('pp_catalogo')) || [],
  ventas: JSON.parse(localStorage.getItem('pp_ventas')) || [],
  puntoActivo: 1,

  // Instancias de gráficos
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
    localStorage.setItem('pp_evento', JSON.stringify(this.evento));
    localStorage.setItem('pp_catalogo', JSON.stringify(this.catalogo));
    localStorage.setItem('pp_ventas', JSON.stringify(this.ventas));
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
      btn.addEventListener('click', () => {
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

  // RENDERIZADO DEL DASHBOARD CON GRÁFICOS CIRCULARES (CHART.JS)
  renderDashboard() {
    const totalVentas = this.ventas.reduce((sum, v) => sum + v.total, 0);
    const totalUnids = this.ventas.reduce((sum, v) => sum + v.cantidad, 0);
    const ticket = this.ventas.length > 0 ? totalVentas / this.ventas.length : 0;

    document.getElementById('dash-ventas').innerText = `S/ ${totalVentas.toFixed(2)}`;
    document.getElementById('dash-unidades').innerText = `${totalUnids} Unids`;
    document.getElementById('dash-ticket').innerText = `S/ ${ticket.toFixed(2)}`;

    // Agrupación por Puntos
    const ventasPuntos = {};
    for (let i = 1; i <= 8; i++) ventasPuntos[i] = 0;
    
    // Agrupación por Productos
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
    document.getElementById('dash-top-punto').innerText = topPunto;

    // Actualización de Gráficos Circulares
    this.renderCharts(ventasPuntos, ventasProds);
  },

  renderCharts(ventasPuntos, ventasProds) {
    const ctxDoughnut = document.getElementById('chartDoughnutPuntos');
    const ctxPie = document.getElementById('chartPieProductos');

    if (!ctxDoughnut || !ctxPie) return;

    // Colores Neón
    const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    if (this.chartDoughnut) this.chartDoughnut.destroy();
    if (this.chartPie) this.chartPie.destroy();

    // Gráfico de Dona: Ventas por Punto
    this.chartDoughnut = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: Object.keys(ventasPuntos).map(p => `Punto ${p}`),
        datasets: [{
          data: Object.values(ventasPuntos),
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#f8fafc', font: { size: 11 } } } }
      }
    });

    // Gráfico de Pastel: Productos Vendidos
    const prodLabels = Object.keys(ventasProds);
    const prodData = Object.values(ventasProds);

    this.chartPie = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: prodLabels.length > 0 ? prodLabels : ['Sin registros'],
        datasets: [{
          data: prodData.length > 0 ? prodData : [1],
          backgroundColor: prodData.length > 0 ? colors : ['#2e2452'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#f8fafc', font: { size: 11 } } } }
      }
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
        <td>
          <button onclick="App.eliminarProducto(${index})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ Borrar</button>
        </td>
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

      if (!select.value) return;

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
        tabsContainer.innerHTML += `
          <button class="pos-tab-btn ${activeClass}" onclick="App.cambiarPunto(${i})">🎪 Punto ${i}</button>
        `;
      }
    }

    document.getElementById('pos-active-title').innerText = `🎪 Punto ${this.puntoActivo} - Registro de Venta`;

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
      tbody.innerHTML += `
        <tr>
          <td>${v.hora}</td>
          <td>${v.producto}</td>
          <td>${v.cantidad}</td>
          <td>S/ ${v.total.toFixed(2)}</td>
        </tr>
      `;
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

          if (!resumenGlobal[v.producto]) {
            resumenGlobal[v.producto] = { cantidad: 0, total: 0 };
          }
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
      globalTbody.innerHTML += `
        <tr>
          <td><strong>${prodNombre}</strong></td>
          <td>${datos.cantidad} Unids</td>
          <td>S/ ${datos.total.toFixed(2)}</td>
        </tr>
      `;
    }

    globalTbody.innerHTML += `
      <tr style="background: rgba(168, 85, 247, 0.1); font-weight:700;">
        <td>TOTAL GENERAL RECAUDADO</td>
        <td>-</td>
        <td style="color:#22c55e; font-size:16px;">S/ ${sumaTotalSoles.toFixed(2)}</td>
      </tr>
    `;
  },

  // FUNCIONALIDAD: BORRADO GENERAL Y RESET
  resetearSistema() {
    if (confirm('⚠️ ¿Estás seguro de que deseas ELIMINAR TODOS los datos registrados (Ventas, Carta y Configuración del Evento)? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      this.evento = {
        nombre: 'Fiesta Epic Night 2026',
        lugar: 'Explanada Principal - Zona VIP',
        fecha: '2026-08-16',
        hora: '21:00',
        supervisor: 'Iban Jhordi Serrano'
      };
      this.catalogo = [];
      this.ventas = [];
      this.puntoActivo = 1;
      this.guardarYRenderizar();
      alert('✅ Todos los datos han sido eliminados correctamente.');
    }
  },

  // FUNCIONALIDAD: EXPORTACIÓN A EXCEL (.XLSX)
  exportarExcel() {
    if (this.ventas.length === 0) {
      alert('🚫 No hay datos de ventas registradas para exportar.');
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