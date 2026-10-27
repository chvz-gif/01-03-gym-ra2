const content = document.getElementById("content");
const toast = document.getElementById("toast");

function showToast(message, error = false) {
  toast.textContent = message;
  toast.className = "toast show" + (error ? " error" : "");
  setTimeout(() => toast.className = "toast", 3000);
}

const DEMO_STORAGE_KEY = "gym_0103_static_demo_v1";

function demoLoad() {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn("No se pudo leer el almacenamiento local de demostración.", err);
  }

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  const state = {
    clientes: [{
      idCliente: 1, nombre: "Juan Pérez", telefono: "809-000-0000",
      correo: "juan@ejemplo.com", fechaRegistro: start.toISOString().slice(0, 10), estado: "Activo"
    }],
    tipos: [{ idTipo: 1, nombre: "Mensual", duracionDias: 30, precio: 1500, descripcion: "Membresía mensual" }],
    membresias: [{
      idMembresia: 1, idCliente: 1, idTipo: 1,
      fechaInicio: start.toISOString().slice(0, 10), fechaFin: end.toISOString().slice(0, 10), estado: "Activa"
    }],
    entrenadores: [{
      idEntrenador: 1, nombre: "Carlos Gómez", especialidad: "Musculación",
      telefono: "809-111-1111", estado: "Activo"
    }],
    pagos: []
  };
  demoSave(state);
  return state;
}

function demoSave(state) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    throw new Error("El navegador no permitió guardar la demostración local.");
  }
}

function demoNextId(items, field) {
  return items.reduce((max, item) => Math.max(max, Number(item[field]) || 0), 0) + 1;
}

function demoJoinMembresias(state) {
  return state.membresias.map(m => {
    const cliente = state.clientes.find(c => Number(c.idCliente) === Number(m.idCliente));
    const tipo = state.tipos.find(t => Number(t.idTipo) === Number(m.idTipo));
    return { ...m, clienteNombre: cliente?.nombre || "Cliente no encontrado", tipoNombre: tipo?.nombre || "Tipo no encontrado" };
  });
}

async function api(action, entity, body = null) {
  const state = demoLoad();
  if (action === "read") {
    if (entity === "clientes") return state.clientes;
    if (entity === "entrenadores") return state.entrenadores;
    if (entity === "membresias") return demoJoinMembresias(state);
    if (entity === "pagos") {
      const membresias = demoJoinMembresias(state);
      return state.pagos.map(p => {
        const membresia = membresias.find(m => Number(m.idMembresia) === Number(p.idMembresia));
        return { ...p, clienteNombre: membresia?.clienteNombre || "Cliente no encontrado" };
      });
    }
  }

  if (action === "options" && entity === "clientes") return state.clientes;
  if (action === "options" && entity === "membresias") return demoJoinMembresias(state);

  if (action === "insert" && entity === "clientes") {
    const record = { idCliente: demoNextId(state.clientes, "idCliente"), ...body };
    state.clientes.push(record);
    demoSave(state);
    return record;
  }
  if (action === "insert" && entity === "entrenadores") {
    const record = { idEntrenador: demoNextId(state.entrenadores, "idEntrenador"), ...body };
    state.entrenadores.push(record);
    demoSave(state);
    return record;
  }
  if (action === "insert" && entity === "membresias") {
    const idCliente = Number(body.idCliente);
    const idTipo = Number(body.idTipo);
    if (!state.clientes.some(c => Number(c.idCliente) === idCliente)) throw new Error("Selecciona un cliente válido.");
    if (!state.tipos.some(t => Number(t.idTipo) === idTipo)) throw new Error("El ID de tipo de membresía no existe en esta demostración.");
    const record = { idMembresia: demoNextId(state.membresias, "idMembresia"), ...body, idCliente, idTipo };
    state.membresias.push(record);
    demoSave(state);
    return record;
  }
  if (action === "insert" && entity === "pagos") {
    const idMembresia = Number(body.idMembresia);
    const monto = Number(body.monto);
    if (!state.membresias.some(m => Number(m.idMembresia) === idMembresia)) throw new Error("Selecciona una membresía válida.");
    if (!Number.isFinite(monto) || monto <= 0) throw new Error("El monto debe ser mayor que 0.");
    const record = { idPago: demoNextId(state.pagos, "idPago"), ...body, idMembresia, monto };
    state.pagos.push(record);
    demoSave(state);
    return record;
  }
  throw new Error("Operación no disponible en la demostración estática.");
}

function today() {
  return new Date().toISOString().slice(0,10);
}

function renderInicio() {
  content.innerHTML = `
    <section class="hero">
      <span class="badge">RA2 · Sistema web</span>
      <h1>Bienvenido a 01|03 Gym</h1>
      <p class="muted">
        Sistema para registrar clientes, membresías, entrenadores y pagos,
        y consultar sus respectivos reportes.
      </p>
    </section>
    <section class="grid">
      <div class="card"><h3>Clientes</h3><p class="muted">Formulario de registro y reporte de clientes.</p></div>
      <div class="card"><h3>Membresías</h3><p class="muted">Gestión de membresías asociadas a clientes.</p></div>
      <div class="card"><h3>Entrenadores</h3><p class="muted">Registro de entrenadores y especialidades.</p></div>
      <div class="card"><h3>Pagos</h3><p class="muted">Registro y lectura de pagos realizados.</p></div>
    </section>
  `;
}

function formCliente() {
  content.innerHTML = `
    <div class="form-card">
      <div class="section-head">
        <h2>Formulario de Cliente</h2>
        <span class="badge">INSERTAR</span>
      </div>
      <form id="clienteForm">
        <div class="form-grid">
          <div><label>Nombre</label><input name="nombre" required></div>
          <div><label>Teléfono</label><input name="telefono"></div>
          <div><label>Correo</label><input name="correo" type="email"></div>
          <div><label>Fecha de registro</label><input name="fechaRegistro" type="date" value="${today()}" required></div>
          <div><label>Estado</label>
            <select name="estado"><option>Activo</option><option>Inactivo</option></select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Insertar cliente</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("clienteForm").addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api("insert", "clientes", Object.fromEntries(f.entries()));
      e.target.reset();
      e.target.fechaRegistro.value = today();
      showToast("Cliente insertado correctamente.");
    } catch (err) { showToast(err.message, true); }
  });
}

async function formMembresia() {
  content.innerHTML = `<div class="form-card"><div class="loading">Cargando clientes...</div></div>`;
  try {
    const clientes = await api("options", "clientes");
    content.innerHTML = `
      <div class="form-card">
        <div class="section-head">
          <h2>Formulario de Membresía</h2>
          <span class="badge">INSERTAR</span>
        </div>
        <form id="membresiaForm">
          <div class="form-grid">
            <div>
              <label>Cliente</label>
              <select name="idCliente" required>
                ${clientes.map(c => `<option value="${c.idCliente}">${escapeHtml(c.nombre)} (#${c.idCliente})</option>`).join("")}
              </select>
            </div>
            <div>
              <label>ID Tipo de membresía</label>
              <input name="idTipo" type="number" min="1" value="1" required>
            </div>
            <div><label>Fecha de inicio</label><input name="fechaInicio" type="date" required></div>
            <div><label>Fecha de fin</label><input name="fechaFin" type="date" required></div>
            <div>
              <label>Estado</label>
              <select name="estado"><option>Activa</option><option>Inactiva</option><option>Vencida</option></select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn primary" type="submit">Insertar membresía</button>
          </div>
        </form>
      </div>`;
    document.getElementById("membresiaForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api("insert", "membresias", Object.fromEntries(f.entries()));
        e.target.reset();
        showToast("Membresía insertada correctamente.");
      } catch (err) { showToast(err.message, true); }
    });
  } catch (err) { content.innerHTML = `<div class="form-card"><p class="muted">No fue posible cargar clientes: ${escapeHtml(err.message)}</p></div>`; }
}

function formEntrenador() {
  content.innerHTML = `
    <div class="form-card">
      <div class="section-head">
        <h2>Formulario de Entrenador</h2>
        <span class="badge">INSERTAR</span>
      </div>
      <form id="entrenadorForm">
        <div class="form-grid">
          <div><label>Nombre</label><input name="nombre" required></div>
          <div><label>Especialidad</label><input name="especialidad"></div>
          <div><label>Teléfono</label><input name="telefono"></div>
          <div><label>Estado</label><select name="estado"><option>Activo</option><option>Inactivo</option></select></div>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Insertar entrenador</button>
        </div>
      </form>
    </div>`;
  document.getElementById("entrenadorForm").addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api("insert", "entrenadores", Object.fromEntries(f.entries()));
      e.target.reset();
      showToast("Entrenador insertado correctamente.");
    } catch (err) { showToast(err.message, true); }
  });
}

async function formPago() {
  content.innerHTML = `<div class="form-card"><div class="loading">Cargando membresías...</div></div>`;
  try {
    const membresias = await api("options", "membresias");
    content.innerHTML = `
      <div class="form-card">
        <div class="section-head">
          <h2>Formulario de Pago</h2>
          <span class="badge">INSERTAR</span>
        </div>
        <form id="pagoForm">
          <div class="form-grid">
            <div>
              <label>Membresía</label>
              <select name="idMembresia" required>
                ${membresias.map(m => `<option value="${m.idMembresia}">#${m.idMembresia} · ${escapeHtml(m.clienteNombre)} · ${escapeHtml(m.tipoNombre)}</option>`).join("")}
              </select>
            </div>
            <div><label>Fecha de pago</label><input name="fechaPago" type="date" value="${today()}" required></div>
            <div><label>Monto</label><input name="monto" type="number" step="0.01" min="0.01" required></div>
            <div>
              <label>Método</label>
              <select name="metodo"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn primary" type="submit">Insertar pago</button>
          </div>
        </form>
      </div>`;
    document.getElementById("pagoForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api("insert", "pagos", Object.fromEntries(f.entries()));
        e.target.reset();
        e.target.fechaPago.value = today();
        showToast("Pago insertado correctamente.");
      } catch (err) { showToast(err.message, true); }
    });
  } catch (err) { content.innerHTML = `<div class="form-card"><p class="muted">No fue posible cargar membresías: ${escapeHtml(err.message)}</p></div>`; }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function table(title, headers, rowsHtml) {
  return `
    <section class="card report-card">
      <div class="report-title">
        <div class="section-head"><h3>${title}</h3><span class="badge">LECTURA</span></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="${headers.length}"><div class="empty">No hay registros todavía.</div></td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
}

async function renderReportes() {
  content.innerHTML = `<div class="form-card"><div class="loading">Cargando los reportes...</div></div>`;
  try {
    const [clientes, membresias, entrenadores, pagos] = await Promise.all([
      api("read", "clientes"),
      api("read", "membresias"),
      api("read", "entrenadores"),
      api("read", "pagos")
    ]);

    const cRows = clientes.map(c => `
      <tr><td>${c.idCliente}</td><td>${escapeHtml(c.nombre)}</td><td>${escapeHtml(c.telefono)}</td>
      <td>${escapeHtml(c.correo)}</td><td>${c.fechaRegistro}</td><td>${escapeHtml(c.estado)}</td></tr>`).join("");

    const mRows = membresias.map(m => `
      <tr><td>${m.idMembresia}</td><td>${escapeHtml(m.clienteNombre)}</td>
      <td>${escapeHtml(m.tipoNombre)}</td><td>${m.fechaInicio}</td><td>${m.fechaFin}</td>
      <td>${escapeHtml(m.estado)}</td></tr>`).join("");

    const eRows = entrenadores.map(e => `
      <tr><td>${e.idEntrenador}</td><td>${escapeHtml(e.nombre)}</td>
      <td>${escapeHtml(e.especialidad)}</td><td>${escapeHtml(e.telefono)}</td>
      <td>${escapeHtml(e.estado)}</td></tr>`).join("");

    const pRows = pagos.map(p => `
      <tr><td>${p.idPago}</td><td>#${p.idMembresia}</td><td>${escapeHtml(p.clienteNombre)}</td>
      <td>${p.fechaPago}</td><td>RD$ ${Number(p.monto).toFixed(2)}</td><td>${escapeHtml(p.metodo)}</td></tr>`).join("");

    content.innerHTML = `
      <div class="section-head">
        <div><h1>Reportes</h1><p class="muted">Método de lectura aplicado a cada entidad.</p></div>
        <span class="badge">4 reportes</span>
      </div>
      <div class="grid">
        ${table("Reporte de Clientes", ["ID","Nombre","Teléfono","Correo","Fecha registro","Estado"], cRows)}
        ${table("Reporte de Membresías", ["ID","Cliente","Tipo","Inicio","Fin","Estado"], mRows)}
        ${table("Reporte de Entrenadores", ["ID","Nombre","Especialidad","Teléfono","Estado"], eRows)}
        ${table("Reporte de Pagos", ["ID","Membresía","Cliente","Fecha","Monto","Método"], pRows)}
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="form-card"><p class="muted">Error al leer los reportes: ${escapeHtml(err.message)}</p></div>`;
  }
}

async function showView(view) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "inicio") renderInicio();
  if (view === "clientes") formCliente();
  if (view === "membresias") await formMembresia();
  if (view === "entrenadores") formEntrenador();
  if (view === "pagos") await formPago();
  if (view === "reportes") await renderReportes();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const usuario = document.getElementById("usuario").value.trim();
  const clave = document.getElementById("clave").value.trim();

  // Acceso de demostración para el RA2.
  if (!usuario || !clave) return;
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("currentUser").textContent = `Usuario: ${usuario}`;
  showView("inicio");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginForm").reset();
});
