const CAMPOS = [
  "Lenguajes",
  "Saberes y pensamiento científico",
  "Ética, naturaleza y sociedades",
  "De lo humano y lo comunitario",
  "Extracurricular",
];

const PROFILES = [
  { id: "santiago", name: "Santiago", role: "Alumno · 6° de primaria", initial: "S", tone: "student" },
  { id: "perla", name: "Perla", role: "Mamá", initial: "P", tone: "parent" },
  { id: "israel", name: "Israel", role: "Mentor académico", initial: "I", tone: "mentor" },
];

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const TABS = [
  { id: "dia", label: "Mi día" },
  { id: "materias", label: "Materias" },
  { id: "calendario", label: "Calendario" },
  { id: "asistencia", label: "Asistencia" },
  { id: "avance", label: "Avance" },
  { id: "mensajes", label: "Mensajes" },
  { id: "escuela", label: "Escuela" },
];

const TASK_STATUS = [
  { id: "Por hacer", label: "Por hacer" },
  { id: "En curso", label: "En curso" },
  { id: "Necesito ayuda", label: "Necesito ayuda" },
  { id: "Hecha", label: "Hecha" },
];

const ATTENDANCE_STATES = [
  { id: "Presente", code: "P" },
  { id: "Retardo", code: "R" },
  { id: "Falta", code: "F" },
  { id: "Justificada", code: "J" },
];

const NOTES = [
  "Descansa hoy. Estoy orgulloso de ti. La semana que entra es otra oportunidad para brillar.",
  "Empieza con ganas, Santi. Dale lo mejor a la escuela: tú puedes con cosas grandes.",
  "Sigue con calma y con valor. Cada esfuerzo chiquito construye el futuro que quieres.",
  "Créete tanto como yo te creo. Pregunta, aprende algo nuevo y disfruta el día.",
  "Eres inteligente, fuerte y muy querido. Ponle corazón a la escuela hoy.",
  "Cierra la semana con buena actitud. Me enorgullece tu esfuerzo, no solo el resultado.",
  "Disfruta tu fin de semana, campeón. Descansa, juega y recarga para volver con todo.",
  "Tómate tiempo para recargar, Santi. Tus sueños valen el trabajo de cada semana.",
  "Lunes nuevo, arranque nuevo. Entra a la escuela con confianza: ya tienes lo que se necesita.",
  "No tiene que salir perfecto. Sé curioso, trabaja y siéntete orgulloso de cada paso.",
  "Mitad de semana. Mantente atento, sé amable y recuerda: lo difícil también te hace crecer.",
  "Hoy tu actitud es tu superpoder. Elige valor, elige esfuerzo y sigue creyendo en ti.",
  "Ya cerraste otra semana de escuela. Termina con propósito y celebra lo que aprendiste.",
  "Hasta los campeones descansan. Sonríe mucho y prepárate para otra semana de ser tu mejor versión.",
];

const SCHOOL_LINKS = [
  { mark: "SEP", title: "Calendario escolar SEP 2026–2027", copy: "Días de clase, puentes, CTE y vacaciones oficiales", href: "https://calendarioescolar.sep.gob.mx/" },
  { mark: "LTG", title: "Libros de texto gratuitos", copy: "Materiales CONALITEG para 6° de primaria", href: "https://libros.conaliteg.gob.mx/" },
  { mark: "NEM", title: "Nueva Escuela Mexicana", copy: "Plan de Estudio 2022, campos formativos y recursos", href: "https://nuevaescuelamexicana.sep.gob.mx/" },
  { mark: "GTO", title: "SEG Guanajuato", copy: "Secretaría de Educación de Guanajuato", href: "https://seg.guanajuato.gob.mx/" },
  { mark: "MX", title: "SEP nacional", copy: "Comunicados y servicios de la Secretaría de Educación Pública", href: "https://www.gob.mx/sep" },
];

const SEP_EVENTS = [
  { date: "2026-08-31", kind: "inicio", label: "Inicio de clases" },
  { date: "2026-09-07", kind: "jornada", label: "Jornada de concientización" },
  { date: "2026-09-16", kind: "suspension", label: "Suspensión · Independencia" },
  { date: "2026-09-25", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2026-10-30", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2026-11-02", kind: "suspension", label: "Suspensión · Día de Muertos" },
  { date: "2026-11-13", kind: "boleta", label: "Registro de calificaciones" },
  { date: "2026-11-16", kind: "suspension", label: "Suspensión · Revolución Mexicana" },
  { date: "2026-11-27", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2027-01-06", kind: "suspension", label: "Suspensión · Día de Reyes" },
  { date: "2027-01-07", kind: "regreso", label: "Regreso a clases" },
  { date: "2027-01-29", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2027-02-01", kind: "suspension", label: "Suspensión · Día de la Constitución" },
  { date: "2027-02-26", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2027-03-05", kind: "boleta", label: "Registro de calificaciones" },
  { date: "2027-03-15", kind: "suspension", label: "Suspensión · Natalicio de Benito Juárez" },
  { date: "2027-04-30", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2027-05-05", kind: "suspension", label: "Suspensión · Batalla de Puebla" },
  { date: "2027-05-28", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2027-06-25", kind: "cte", label: "Consejo Técnico Escolar" },
  { date: "2027-07-02", kind: "boleta", label: "Registro de calificaciones" },
  { date: "2027-07-09", kind: "fin", label: "Fin de clases" },
];

function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(iso) {
  return new Date(`${iso}T12:00:00`);
}

function inRange(iso, start, end) {
  return iso >= start && iso <= end;
}

function schoolStatus(iso) {
  const d = parseISO(iso);
  const day = d.getDay();
  const event = SEP_EVENTS.find((e) => e.date === iso);
  if (iso < "2026-08-31" || iso > "2027-07-09") {
    return { school: false, label: "Fuera del ciclo escolar", kind: "off" };
  }
  if (inRange(iso, "2026-12-21", "2027-01-05")) {
    return { school: false, label: "Vacaciones de invierno", kind: "break" };
  }
  if (inRange(iso, "2027-03-22", "2027-04-03")) {
    return { school: false, label: "Vacaciones de Semana Santa", kind: "break" };
  }
  if (day === 0 || day === 6) {
    return { school: false, label: "Fin de semana", kind: "weekend" };
  }
  if (event && (event.kind === "suspension" || event.kind === "cte")) {
    return { school: false, label: event.label, kind: event.kind };
  }
  if (event) return { school: true, label: event.label, kind: event.kind };
  return { school: true, label: "Día de clases", kind: "class" };
}

function formatLongDate(iso) {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatShortDate(iso) {
  const d = parseISO(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

function dailyNote(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const idx = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return NOTES[((idx % NOTES.length) + NOTES.length) % NOTES.length];
}

function subjectById(state, id) {
  if (id === "recreo") return { id: "recreo", name: "Recreo", short: "·", color: "#007880", campo: "Pausa" };
  return (state.subjects || []).find((s) => s.id === id) || { id, name: id, short: "?", color: "#5a6a7a" };
}

function subjectLabel(subject) {
  if (!subject) return "Sin asignar";
  if (subject.extra && !subject.name) return "Extracurricular sin asignar";
  return subject.name || "Sin asignar";
}
