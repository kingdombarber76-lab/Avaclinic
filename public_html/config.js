/* ══════════════════════════════════════════════════
     config.js — AVA Clinic Odontología
     ──────────────────────────────────────────────────
     Panel de control centralizado. Editá este archivo
     para actualizar precios, horarios, servicios y PIN
     sin tocar ninguna otra página.
  ══════════════════════════════════════════════════ */

  const CFG = {

    negocio: {

nombre:    'AVA Clinic Odontología',
subtitulo: 'Clínica Odontológica',
ciudad:    'Encarnación, Paraguay',
direccion: 'J5H6+HRX, Encarnación 070125',
telefono:  '+595 992 814554',
whatsapp:  '595992814554',
mapsUrl:   'https://www.google.com/maps/search/?api=1&query=J5H6%2BHRX+Encarnaci%C3%B3n',
    },

    // PIN de acceso a la agenda privada del barbero

    // Cambialo antes de publicar el sitio

    pin: '1111',

    // Duración mínima de cada bloque de agenda (minutos)

  bloqueMin: 60, // La consulta dura 1 hora

/* Horarios por día de la semana
0 = domingo … 6 = sábado
*/

horarios: {

  0: [],                         // Domingo: cerrado

  1: [['08:00', '18:00']],       // Lunes

  2: [['08:00', '18:00']],       // Martes

  3: [['08:00', '18:00']],       // Miércoles

  4: [['08:00', '18:00']],       // Jueves

  5: [['08:00', '18:00']],       // Viernes

  6: [['09:00', '17:30']],       // Sábado
},

/* Servicios */

servicios: [

  {

    id: 'consulta',

    nombre: 'Consulta Odontológica',

    desc: 'Consulta y evaluación odontológica.',

    precio: 0,

    precioOld: null,

    dur: 60,

    destacado: true,

  },

],

  /* ══════════════════════════════════════════════════

     UTILIDADES COMPARTIDAS

  ══════════════════════════════════════════════════ */

  const DIAS   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  const DIAS_C = ['dom','lun','mar','mié','jue','vie','sáb'];

  const MESES  =
  ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  const fmtGs     = n  => 'Gs. ' + Number(n).toLocaleString('es-PY');

 const isoDate    = d  => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };

  const hoyIso    = () => isoDate(new Date());

  const fromIso   = iso => new Date(iso + 'T00:00:00');

  const hm2min    = hm => { const [h,m]=hm.split(':').map(Number); return h*60+m; };

  const min2hm     = m  => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

  const capitalize= s  => s.charAt(0).toUpperCase() + s.slice(1);

  const uid       = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

  const getSvc    = id => CFG.servicios.find(s => s.id === id) || CFG.servicios[0];

  const dateLabel  = iso => { const d=fromIso(iso); return `${capitalize(DIAS[d.getDay()])} ${d.getDate()} de${MESES[d.getMonth()]}`; };

  const dateShort  = iso => { const d=fromIso(iso); return `${DIAS_C[d.getDay()]}${d.getDate()}`; };

  const API_BASE = 'https://avaclinic-amze7.sevalla.app/api';

  const DEFAULT_BARBER_ID = 1;

  const SERVICE_ID_MAP = {consulta: 1};

  const jsonHeaders = { 'Content-Type': 'application/json' };

  const apiFetch = async (path, options = {}) => {

    const res = await fetch(path, {

  credentials: 'same-origin',

  ...options,

  headers: { ...(options.headers || {}), ...jsonHeaders },
    });

    const text = await res.text();

    let body = null;

    try {

  body = text ? JSON.parse(text) : null;
    } catch {

  body = text;
    }

    if (!res.ok) {

  const error = new Error(`${res.status}${res.statusText}`);

  error.status = res.status;

  error.body = body;

  throw error;
    }

    return body;

  };

  const apiStatusFromLocal = est => {

    return {

  pendiente: 'pending',

  confirmado: 'confirmed',

  atendido: 'attended',

  cancelado: 'cancelled',
    }[est] ?? 'pending';

  };

  const localStatusFromApi = est => {

    return {

  pending: 'pendiente',

  confirmed: 'confirmado',

  attended: 'atendido',

  cancelled: 'cancelado',

  no_show: 'cancelado',
    }[est] ?? 'pendiente';

  };

  const normalizeAppointment = api => {

    const dur = api.service?.duration_minutes ?? api.duration_minutes ?? 60;

    return {

  id: api.uuid ?? api.id ?? uid(),

  svcId: api.service_id ?? api.service?.id ?? CFG.servicios[0].id,

  nombre: api.client_name ?? '',

  tel: api.client_phone ?? '',

  nota: api.notes ?? '',

  fecha: api.appointment_date ?? '',

  hora: (api.start_time ?? '').slice(0, 5),

  dur,

  estado: localStatusFromApi(api.status ?? 'pending'),

  creadoEn: api.created_at ?? api.creadoEn ?? new Date().toISOString(),
    };

  };

  const mapToApiAppointment = turno => ({

    service_id: SERVICE_ID_MAP[turno.svcId] || 1, // Map our string id to the API's numeric id

    barber_id: DEFAULT_BARBER_ID,

    date: turno.fecha,

    time: turno.hora,

    client_name: turno.nombre,

    client_phone: turno.tel,

    notes: turno.nota,

    status: apiStatusFromLocal(turno.estado ?? 'pendiente'),

  });

  const loadServices = async () => {
  try {
    const response = await apiFetch(`${API_BASE}/services`);
      const services = Array.isArray(response) ? response : (response?.data ?? []);
      if (services.length) {
        CFG.servicios = services.map(s => ({
          id: s.id,
          nombre: s.name,
          desc: s.description ?? '',
          precio: Number(s.price),
          precioOld: s.price_old ?? null,
          dur: s.duration_minutes,
          destacado: s.is_featured ?? false,
        }));
      }
    } catch (error) {
      console.warn('No se pudieron cargar servicios remotos, usando servicios locales.', error);
    }
  };

const createRemoteTurno = async turno => {
  const data = await apiFetch(`${API_BASE}/appointments`, {
    method: 'POST',
    body: JSON.stringify(mapToApiAppointment(turno)),
  });
  return normalizeAppointment(data.appointment ?? data);
};

const updateRemoteAppointmentStatus = async (id, status) => {
  await apiFetch(`${API_BASE}/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

const deleteRemoteAppointment = async id => {
  const res = await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
};

  const saveRemoteTurno = remote => {

    const ts = getTurnos();

    const idx = ts.findIndex(t => t.id === remote.id);

    if (idx >= 0) ts[idx] = remote;

    else ts.push(remote);

    saveTurnos(ts);

  };

  const replaceTurnoId = (oldId, remote) => {

    const ts = getTurnos();

    const idx = ts.findIndex(t => t.id === oldId);

    if (idx >= 0) ts[idx] = remote;

    else ts.push(remote);

    saveTurnos(ts);

    return remote;

  };

 const fetchRemoteTurnos = async () => {
  const response = await apiFetch(`${API_BASE}/appointments`);
  const items = Array.isArray(response) ? response : (response?.data ?? []);
  return items.map(normalizeAppointment);
};

  const syncRemoteTurnos = async () => {

    try {

  const remote = await fetchRemoteTurnos();

  const local = getTurnos();

  const merged = [...remote];

  local.forEach(item => {

    if (item.id?.startsWith('t') && !merged.some(r => r.id === item.id)) {

      merged.push(item);

    }

  });

  saveTurnos(merged);

  return merged;
    } catch (error) {

  console.warn('No se pudo sincronizar con el servidor de turnos:', error);

  return getTurnos();
    }

  };

  const scheduleTurnoSync = () => {

    const trySync = async () => {

  try {

    await syncRemoteTurnos();

    if (typeof renderAgenda === 'function') renderAgenda();

  } catch (e) {

    console.warn('Error sincronizando turnos en segundo plano:', e);

  }
    };

    window.addEventListener('focus', trySync);

    setInterval(trySync, 30000);

  };

  if (typeof window !== 'undefined') {

    window.addEventListener('load', scheduleTurnoSync);

  }

  /* ═══════════════════════════════════════════════════

     ALMACENAMIENTO (localStorage)

     ──────────────────────────────────────────────────

     Los turnos se guardan en el navegador. Mientras

     ambas páginas (index.html y agenda.html) estén en

     el mismo dominio/origen, comparten los datos.

  ═══════════════════════════════════════════════════ */

  const STORE_KEY = 'kbs_turnos_v1';

  const getTurnos  = ()    => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch(e) { return
  []; } };

  const saveTurnos = ts    => localStorage.setItem(STORE_KEY, JSON.stringify(ts));

  const addTurno   = t     => { const ts=getTurnos(); ts.push(t); saveTurnos(ts); };

const updateTurno= async (id,ch)=> {
  const ts = getTurnos();
  const i = ts.findIndex(t => t.id === id);
  if (i < 0) return;
  ts[i] = { ...ts[i], ...ch };
  saveTurnos(ts);
  if (id && !id.startsWith('t') && ch.estado) {
    updateRemoteAppointmentStatus(id, apiStatusFromLocal(ch.estado)).catch(error => {
      console.warn('No se pudo actualizar el turno remoto:', error);
    });
  }
};

  const deleteTurno= async id => {

    saveTurnos(getTurnos().filter(t => t.id !== id));

    if (id && !id.startsWith('t')) {

  deleteRemoteAppointment(id).catch(error => {

    console.warn('No se pudo eliminar el turno remoto:', error);

  });
    }

  };

  /* ═══════════════════════════════════════════════════

     LÓGICA DE DISPONIBILIDAD

  ═══════════════════════════════════════════════════ */

  function rangosDelDia(iso) {

    return CFG.horarios[fromIso(iso).getDay()] || [];

  }

  function bloquesDelDia(iso) {

    const out = [];

    rangosDelDia(iso).forEach(([a,b]) => {

  let cur = hm2min(a);

  while (cur < hm2min(b)) { out.push(cur); cur += CFG.bloqueMin; }
    });

    return out;

  }

  function ocupadosDelDia(iso, excId) {

    return getTurnos()

  .filter(t => t.fecha === iso && t.estado !== 'cancelado' && t.id !== excId)

  .map(t => ({ ini: hm2min(t.hora), fin: hm2min(t.hora) + t.dur }));
  }

  function slotDisponible(iso, iniMin, dur, excId) {

    const fin = iniMin + dur;

    const cabe = rangosDelDia(iso).some(([a,b]) => iniMin >= hm2min(a) && fin <= hm2min(b));

    if (!cabe) return false;

    return !ocupadosDelDia(iso, excId).some(o => iniMin < o.fin && fin > o.ini);

  }

  async function horasDisponibles(iso, dur) {

  const servicio = CFG.servicios.find(s => s.dur == dur);

  if(!servicio) return [];

  try{

const data = await apiFetch(
  `${API_BASE}/appointments/available?tenant_id=1&barber_id=1&service_id=${servicio.id}&date=${iso}`
);

      return (data.slots || []).map(s => s.start);

  }catch(e){

      console.error(e);

      return [];

  }
  }

  /* Estado abierto / cerrado en este momento */

  function estadoSalon() {

    const ahora = new Date();

    const dow   = ahora.getDay();

    const min   = ahora.getHours() * 60 + ahora.getMinutes();

    const rangos = CFG.horarios[dow] || [];

    if (!rangos.length) return { open: false, txt: 'Cerrado hoy' };

    for (const [a,b] of rangos) {

  if (min >= hm2min(a) && min < hm2min(b))

    return { open: true, txt: `Abierto · cierra a las ${b}` };
    }

    const prox = rangos.find(([a]) => hm2min(a) > min);

if (prox) return { open: false, txt: `Cerrado · abre a las ${prox[0]}` };

    return { open: false, txt: 'Cerrado por hoy' };

  }
