const app = document.getElementById("app");

const ui = {
  profile: null,
  tab: "dia",
  subjectId: null,
  filter: "Abiertas",
  selectedDate: isoDate(),
  month: new Date(2026, 8, 1),
  editorOpen: false,
  editorDay: 1,
  showNote: false,
  showHelpLove: false,
  showTaskForm: false,
  evidenceId: null,
  toast: "",
  loading: true,
};

let state = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

function isIsrael() {
  return ui.profile?.id === "israel";
}

function toast(message) {
  ui.toast = message;
  render();
  setTimeout(() => {
    if (ui.toast === message) {
      ui.toast = "";
      render();
    }
  }, 1800);
}

const STORAGE_KEY = "ld-acompanamiento-state";

async function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
      ui.loading = false;
      return;
    } catch (_) { /* seed fallback */ }
  }
  const res = await fetch("seed.json");
  state = await res.json();
  ui.loading = false;
}

async function saveState(activity) {
  if (activity) {
    state.activity = [
      { id: Date.now(), actor: ui.profile?.name || "Familia", action: activity, createdAt: new Date().toISOString() },
      ...(state.activity || []),
    ].slice(0, 40);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function namedSubjects() {
  return (state.subjects || []).filter((s) => !s.extra || s.name.trim());
}

function extras() {
  return (state.subjects || []).filter((s) => s.extra);
}

function subjectOptions(selected) {
  const items = [
    { id: "recreo", name: "Recreo" },
    ...namedSubjects().map((s) => ({ id: s.id, name: s.name })),
    ...extras().filter((s) => !s.name).map((s) => ({ id: s.id, name: `${s.short} · sin nombre aún` })),
  ];
  return items.map((s) => `<option value="${esc(s.id)}" ${s.id === selected ? "selected" : ""}>${esc(s.name)}</option>`).join("");
}

function captureEditorDraft() {
  if (!isIsrael() || !ui.editorOpen) return;
  const name = document.getElementById("school-name")?.value.trim();
  const turno = document.getElementById("school-turno")?.value;
  if (name) state.school.name = name;
  if (turno) state.school.turno = turno;
  const group = document.getElementById("school-group")?.value.trim();
  const titular = document.getElementById("school-titular")?.value.trim();
  const city = document.getElementById("school-city")?.value.trim();
  const cct = document.getElementById("school-cct")?.value.trim();
  if (group !== undefined) state.school.group = group;
  if (titular !== undefined) state.school.titular = titular;
  if (city !== undefined) state.school.city = city;
  if (cct !== undefined) state.school.cct = cct;
  document.querySelectorAll("[data-extra]").forEach((input) => {
    const sub = state.subjects.find((s) => s.id === input.dataset.extra);
    if (sub) sub.name = input.value.trim();
  });
  const times = [...document.querySelectorAll("[data-time]")];
  const subs = [...document.querySelectorAll("[data-sub]")];
  if (times.length) {
    state.schedule[String(ui.editorDay)] = times.map((input, i) => ({
      time: input.value.trim() || "8:00–8:50",
      subjectId: subs[i]?.value || "esp",
    }));
  }
}

function tasksFor(subjectName) {
  return (state.assignments || []).filter((t) => t.subject === subjectName);
}

function openTasks() {
  return (state.assignments || []).filter((t) => t.status !== "Hecha");
}

function todayStatus(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return { date: d, iso: isoDate(d), info: schoolStatus(isoDate(d)), weekday: d.getDay() };
}

function scheduleFor(weekday) {
  return state.schedule?.[String(weekday)] || [];
}

function periodLabel(period) {
  const sub = subjectById(state, period.subjectId);
  return subjectLabel(sub);
}

function render() {
  if (!state) {
    app.innerHTML = `<div class="boot"><img src="brand/logo-circular.png?v=4" alt="L&D Studio"><p>Abriendo el acompañamiento…</p></div>`;
    return;
  }
  app.innerHTML = ui.profile ? renderShell() : renderWelcome();
  if (ui.toast) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = `✓ ${ui.toast}`;
    app.appendChild(t);
  }
}

function renderWelcome() {
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="welcome-art" aria-hidden="true">
          <img src="brand/logo-circular.png?v=4" alt="">
        </div>
        <div class="access-panel">
          <div class="welcome-mark"><img src="brand/logo-circular.png?v=4" alt="Learning & Development Studio"></div>
          <span class="kicker">Espacio familiar privado</span>
          <h1>Elige tu perfil.</h1>
          <p>Entra como Santiago, Perla o Israel. Acompañamiento académico para 6° de primaria en Celaya.</p>
          <div class="profile-grid">
            ${PROFILES.map((p) => `
              <button class="profile-card ${p.tone}" data-action="enter" data-id="${p.id}">
                <span class="avatar">${p.initial}</span>
                <div>
                  <strong>${esc(p.name)}</strong>
                  <small>${esc(p.role)}</small>
                </div>
                <b>→</b>
              </button>
            `).join("")}
          </div>
          <div class="welcome-foot">
            <span>${esc(state.school.grade)}</span>
            <i></i>
            <span>${esc(state.school.cycle)}</span>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderShell() {
  const p = ui.profile;
  return `
    <div class="shell">
      <aside class="nav">
        <div class="brand-h"><img src="brand/logo-horizontal-on-dark.png?v=4" alt="Learning & Development Studio"></div>
        <nav>
          ${TABS.map((t) => `<button class="${ui.tab === t.id ? "active" : ""}" data-action="tab" data-id="${t.id}">${t.label}</button>`).join("")}
        </nav>
        <div class="family-pill">
          <div class="avatars"><span>I</span><span>P</span><span>S</span></div>
          <small>FAMILIA VENTURA</small>
          <strong>Acompañamiento académico</strong>
        </div>
      </aside>
      <section class="content">
        <div class="mobile-top">
          <img src="brand/logo-horizontal.png?v=4" alt="L&D Studio">
          <button class="switch-profile" data-action="switch">Cambiar</button>
        </div>
        ${ui.tab === "avance" ? "" : renderMasthead()}
        ${renderTab()}
      </section>
    </div>
    <nav class="mobile-nav">
      ${TABS.map((t) => `<button class="${ui.tab === t.id ? "active" : ""}" data-action="tab" data-id="${t.id}">${t.label}</button>`).join("")}
    </nav>
    ${ui.showNote && p.id === "santiago" ? renderDailyNote() : ""}
    ${ui.showHelpLove ? renderHelpLove() : ""}
    ${ui.showTaskForm ? renderTaskModal() : ""}
  `;
}

function renderMasthead() {
  const copy = {
    dia: { title: "Mi día", text: "Horario de hoy, tareas pendientes y lo que va pasando en la familia." },
    materias: { title: "Materias", text: "Clases oficiales del Plan de Estudio SEP 2022, más tres espacios extracurriculares." },
    calendario: { title: "Calendario", text: "Tareas por fecha de entrega y días del ciclo escolar 2026–2027." },
    asistencia: { title: "Asistencia", text: "Registro familiar. La lista oficial sigue siendo la de la escuela." },
    mensajes: { title: "Mensajes", text: "Conversación privada entre Santiago, Perla e Israel." },
    escuela: { title: "Escuela", text: "Datos del ciclo, calendario SEP y ligas oficiales." },
  }[ui.tab] || { title: ui.tab, text: "" };
  const today = todayStatus();
  return `
    <header class="masthead">
      <div>
        <small>${esc(ui.profile.name.toUpperCase())} · ${esc(ui.profile.role.toUpperCase())}</small>
        <h1>${copy.title}</h1>
        <p>${copy.text}</p>
      </div>
      <div class="masthead-side">
        <span class="meta-chip">${esc(today.info.label)}</span>
        <button class="switch-profile" data-action="switch">Cambiar perfil</button>
      </div>
    </header>
  `;
}

function renderTab() {
  switch (ui.tab) {
    case "dia": return renderDay();
    case "materias": return ui.subjectId ? renderSubjectDetail() : renderSubjects();
    case "calendario": return renderCalendar();
    case "asistencia": return renderAttendance();
    case "avance": return renderProgress();
    case "mensajes": return renderMessages();
    case "escuela": return renderSchool();
    default: return "";
  }
}

function renderDay() {
  const today = todayStatus();
  const tomorrow = todayStatus(1);
  const pending = openTasks().slice(0, 5);
  const week = weekAttendance();
  return `
    <div class="daily-home">
      <div class="card">
        <span class="eyebrow">6° DE PRIMARIA · ${esc(state.school.cycle)}</span>
        <h2>Hola${ui.profile.id === "santiago" ? ", Santi" : `, ${esc(ui.profile.name)}`}.</h2>
        <p>Turno ${esc(state.school.turno.toLowerCase())} · ${esc(state.school.group || state.school.grade)} · ${esc(state.school.name)}</p>
        <p>${esc(formatLongDate(today.iso))}</p>
      </div>
      <div class="grid-2">
        ${renderScheduleCard(today, "Hoy")}
        ${renderScheduleCard(tomorrow, "Mañana")}
      </div>
      <div class="grid-2">
        <section class="overview">
          <span class="eyebrow">Tareas</span>
          <h3>Lo que sigue</h3>
          ${pending.length ? pending.map((t) => `
            <div class="period">
              <time>${esc(formatShortDate(t.dueDate))}</time>
              <i style="background:${esc(subjectById(state, subjectIdFromName(t.subject)).color)}">${esc((t.subject || "?").slice(0, 2).toUpperCase())}</i>
              <div>
                <b>${esc(t.title)}</b>
                <small>${esc(t.subject)} · ${esc(t.status)}</small>
              </div>
            </div>
          `).join("") : `<p class="empty">No hay tareas abiertas. Cuando Israel o Perla agreguen una, aparece aquí.</p>`}
          <button class="ghost" data-action="tab" data-id="materias">Ver materias →</button>
        </section>
        <section class="overview">
          <span class="eyebrow">Asistencia</span>
          <h3>Esta semana</h3>
          <div class="week-strip">
            ${week.map((d) => `
              <div>
                <span>${d.label}</span>
                <b>${d.code}</b>
                <small>${esc(d.state)}</small>
              </div>
            `).join("")}
          </div>
          <button class="ghost" data-action="tab" data-id="asistencia">Ver asistencia →</button>
        </section>
      </div>
      <section class="overview">
        <span class="eyebrow">Familia Ventura</span>
        <h3>Actividad reciente</h3>
        <div class="activity">
          ${(state.activity || []).slice(0, 4).map((a) => `
            <article>
              <span>${esc(a.actor.slice(0, 1))}</span>
              <div>
                <p><b>${esc(a.actor)}</b> ${esc(a.action)}</p>
                <small>${esc(new Date(a.createdAt).toLocaleString("es-MX"))}</small>
              </div>
            </article>
          `).join("") || `<p class="empty">Todavía no hay actividad familiar.</p>`}
        </div>
        <button class="ghost" data-action="tab" data-id="mensajes">Abrir mensajes →</button>
      </section>
      ${isIsrael() ? renderScheduleEditor() : `
        <p class="lock-note">El horario lo actualiza solo Israel desde su perfil de mentor.</p>
      `}
    </div>
  `;
}

function renderScheduleCard(day, title) {
  if (!day.info.school) {
    return `
      <section class="card weekend">
        <span class="eyebrow">${title} · ${WEEKDAYS[day.date.getDay()].toUpperCase()}</span>
        <h3>${esc(day.info.label)}</h3>
        <p>${day.info.kind === "weekend"
          ? "Descansa, juega y recarga. El lunes volvemos con todo."
          : "Hoy no hay clases según el calendario SEP 2026–2027."}</p>
        <div class="weekend-motto"><span>⚽ Sueña en grande.</span><span>🏀 Practica con alegría.</span></div>
      </section>
    `;
  }
  const rows = scheduleFor(day.weekday);
  return `
    <section class="card">
      <span class="eyebrow">${title} · ${WEEKDAYS[day.date.getDay()].toUpperCase()}</span>
      <h3>Turno ${esc(state.school.turno.toLowerCase())}</h3>
      <div class="period-list">
        ${rows.map((row, i) => {
          const sub = subjectById(state, row.subjectId);
          const isBreak = row.subjectId === "recreo";
          return `
            <article class="period ${isBreak ? "break" : ""}">
              <time>${esc(row.time)}</time>
              <i style="background:${esc(sub.color)}">${isBreak ? "·" : i + 1}</i>
              <div>
                <b>${esc(periodLabel(row))}</b>
                <small>${isBreak ? "Pausa" : (sub.teacher || "Maestro/a por registrar")}</small>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderScheduleEditor() {
  if (!ui.editorOpen) {
    return `<button class="primary" data-action="toggle-editor">Editar horario de Santiago</button>`;
  }
  const rows = scheduleFor(ui.editorDay);
  return `
    <section class="editor">
      <span class="eyebrow">Solo Israel · autorización de mentor</span>
      <h3>Horario semanal</h3>
      <p>Este es el único perfil que puede cambiar horas, materias y el turno. Guarda cada día después de editarlo.</p>
      <div class="gold-rule"></div>
      <div class="grid-2">
        <label>Nombre de la escuela
          <input id="school-name" value="${esc(state.school.name)}">
        </label>
        <label>Turno
          <select id="school-turno">
            <option ${state.school.turno === "Matutino" ? "selected" : ""}>Matutino</option>
            <option ${state.school.turno === "Vespertino" ? "selected" : ""}>Vespertino</option>
          </select>
        </label>
        <label>Grupo
          <input id="school-group" value="${esc(state.school.group || "")}" placeholder="6° A">
        </label>
        <label>Maestra o maestro titular
          <input id="school-titular" value="${esc(state.school.titular || "")}">
        </label>
        <label>Ciudad
          <input id="school-city" value="${esc(state.school.city || "")}">
        </label>
        <label>CCT
          <input id="school-cct" value="${esc(state.school.cct || "")}">
        </label>
      </div>
      <h3 style="margin-top:16px">Tres extracurriculares</h3>
      <p>Tú les pones el nombre. Pueden ser fútbol, música, catecismo, inglés extra, lo que lleve Santiago.</p>
      <div class="grid-3">
        ${extras().map((s, i) => `
          <label>Extra ${i + 1}
            <input data-extra="${esc(s.id)}" value="${esc(s.name)}" placeholder="Nombre de la clase">
          </label>
        `).join("")}
      </div>
      <div class="day-tabs" style="margin-top:16px">
        ${["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((name, i) => `
          <button class="${ui.editorDay === i + 1 ? "active" : ""}" data-action="editor-day" data-id="${i + 1}">${name}</button>
        `).join("")}
      </div>
      <div class="editor-rows" id="editor-rows">
        ${rows.map((row, i) => `
          <div class="editor-row">
            <input data-time="${i}" value="${esc(row.time)}" placeholder="8:00–8:50">
            <select data-sub="${i}">${subjectOptions(row.subjectId)}</select>
            <button class="ghost" data-action="remove-period" data-id="${i}">×</button>
          </div>
        `).join("")}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="ghost" data-action="add-period">＋ Agregar periodo</button>
        <button class="primary" data-action="save-editor">Guardar ${["", "lunes", "martes", "miércoles", "jueves", "viernes"][ui.editorDay]} y datos</button>
        <button class="ghost" data-action="toggle-editor">Cerrar</button>
      </div>
    </section>
  `;
}

function subjectIdFromName(name) {
  const found = (state.subjects || []).find((s) => s.name === name);
  return found?.id || "esp";
}

function renderSubjects() {
  return `
    <div>
      ${CAMPOS.map((campo) => {
        const list = (state.subjects || []).filter((s) => s.campo === campo);
        if (!list.length) return "";
        return `
          <section class="campo-block">
            <h3>${esc(campo)}</h3>
            ${campo === "Extracurricular" ? `<p class="empty" style="padding:0 0 8px">Tres espacios para que Israel nombre las clases extra de Santiago.</p>` : ""}
            <div class="subject-grid">
              ${list.map((s) => {
                const tasks = s.name ? tasksFor(s.name) : [];
                const open = tasks.filter((t) => t.status !== "Hecha").length;
                const pct = tasks.length ? Math.round(tasks.filter((t) => t.status === "Hecha").length / tasks.length * 100) : 0;
                return `
                  <article class="subject" style="border-top-color:${esc(s.color)}">
                    <h2>${esc(s.name || `Extracurricular ${s.short}`)}</h2>
                    <p>${esc(s.teacher || (s.extra && !s.name ? "Israel asignará el nombre" : "Maestro/a por registrar"))}</p>
                    <div class="dl">
                      <div><span>Abiertas</span><b>${open}</b></div>
                      <div><span>Avance</span><b>${tasks.length ? pct + "%" : "—"}</b></div>
                    </div>
                    <button class="ghost" data-action="open-subject" data-id="${esc(s.id)}">Abrir clase →</button>
                  </article>
                `;
              }).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderSubjectDetail() {
  const s = (state.subjects || []).find((x) => x.id === ui.subjectId);
  if (!s) return renderSubjects();
  const all = s.name ? tasksFor(s.name) : [];
  const shown = all.filter((t) => {
    if (ui.filter === "Todas") return true;
    if (ui.filter === "Abiertas") return t.status !== "Hecha";
    return t.status === ui.filter;
  });
  const filters = ["Abiertas", "Por hacer", "En curso", "Necesito ayuda", "Hecha", "Todas"];
  return `
    <div>
      <button class="ghost" data-action="close-subject">← Todas las materias</button>
      <section class="card" style="margin-top:12px;border-top:5px solid ${esc(s.color)}">
        <span class="eyebrow">${esc(s.campo)}</span>
        <h2>${esc(s.name || "Extracurricular sin asignar")}</h2>
        <p>${esc(s.teacher || "Maestro/a por registrar")}</p>
        ${isIsrael() || (ui.profile.id === "perla" && !s.extra) ? `
          <form data-action="save-teacher" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <input name="teacher" placeholder="Nombre del maestro o maestra" value="${esc(s.teacher)}">
            ${s.extra && isIsrael() ? `<input name="extraName" placeholder="Nombre de la extracurricular" value="${esc(s.name)}">` : ""}
            <button class="primary">Guardar</button>
          </form>
        ` : s.extra && !isIsrael() ? `<p class="lock-note">Solo Israel puede nombrar las clases extracurriculares.</p>` : ""}
        ${s.name ? `<button class="primary" style="margin-top:10px" data-action="new-task">＋ Agregar tarea</button>` : `<p class="empty">Israel tiene que ponerle nombre a esta clase extra antes de agregar tareas.</p>`}
      </section>
      <div class="filters">
        ${filters.map((f) => {
          const count = f === "Todas" ? all.length : f === "Abiertas" ? all.filter((t) => t.status !== "Hecha").length : all.filter((t) => t.status === f).length;
          return `<button class="${ui.filter === f ? "active" : ""}" data-action="filter" data-id="${esc(f)}">${esc(f)} <b>${count}</b></button>`;
        }).join("")}
      </div>
      ${renderTaskList(shown)}
    </div>
  `;
}

function renderTaskList(tasks) {
  if (!tasks.length) return `<p class="empty">No hay tareas en este filtro.</p>`;
  return tasks.map((t) => `
    <article class="task">
      <div class="dot" style="background:${esc(subjectById(state, subjectIdFromName(t.subject)).color)}">${esc(t.subject.slice(0, 2).toUpperCase())}</div>
      <div>
        <small>${esc(t.subject)}</small>
        <b>${esc(t.title)}</b>
        <div>${esc(formatShortDate(t.dueDate))}</div>
      </div>
      <select data-action="status" data-id="${t.id}">
        ${TASK_STATUS.map((st) => `<option ${t.status === st.id ? "selected" : ""}>${st.label}</option>`).join("")}
      </select>
      <button class="ghost" data-action="evidence" data-id="${t.id}">Evidencia</button>
      <button class="danger" data-action="delete-task" data-id="${t.id}">×</button>
    </article>
    ${ui.evidenceId === t.id ? renderEvidence(t) : ""}
  `).join("");
}

function renderEvidence(task) {
  const items = (state.evidence || []).filter((e) => Number(e.assignmentId) === Number(task.id));
  return `
    <section class="card">
      <h3>Evidencia y recursos</h3>
      ${items.length ? items.map((e) => `
        <p><a href="${esc(e.url)}" target="_blank" rel="noreferrer">${e.kind === "file" ? "📎" : "↗"} ${esc(e.label)}</a> · ${esc(e.sharedBy)}${e.note ? ` · ${esc(e.note)}` : ""}</p>
      `).join("") : `<p class="empty">Todavía no hay nada compartido.</p>`}
      <form data-action="add-evidence" data-id="${task.id}">
        <label>Quién comparte
          <select name="sharedBy">
            ${PROFILES.map((p) => `<option ${p.name === ui.profile.name ? "selected" : ""}>${p.name}</option>`).join("")}
          </select>
        </label>
        <label>Foto o documento <input type="file" name="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"></label>
        <label>O un enlace <input type="url" name="link" placeholder="https://"></label>
        <label>Nota <input name="note" placeholder="Qué debe saber la familia"></label>
        <button class="primary">Agregar evidencia</button>
      </form>
    </section>
  `;
}

function renderCalendar() {
  const grouped = {};
  (state.assignments || []).forEach((t) => {
    (grouped[t.dueDate] ??= []).push(t);
  });
  const dates = Object.keys(grouped).sort();
  return `
    <div class="calendar-groups">
      ${dates.length ? dates.map((d) => `
        <article>
          <time>${esc(formatLongDate(d))}</time>
          ${grouped[d].map((t) => `<p><b>${esc(t.subject)}</b> · ${esc(t.title)} · ${esc(t.status)}</p>`).join("")}
        </article>
      `).join("") : `<p class="empty">Cuando haya tareas con fecha, se agrupan aquí.</p>`}
    </div>
  `;
}

function weekAttendance() {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - ((day + 6) % 7));
  return [0, 1, 2, 3, 4].map((i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = isoDate(d);
    const rec = (state.attendance || []).find((a) => a.schoolDate === iso);
    const st = rec?.state || (schoolStatus(iso).school ? "Sin registro" : "Sin clases");
    const code = rec ? ATTENDANCE_STATES.find((x) => x.id === rec.state)?.code || st.slice(0, 1) : "—";
    return { label: WEEKDAYS_SHORT[d.getDay()], state: st, code };
  });
}

function renderAttendance() {
  const recs = state.attendance || [];
  const counted = recs.filter((r) => schoolStatus(r.schoolDate).school);
  const present = counted.filter((r) => r.state === "Presente" || r.state === "Retardo").length;
  const pct = counted.length ? Math.round(present / counted.length * 100) : 0;
  const y = ui.month.getFullYear();
  const m = ui.month.getMonth();
  const start = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < start; i += 1) cells.push(`<span></span>`);
  for (let d = 1; d <= days; d += 1) {
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rec = recs.find((r) => r.schoolDate === iso);
    const info = schoolStatus(iso);
    const cls = [
      info.school ? "" : "off",
      rec ? rec.state.toLowerCase() : "",
      ui.selectedDate === iso ? "selected" : "",
    ].join(" ");
    cells.push(`<button class="${cls}" data-action="pick-date" data-id="${iso}" ${info.school ? "" : "disabled"}>${d}<small>${rec ? rec.state.slice(0, 1) : ""}</small></button>`);
  }
  return `
    <div class="daily-home">
      <div class="attendance-summary">
        <article><b>${pct}%</b><span>Presente o retardo</span></article>
        <article><b>${recs.filter((r) => r.state === "Falta").length}</b><span>Faltas</span></article>
        <article><b>${recs.filter((r) => r.state === "Retardo").length}</b><span>Retardos</span></article>
      </div>
      <div class="grid-2">
        <section class="month-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <button class="ghost" data-action="month" data-id="-1">←</button>
            <h3>${MONTHS[m]} ${y}</h3>
            <button class="ghost" data-action="month" data-id="1">→</button>
          </div>
          <div class="weekdays">${WEEKDAYS_SHORT.map((d) => `<span>${d}</span>`).join("")}</div>
          <div class="month-grid">${cells.join("")}</div>
          <div class="legend"><span>P presente</span><span>R retardo</span><span>F falta</span><span>J justificada</span></div>
        </section>
        <form class="form-card" data-action="save-attendance">
          <span class="eyebrow">Registro familiar</span>
          <h2>Marcar un día</h2>
          <label>Fecha <input type="date" name="schoolDate" value="${esc(ui.selectedDate)}" required></label>
          <label>Estado
            <select name="state">
              ${ATTENDANCE_STATES.map((s) => `<option>${s.id}</option>`).join("")}
            </select>
          </label>
          <label>Nota <input name="note" placeholder="Opcional"></label>
          <button class="primary">Guardar registro</button>
        </form>
      </div>
    </div>
  `;
}

function renderProgress() {
  const all = state.assignments || [];
  const done = all.filter((t) => t.status === "Hecha").length;
  const pct = all.length ? Math.round(done / all.length * 100) : 0;
  return `
    <div class="daily-home">
      <section class="card progress-hero">
        <div>
          <span class="eyebrow">Avance general</span>
          <h2>Un paso a la vez, Santi.</h2>
          <p>Cada tarea terminada te mueve. Sigue.</p>
          <button class="primary" data-action="tab" data-id="materias">Continuar con una clase →</button>
        </div>
        <div class="ring" style="--p:${pct}%"><span><b>${all.length ? pct + "%" : "Listo"}</b><small>${all.length ? "completado" : "por empezar"}</small></span></div>
      </section>
      <section class="card">
        <h3>Avance por materia</h3>
        <div class="progress-list">
          ${namedSubjects().map((s) => {
            const tasks = tasksFor(s.name);
            const n = tasks.length ? Math.round(tasks.filter((t) => t.status === "Hecha").length / tasks.length * 100) : 0;
            return `
              <article>
                <div><b>${esc(s.name)}</b><span>${tasks.length ? `${tasks.filter((t) => t.status === "Hecha").length} de ${tasks.length}` : "Sin actividad"}</span></div>
                <div class="track"><i style="width:${n}%;background:${esc(s.color)}"></i></div>
                <strong>${tasks.length ? n + "%" : "—"}</strong>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderMessages() {
  return `
    <div class="collab">
      <section class="card">
        <h3>Mensajes de la familia</h3>
        ${isIsrael() ? `<button class="danger" data-action="clear-messages">Vaciar tablero</button>` : ""}
        ${(state.messages || []).map((m) => `
          <article class="msg">
            <b data-sender="${esc(m.sender)}">${esc(m.sender.slice(0, 1))}</b>
            <div>
              <b>${esc(m.sender)}</b>
              <p>${esc(m.body)}</p>
              <small>${esc(new Date(m.createdAt).toLocaleString("es-MX"))}</small>
            </div>
          </article>
        `).join("") || `<p class="empty">Aún no hay mensajes.</p>`}
        <div style="margin-top:18px">
          <h3>Pedir ayuda</h3>
          ${(state.help || []).map((h) => `
            <div class="help-item">
              <b>${esc(h.subject)}</b>
              <p>${esc(h.details)}</p>
              <span>${esc(h.status)}</span>
              ${isIsrael() ? `
                <div>
                  <button class="ghost" data-action="help-status" data-id="${h.id}" data-status="Agendada">Agendar</button>
                  <button class="primary" data-action="help-status" data-id="${h.id}" data-status="Resuelta">Resolver</button>
                </div>
              ` : ""}
            </div>
          `).join("") || `<p class="empty">No hay solicitudes de ayuda.</p>`}
        </div>
      </section>
      <div>
        <form class="form-card" data-action="send-message">
          <span class="eyebrow">Mensaje nuevo</span>
          <h2>Escribir a la familia</h2>
          <label>De
            <select name="sender">
              ${PROFILES.map((p) => `<option ${p.name === ui.profile.name ? "selected" : ""}>${p.name}</option>`).join("")}
            </select>
          </label>
          <label>Mensaje <textarea name="body" required placeholder="Comparte un recado…"></textarea></label>
          <button class="primary">Enviar</button>
        </form>
        <form class="form-card" style="margin-top:12px" data-action="send-help">
          <span class="eyebrow">Pedir ayuda</span>
          <h2>Nueva solicitud</h2>
          <label>Materia
            <select name="subject">
              ${namedSubjects().map((s) => `<option>${esc(s.name)}</option>`).join("")}
            </select>
          </label>
          <label>¿Qué necesitas? <textarea name="details" required></textarea></label>
          <button class="primary">Enviar solicitud</button>
        </form>
      </div>
    </div>
  `;
}

function renderSchool() {
  const s = state.school;
  const facts = [
    ["Escuela", s.name],
    ["Grupo", s.group || s.grade],
    ["Titular", s.titular || "Por registrar"],
    ["Turno", s.turno],
    ["Ciclo", s.cycle],
    ["Fase", s.phase],
    ["CCT", s.cct || "Por registrar"],
    ["Domicilio", s.address || s.city],
  ];
  return `
    <div class="daily-home">
      <section class="card school-card">
        <span class="eyebrow">Plan de Estudio SEP 2022</span>
        <h2>${esc(s.name)}</h2>
        <p class="school-place">${esc(s.city)} · ${esc(s.grade)}</p>
        <div class="fact-grid">
          ${facts.map(([label, value]) => `
            <div>
              <span>${esc(label)}</span>
              <b>${esc(value)}</b>
            </div>
          `).join("")}
        </div>
        <p class="school-copy">Las materias oficiales se organizan en cuatro campos formativos: Lenguajes; Saberes y pensamiento científico; Ética, naturaleza y sociedades; y De lo humano y lo comunitario. Además hay tres espacios extracurriculares que solo Israel nombra y acomoda en el horario.</p>
      </section>
      <section class="card">
        <h3>Fechas SEP 2026–2027</h3>
        <div class="sep-list">
          ${SEP_EVENTS.map((e) => `<p><b>${esc(formatShortDate(e.date))}</b><span>${esc(e.label)}</span></p>`).join("")}
        </div>
        <p class="school-copy">Vacaciones de invierno: 21 dic 2026 – 5 ene 2027. Semana Santa: 22 mar – 3 abr 2027. Clases: 31 ago 2026 – 9 jul 2027.</p>
      </section>
      <div class="official-links">
        ${SCHOOL_LINKS.map((l) => `
          <a href="${esc(l.href)}" target="_blank" rel="noreferrer">
            <span>${esc(l.mark)}</span>
            <div><strong>${esc(l.title)}</strong><small>${esc(l.copy)}</small></div>
            <b>↗</b>
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

function renderDailyNote() {
  return `
    <div class="backdrop" data-action="close-note">
      <section class="modal note-card">
        <img src="brand/logo-circular.png?v=4" alt="">
        <div class="heart">♥</div>
        <small class="eyebrow">Una nota para ti · ${WEEKDAYS[new Date().getDay()].toUpperCase()}</small>
        <h2>Que tengas un gran día, Santi.</h2>
        <p>${esc(dailyNote())}</p>
        <p><b>Siempre echándote porras,</b><br>Israel</p>
        <button class="primary" data-action="close-note">Estoy listo para hoy →</button>
      </section>
    </div>
  `;
}

function renderHelpLove() {
  return `
    <div class="backdrop" data-action="close-love">
      <section class="modal note-card">
        <img src="brand/logo-circular.png?v=4" alt="">
        <small class="eyebrow">Pedir ayuda es de listos</small>
        <h2>No estás solo, Santi.</h2>
        <p>Sigue con otra tarea abierta. Yo te acompaño con esta. Te quiero.</p>
        <button class="primary" data-action="close-love">Va, sigo adelante</button>
      </section>
    </div>
  `;
}

function renderTaskModal() {
  const sub = (state.subjects || []).find((s) => s.id === ui.subjectId);
  return `
    <div class="backdrop" data-action="close-task">
      <form class="modal" data-action="create-task" onclick="event.stopPropagation()">
        <span class="eyebrow">Nueva tarea</span>
        <h2>Agregar al plan de Santiago</h2>
        <label>Materia
          <select name="subject" required>
            ${namedSubjects().map((s) => `<option ${sub && s.id === sub.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
          </select>
        </label>
        <label>Tarea <input name="title" required placeholder="¿Qué hay que hacer?"></label>
        <label>Entrega <input name="dueDate" type="date" required></label>
        <button class="primary">Guardar tarea</button>
        <button type="button" class="ghost" data-action="close-task" style="margin-top:8px">Cancelar</button>
      </form>
    </div>
  `;
}

async function onClick(event) {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === "enter") {
    ui.profile = PROFILES.find((p) => p.id === id);
    ui.tab = "dia";
    ui.showNote = id === "santiago";
    sessionStorage.setItem("ld-profile", id);
    render();
    return;
  }
  if (action === "switch") {
    ui.profile = null;
    sessionStorage.removeItem("ld-profile");
    render();
    return;
  }
  if (action === "tab") {
    ui.tab = id;
    ui.subjectId = null;
    render();
    return;
  }
  if (action === "open-subject") {
    ui.subjectId = id;
    ui.filter = "Abiertas";
    render();
    return;
  }
  if (action === "close-subject") {
    ui.subjectId = null;
    render();
    return;
  }
  if (action === "filter") {
    ui.filter = id;
    render();
    return;
  }
  if (action === "toggle-editor") {
    if (!isIsrael()) return toast("Solo Israel puede editar el horario");
    ui.editorOpen = !ui.editorOpen;
    render();
    return;
  }
  if (action === "editor-day") {
    captureEditorDraft();
    ui.editorDay = Number(id);
    render();
    return;
  }
  if (action === "add-period") {
    if (!isIsrael()) return toast("Solo Israel puede editar el horario");
    captureEditorDraft();
    const key = String(ui.editorDay);
    state.schedule[key] = [...scheduleFor(ui.editorDay), { time: "12:40–13:00", subjectId: "esp" }];
    render();
    return;
  }
  if (action === "remove-period") {
    if (!isIsrael()) return toast("Solo Israel puede editar el horario");
    captureEditorDraft();
    const key = String(ui.editorDay);
    state.schedule[key] = scheduleFor(ui.editorDay).filter((_, i) => i !== Number(id));
    render();
    return;
  }
  if (action === "save-editor") {
    await saveEditorFromDom();
    return;
  }
  if (action === "new-task") {
    ui.showTaskForm = true;
    render();
    return;
  }
  if (action === "close-task") {
    ui.showTaskForm = false;
    render();
    return;
  }
  if (action === "close-note") {
    ui.showNote = false;
    render();
    return;
  }
  if (action === "close-love") {
    ui.showHelpLove = false;
    render();
    return;
  }
  if (action === "delete-task") {
    if (!confirm("¿Borrar esta tarea?")) return;
    state.assignments = state.assignments.filter((t) => String(t.id) !== String(id));
    await saveState("borró una tarea");
    toast("Tarea borrada");
    render();
    return;
  }
  if (action === "evidence") {
    ui.evidenceId = ui.evidenceId === Number(id) ? null : Number(id);
    render();
    return;
  }
  if (action === "pick-date") {
    ui.selectedDate = id;
    render();
    return;
  }
  if (action === "month") {
    ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + Number(id), 1);
    render();
    return;
  }
  if (action === "clear-messages") {
    if (!isIsrael() || !confirm("¿Vaciar el tablero familiar?")) return;
    state.messages = [];
    await saveState("limpió el tablero de mensajes");
    toast("Tablero vacío");
    render();
    return;
  }
  if (action === "help-status") {
    if (!isIsrael()) return;
    const item = (state.help || []).find((h) => String(h.id) === String(id));
    if (item) item.status = btn.dataset.status;
    await saveState(`actualizó una solicitud de ayuda`);
    toast("Solicitud actualizada");
    render();
  }
}

async function saveEditorFromDom() {
  if (!isIsrael()) return toast("Solo Israel puede editar el horario");
  captureEditorDraft();
  await saveState("actualizó el horario de Santiago");
  toast("Horario guardado");
  render();
}

async function onChange(event) {
  const el = event.target;
  if (el.dataset.action === "status") {
    const task = state.assignments.find((t) => String(t.id) === String(el.dataset.id));
    if (!task) return;
    task.status = el.value;
    if (el.value === "Necesito ayuda") ui.showHelpLove = true;
    await saveState(`movió una tarea a ${el.value}`);
    toast(`Movida a ${el.value}`);
    render();
  }
}

async function onSubmit(event) {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  const action = form.dataset.action;
  const data = Object.fromEntries(new FormData(form).entries());
  if (action === "save-teacher") {
    const s = state.subjects.find((x) => x.id === ui.subjectId);
    if (!s) return;
    if (s.extra && !isIsrael()) return toast("Solo Israel puede nombrar las extracurriculares");
    s.teacher = String(data.teacher || "").trim();
    if (s.extra && isIsrael() && "extraName" in data) s.name = String(data.extraName || "").trim();
    await saveState("actualizó una materia");
    toast("Materia guardada");
    render();
    return;
  }
  if (action === "create-task") {
    state.assignments.push({
      id: Date.now(),
      subject: data.subject,
      title: data.title,
      dueDate: data.dueDate,
      status: "Por hacer",
    });
    state.assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    ui.showTaskForm = false;
    await saveState("agregó una tarea");
    toast("Tarea guardada");
    render();
    return;
  }
  if (action === "save-attendance") {
    const existing = (state.attendance || []).find((a) => a.schoolDate === data.schoolDate);
    if (existing) {
      existing.state = data.state;
      existing.note = data.note || "";
    } else {
      state.attendance.push({
        id: Date.now(),
        schoolDate: data.schoolDate,
        state: data.state,
        note: data.note || "",
      });
    }
    ui.selectedDate = data.schoolDate;
    await saveState("registró asistencia");
    toast("Asistencia guardada");
    render();
    return;
  }
  if (action === "send-message") {
    state.messages.push({
      id: Date.now(),
      sender: data.sender,
      body: data.body,
      createdAt: new Date().toISOString(),
    });
    await saveState("envió un mensaje familiar");
    toast("Mensaje enviado");
    render();
    return;
  }
  if (action === "send-help") {
    state.help.push({
      id: Date.now(),
      subject: data.subject,
      details: data.details,
      status: "Abierta",
      createdAt: new Date().toISOString(),
    });
    ui.showHelpLove = ui.profile.id === "santiago";
    await saveState("pidió ayuda");
    toast("Solicitud enviada");
    render();
    return;
  }
  if (action === "add-evidence") {
    const file = form.querySelector('input[type="file"]')?.files?.[0];
    let url = String(data.link || "").trim();
    let kind = "link";
    let label = url;
    if (file) {
      url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      kind = "file";
      label = file.name;
    }
    if (!url) {
      toast("Agrega un archivo o un enlace");
      return;
    }
    state.evidence.push({
      id: Date.now(),
      assignmentId: Number(form.dataset.id),
      sharedBy: data.sharedBy,
      note: data.note || "",
      kind,
      label,
      url,
      createdAt: new Date().toISOString(),
    });
    await saveState("compartió evidencia");
    toast("Evidencia agregada");
    render();
  }
}

app.addEventListener("click", onClick);
app.addEventListener("change", onChange);
app.addEventListener("submit", onSubmit);

(async function boot() {
  try {
    await loadState();
    const saved = sessionStorage.getItem("ld-profile");
    if (saved) ui.profile = PROFILES.find((p) => p.id === saved) || null;
    ui.month = new Date();
    ui.selectedDate = isoDate();
    render();
  } catch (err) {
    app.innerHTML = `<div class="boot"><p>No pude abrir el acompañamiento. ¿Ya corriste Abrir.bat?</p><p>${esc(err.message)}</p></div>`;
  }
})();
