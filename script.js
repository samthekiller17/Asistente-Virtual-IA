/* ==========================================================================
   NOVA · Asistente virtual de videojuegos (maqueta navegable)
 
   Todo el contenido es de demostración: no hay backend ni IA real.
 
   Estructura del archivo:
     1. Utilidades
     2. Datos (juegos, categorías, historial, guías...)
     3. Estado
     4. Piezas de HTML reutilizables
     5. Vistas (una función por pantalla)
     6. Efectos que ocurren después de dibujar una vista
     7. Navegación y dibujado
     8. Chat
     9. Acciones (clics) y eventos
     10. Arranque
 
   Para agregar una pantalla nueva:
     a) crea una función viewMiVista() que devuelva el HTML,
     b) regístrala en VIEWS,
     c) navega a ella con go("miVista").
   ========================================================================== */
"use strict";
 
/* ==========================================================================
   1. UTILIDADES
   ========================================================================== */
 
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
 
const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
 
/**
 * Convierte texto en texto seguro para insertarlo con innerHTML.
 * Regla del proyecto: los datos de este archivo son de confianza, pero
 * TODO lo que escribe el usuario debe pasar por esta función.
 */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
 
/** Quita mayúsculas y tildes para comparar textos ("Acción" coincide con "accion"). */
function normalizeText(text) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
 
/** Genera HTML recorriendo una lista con un bucle explícito. */
function renderEach(items, renderItem) {
  let html = "";
  for (let index = 0; index < items.length; index++) {
    html += renderItem(items[index], index);
  }
  return html;
}
 
/*
 * Temporizadores de la vista actual.
 * Cada vez que se dibuja una pantalla se cancelan los pendientes, así una
 * animación de una pantalla anterior nunca modifica la pantalla nueva.
 */
let pendingTimers = [];
 
function schedule(callback, delayMs) {
  pendingTimers.push(setTimeout(callback, delayMs));
}
 
function cancelScheduled() {
  for (const timerId of pendingTimers) {
    clearTimeout(timerId);
  }
  pendingTimers = [];
}
 
/* ==========================================================================
   2. DATOS (todo de demostración)
   ========================================================================== */
 
/* Cada juego tiene un id de texto: así HISTORY, GUIDES y RECOMMENDATIONS lo
   referencian por nombre en lugar de usar números de posición. */
const GAMES = [
  {
    id: "minecraft",
    name: "Minecraft",
    genre: "Sandbox",
    platforms: "PC · Consola · Móvil",
    colorFrom: "#3f9b3f",
    colorTo: "#8b5a2b",
    initials: "MC",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    genre: "Battle Royale",
    platforms: "Multiplataforma",
    colorFrom: "#7c5cff",
    colorTo: "#22d3ee",
    initials: "FN",
  },
  {
    id: "gta-v",
    name: "Grand Theft Auto V",
    genre: "Acción · Mundo abierto",
    platforms: "PC · Consola",
    colorFrom: "#f59e0b",
    colorTo: "#b91c1c",
    initials: "GTA",
  },
  {
    id: "valorant",
    name: "Valorant",
    genre: "Shooter táctico",
    platforms: "PC",
    colorFrom: "#ef4444",
    colorTo: "#7f1d1d",
    initials: "VAL",
  },
  {
    id: "lol",
    name: "League of Legends",
    genre: "MOBA",
    platforms: "PC",
    colorFrom: "#0ea5e9",
    colorTo: "#1e3a8a",
    initials: "LoL",
  },
  {
    id: "elden-ring",
    name: "Elden Ring",
    genre: "RPG de acción",
    platforms: "PC · Consola",
    colorFrom: "#d4a017",
    colorTo: "#3b2a0a",
    initials: "ER",
  },
  {
    id: "resident-evil",
    name: "Resident Evil",
    genre: "Survival horror",
    platforms: "PC · Consola",
    colorFrom: "#991b1b",
    colorTo: "#111",
    initials: "RE",
  },
  {
    id: "cod",
    name: "Call of Duty",
    genre: "Shooter",
    platforms: "PC · Consola",
    colorFrom: "#64748b",
    colorTo: "#0f172a",
    initials: "CoD",
  },
  {
    id: "witcher-3",
    name: "The Witcher 3",
    genre: "RPG · Mundo abierto",
    platforms: "PC · Consola",
    colorFrom: "#94a3b8",
    colorTo: "#475569",
    initials: "W3",
  },
  {
    id: "hollow-knight",
    name: "Hollow Knight",
    genre: "Metroidvania",
    platforms: "PC · Switch",
    colorFrom: "#6366f1",
    colorTo: "#0b0b2a",
    initials: "HK",
  },
];
 
/* Tarjetas de la pantalla de inicio.
   - view: pantalla a la que lleva la tarjeta.
   - category (opcional): categoría que se resalta al elegir el juego. */
const FEATURES = [
  {
    icon: "🎮",
    title: "Necesito ayuda con un videojuego",
    subtitle: "Elige tu juego y cuéntame qué pasa",
    view: "games",
  },
  {
    icon: "🗺️",
    title: "Quiero superar una misión",
    subtitle: "Te guío por niveles y capítulos",
    view: "games",
    category: "mission",
  },
  {
    icon: "⚔️",
    title: "Busco estrategias y consejos",
    subtitle: "Mejora tu rendimiento",
    view: "games",
    category: "strategy",
  },
  {
    icon: "✨",
    title: "Recomiéndame un videojuego",
    subtitle: "Encuentra tu próxima aventura",
    view: "rec",
  },
  {
    icon: "🛠️",
    title: "Tengo un problema técnico",
    subtitle: "Errores, lag y rendimiento",
    view: "games",
    category: "tech",
  },
  {
    icon: "🔍",
    title: "Quiero descubrir secretos y trucos",
    subtitle: "Coleccionables y easter eggs",
    view: "games",
    category: "secrets",
  },
];
 
/* Todo lo que depende del tipo de ayuda vive junto, en un solo lugar:
   - title / subtitle: tarjeta de la pantalla "needs".
   - formTitle / fields: formulario de la pantalla "form".
   - answer: respuesta de demostración (resumen, pasos y consejo).
   - warning: aviso opcional (null si no hay). */
const CATEGORIES = {
  mission: {
    icon: "🗺️",
    title: "Misiones y niveles",
    subtitle: "Avanza cuando estés atascado",
    formTitle: "¿En qué parte del juego te encuentras?",
    fields: [
      { label: "Nombre de la misión", type: "text" },
      { label: "Nivel o capítulo", type: "text" },
      { label: "Descripción del problema", type: "textarea" },
      { label: "¿Qué has intentado hasta ahora?", type: "textarea" },
    ],
    answer: {
      summary: "Parece que te falta un objeto o paso previo.",
      steps: [
        "Vuelve a la última zona segura y revisa tu mapa.",
        "Habla de nuevo con los personajes clave: suelen dar pistas nuevas.",
        "Busca puntos de interés marcados que aún no visitaste.",
        "Guarda la partida antes de intentarlo otra vez.",
      ],
      tip: "Prueba otro enfoque: sigilo en lugar de combate directo.",
    },
    warning: "Cuidado: si avanzas sin guardar podrías perder el objeto clave.",
  },
  strategy: {
    icon: "⚔️",
    title: "Estrategias y consejos",
    subtitle: "Tácticas para ganar más",
    formTitle: "Cuéntame cómo juegas",
    fields: [
      {
        label: "Modo de juego",
        type: "select",
        options: ["Individual", "Competitivo", "Cooperativo"],
      },
      {
        label: "Tu objetivo",
        type: "select",
        options: ["Subir de rango", "Ganar más partidas", "Progresar más rápido"],
      },
      { label: "Tu situación actual", type: "textarea" },
    ],
    answer: {
      summary: "Tu rendimiento mejora con pequeños ajustes de hábito.",
      steps: [
        "Define un objetivo por partida.",
        "Revisa tus repeticiones y detecta un error recurrente.",
        "Domina un solo rol antes de cambiar.",
        "Practica 10 minutos de entrenamiento antes de jugar.",
      ],
      tip: "La constancia vale más que partidas largas.",
    },
    warning: null,
  },
  chars: {
    icon: "🧙",
    title: "Personajes y habilidades",
    subtitle: "Builds, clases y poderes",
    formTitle: "¿Sobre qué personaje quieres saber?",
    fields: [
      { label: "Personaje o clase", type: "text" },
      {
        label: "¿Qué quieres saber?",
        type: "select",
        options: ["Habilidades", "Mejor build", "Cómo desbloquearlo"],
      },
    ],
    answer: {
      summary: "Este personaje destaca si combinas bien sus habilidades.",
      steps: [
        "Prioriza la habilidad principal en los primeros niveles.",
        "Elige un equipamiento que refuerce tu estilo.",
        "Combina pasivas con tu habilidad definitiva.",
        "Prueba la build en una zona fácil.",
      ],
      tip: "Reparte puntos con calma: algunos no se pueden reasignar.",
    },
    warning: null,
  },
  weapons: {
    icon: "🗡️",
    title: "Armas y equipamiento",
    subtitle: "Dónde conseguirlas y mejorarlas",
    formTitle: "¿Qué arma o equipo te interesa?",
    fields: [
      { label: "Arma u objeto", type: "text" },
      {
        label: "¿Qué buscas?",
        type: "select",
        options: ["Dónde conseguirlo", "Cómo mejorarlo", "Comparativa"],
      },
      { label: "Tu nivel actual", type: "text" },
    ],
    answer: {
      summary: "Hay una opción mejor según tu nivel actual.",
      steps: [
        "Revisa el mapa de tiendas y cofres.",
        "Cumple la misión secundaria asociada.",
        "Mejora el arma con materiales raros.",
        "Compara daño y alcance antes de equiparla.",
      ],
      tip: "No gastes recursos raros en armas temporales.",
    },
    warning: "Advertencia: mejorar sin materiales suficientes puede ser irreversible.",
  },
  secrets: {
    icon: "💎",
    title: "Secretos y coleccionables",
    subtitle: "Lo que casi nadie encuentra",
    formTitle: "¿Dónde quieres buscar secretos?",
    fields: [
      { label: "Zona o mapa", type: "text" },
      {
        label: "Tipo de secreto",
        type: "select",
        options: ["Coleccionables", "Logros", "Easter eggs"],
      },
    ],
    answer: {
      summary: "Hay más secretos de los que parece en esa zona.",
      steps: [
        "Explora los bordes del mapa.",
        "Fíjate en sonidos y luces distintas.",
        "Interactúa con objetos fuera de lugar.",
        "Anota lo que encuentres.",
      ],
      tip: "Algunos secretos solo aparecen a ciertas horas.",
    },
    warning: null,
  },
  bosses: {
    icon: "👹",
    title: "Jefes y enemigos",
    subtitle: "Patrones y puntos débiles",
    formTitle: "¿Contra quién estás luchando?",
    fields: [
      { label: "Jefe o enemigo", type: "text" },
      {
        label: "¿Qué te cuesta más?",
        type: "select",
        options: ["Sus ataques", "Mi equipamiento", "Mi estrategia"],
      },
      { label: "Intentos hasta ahora", type: "text" },
    ],
    answer: {
      summary: "Ese jefe tiene un patrón que puedes aprender.",
      steps: [
        "Observa sus tres primeros ataques sin atacar.",
        "Esquiva hacia el lado, no hacia atrás.",
        "Ataca solo tras su movimiento más lento.",
        "Cura antes de la fase dos.",
      ],
      tip: "Reduce su resistencia con el equipamiento adecuado.",
    },
    warning: "Cuidado: la fase dos aumenta mucho el daño.",
  },
  tech: {
    icon: "🛠️",
    title: "Problemas técnicos",
    subtitle: "Errores, FPS y conexión",
    formTitle: "Vamos a diagnosticar el problema",
    fields: [
      {
        label: "¿En qué plataforma juegas?",
        type: "select",
        options: ["PC", "PlayStation", "Xbox", "Switch", "Móvil"],
      },
      {
        label: "¿Qué problema experimentas?",
        type: "select",
        options: ["Bajo rendimiento", "Se cierra solo", "No carga", "Lag en línea"],
      },
      { label: "¿Aparece algún mensaje de error?", type: "text" },
    ],
    answer: {
      summary: "Esto suele resolverse con ajustes simples.",
      steps: [
        "Actualiza los controladores y el juego.",
        "Baja la calidad gráfica y desactiva efectos pesados.",
        "Verifica la integridad de los archivos.",
        "Reinicia el router si el problema es de conexión.",
      ],
      tip: "Cierra programas en segundo plano.",
    },
    warning: "Antes de reinstalar, respalda tus partidas guardadas.",
  },
  info: {
    icon: "📖",
    title: "Información general",
    subtitle: "Aprende lo básico del juego",
    formTitle: "¿Qué te gustaría saber?",
    fields: [
      { label: "¿Qué quieres saber?", type: "textarea" },
      {
        label: "Tu experiencia con el juego",
        type: "select",
        options: ["Nuevo", "Intermedio", "Veterano"],
      },
    ],
    answer: {
      summary: "Te cuento lo esencial para empezar con buen pie.",
      steps: [
        "Completa el tutorial inicial.",
        "Aprende los controles básicos.",
        "Sigue la historia principal primero.",
        "Explora por tu cuenta cuando te sientas listo.",
      ],
      tip: "Juega a tu ritmo, no hay prisa.",
    },
    warning: null,
  },
};
 
/* Object.keys conserva el orden en que se escribieron las categorías. */
const CATEGORY_IDS = Object.keys(CATEGORIES);
 
/* Tipos de ayuda que se ofrecen solo en el formulario de misiones. */
const HELP_MODES = ["Una pista", "Guía completa", "Paso a paso"];
 
const HISTORY = [
  {
    title: "Atascado en el castillo",
    gameId: "elden-ring",
    when: "Hoy",
    lastInteraction: "Pedí una guía paso a paso",
    category: "mission",
  },
  {
    title: "Build para mago",
    gameId: "elden-ring",
    when: "Ayer",
    lastInteraction: "Comparé dos builds",
    category: "chars",
  },
  {
    title: "Lag en partidas online",
    gameId: "valorant",
    when: "Hace 3 días",
    lastInteraction: "Ajusté gráficos",
    category: "tech",
  },
  {
    title: "Jefe final del DLC",
    gameId: "witcher-3",
    when: "Hace 1 semana",
    lastInteraction: "Estrategia para fase 2",
    category: "bosses",
  },
];
 
const GUIDE_FILTERS = [
  "Todo",
  "Guías",
  "Consejos",
  "Estrategias",
  "Tutoriales",
  "Builds",
  "Trucos",
  "Secretos",
];
 
const GUIDES = [
  {
    type: "Guías",
    title: "Guía completa del primer mundo",
    gameId: "minecraft",
    category: "info",
  },
  { type: "Builds", title: "Build de mago de hielo", gameId: "elden-ring", category: "chars" },
  { type: "Trucos", title: "5 trucos de movimiento", gameId: "fortnite", category: "strategy" },
  {
    type: "Secretos",
    title: "Todos los coleccionables del mapa",
    gameId: "hollow-knight",
    category: "secrets",
  },
  {
    type: "Estrategias",
    title: "Control de mapa y economía",
    gameId: "lol",
    category: "strategy",
  },
  {
    type: "Tutoriales",
    title: "Primeros pasos para novatos",
    gameId: "valorant",
    category: "info",
  },
];
 
const PREFERENCE_GROUPS = [
  { label: "Género favorito", options: ["Acción", "RPG", "Aventura", "Estrategia", "Terror"] },
  {
    label: "Tipo de experiencia",
    options: ["Relajada", "Competitiva", "Narrativa", "Desafiante"],
  },
  { label: "Modo", options: ["Individual", "Multijugador"] },
  { label: "Dificultad", options: ["Fácil", "Media", "Difícil"] },
  { label: "Plataforma", options: ["PC", "Consola", "Móvil"] },
];
 
const RECOMMENDATIONS = [
  {
    gameId: "elden-ring",
    reason: "Elige RPG y dificultad alta",
    detail: "Mundo enorme y combates exigentes",
  },
  {
    gameId: "witcher-3",
    reason: "Te gustan las historias",
    detail: "Narrativa profunda y decisiones",
  },
  {
    gameId: "hollow-knight",
    reason: "Prefieres explorar",
    detail: "Atmósfera única, precio accesible",
  },
];
 
/* Menú lateral. "favorites" solo importa para la pantalla "lib":
   la misma vista sirve para "Mis videojuegos" y para "Favoritos". */
const NAV_ITEMS = [
  { icon: "🏠", label: "Inicio", view: "welcome", favorites: false },
  { icon: "🎮", label: "Mis videojuegos", view: "lib", favorites: false },
  { icon: "🕘", label: "Historial", view: "hist", favorites: false },
  { icon: "🧭", label: "Explorar videojuegos", view: "games", favorites: false },
  { icon: "⭐", label: "Favoritos", view: "lib", favorites: true },
  { icon: "✨", label: "Recomendador", view: "rec", favorites: false },
  { icon: "📚", label: "Guías", view: "guides", favorites: false },
  { icon: "⚙️", label: "Configuración", view: "settings", favorites: false },
];
 
const SETTINGS_LABELS = ["Sonidos del asistente", "Animaciones", "Modo compacto"];
 
/* Textos y tiempos de la maqueta */
const DEFAULT_GAME_ID = GAMES[0].id;
const DEFAULT_CATEGORY_ID = "mission";
const DEFAULT_USER_MESSAGE = "Estoy atascado y no encuentro cómo continuar.";
const MORE_DETAILS_REPLY =
  "Aquí tienes otra perspectiva: prueba cambiar el orden de los pasos y revisa si te falta un requisito previo. <small>Respuesta de demostración.</small>";
const FOLLOW_UP_REPLY =
  "Entendido, lo tengo en cuenta. <small>Respuesta de demostración: aquí NOVA respondería con IA real.</small>";
const THINKING_STEPS = [
  "Analizando tu situación",
  "Identificando posibles soluciones",
  "Preparando recomendaciones",
];
const PARTICLE_POSITIONS = [20, 45, 70, 30, 60];
const THINKING_STEP_MS = 1000; // cada paso se activa 1 s después del anterior
const THINKING_TOTAL_MS = 3300; // al terminar se muestra la respuesta
const ANSWER_DELAY_MS = 1400; // tiempo del indicador "escribiendo..."
const FOLLOW_UP_DELAY_MS = 900;
const FAVORITES_COUNT = 3;
const LIBRARY_COUNT = 6;
 
/* ==========================================================================
   3. ESTADO
   ========================================================================== */
 
const state = {
  view: "welcome",
  history: [], // pantallas anteriores, para el botón "Atrás"
  gameId: null, // juego elegido
  categoryId: null, // tipo de ayuda elegido
  highlightedCategoryId: null, // categoría sugerida desde la pantalla de inicio
  userMessage: "", // lo que escribió el usuario (texto plano, sin escapar)
  guideFilter: "Todo",
  showFavorites: false, // la vista "lib" muestra favoritos o toda la biblioteca
  lastAnswerText: "", // texto plano de la última respuesta (para copiar/compartir)
};
 
function getGame(gameId) {
  return GAMES.find((game) => game.id === gameId) || null;
}
 
/** Juego actual; si el usuario aún no eligió ninguno, usa el de por defecto. */
function currentGame() {
  return getGame(state.gameId) || getGame(DEFAULT_GAME_ID);
}
 
/** Categoría actual; si no hay una válida, usa la de por defecto. */
function currentCategoryId() {
  return CATEGORIES[state.categoryId] ? state.categoryId : DEFAULT_CATEGORY_ID;
}
 
/** Completa juego y categoría antes de entrar a una conversación. */
function ensureConversationDefaults() {
  state.gameId = currentGame().id;
  state.categoryId = currentCategoryId();
}
 
/* ==========================================================================
   4. PIEZAS DE HTML REUTILIZABLES
   ========================================================================== */
 
function coverHtml(game) {
  const gradient = `linear-gradient(135deg,${game.colorFrom},${game.colorTo})`;
  return `<div class="cover" style="background:${gradient}">${game.initials}</div>`;
}
 
function tagsHtml(labels) {
  return renderEach(labels, (label) => `<span class="tag">${escapeHtml(label)}</span>`);
}
 
/** Botones tipo "chip". Solo el que coincide con activeOption queda marcado. */
function chipsHtml(options, activeOption, action = "select-chip") {
  return renderEach(options, (option) => {
    const isActive = option === activeOption;
    return `<button type="button" class="chip${isActive ? " on" : ""}" data-action="${action}" data-chip="${option}" aria-pressed="${isActive}">${option}</button>`;
  });
}
 
/** Etiqueta con el juego elegido (vacía si todavía no se eligió ninguno). */
function pickedGameHtml() {
  const game = getGame(state.gameId);
  if (!game) {
    return "";
  }
  return `<div class="pick">${coverHtml(game)}<span><b>${game.name}</b><small>${game.genre}</small></span></div>`;
}
 
function gameCardHtml(game, buttonLabel) {
  return `<button type="button" class="card" data-action="select-game" data-game-id="${game.id}">
    ${coverHtml(game)}
    <b>${game.name}</b>
    <small>${game.genre} · ${game.platforms}</small>
    <span class="tag" style="width:fit-content">${buttonLabel}</span>
  </button>`;
}
 
/** Lista de juegos filtrada por el texto de búsqueda (vacío = todos). */
function gameListHtml(query) {
  const needle = normalizeText(query.trim());
  let html = "";
  for (const game of GAMES) {
    if (normalizeText(game.name).includes(needle)) {
      html += gameCardHtml(game, "Seleccionar");
    }
  }
  return html || `<p class="sub empty-state">Sin resultados. Prueba con otro nombre.</p>`;
}
 
function fieldHtml(field) {
  let control;
  if (field.type === "textarea") {
    control = `<textarea rows="3"></textarea>`;
  } else if (field.type === "select") {
    control = `<select>${renderEach(field.options, (option) => `<option>${option}</option>`)}</select>`;
  } else {
    control = `<input type="text" autocomplete="off">`;
  }
  return `<label><span class="field-label">${field.label}</span>${control}</label>`;
}
 
/* ==========================================================================
   5. VISTAS (cada una devuelve el HTML de una pantalla)
   ========================================================================== */
 
function viewWelcome() {
  const cards = renderEach(
    FEATURES,
    (feature, index) => `
      <button type="button" class="card" data-action="select-feature" data-index="${index}">
        <span class="i">${feature.icon}</span>
        <b>${feature.title}</b>
        <small>${feature.subtitle}</small>
      </button>`,
  );
  return `
    <div class="view">
      <div class="hero">
        <span class="orb lg"></span>
        <h1>¡Hola, jugador! 🎮</h1>
        <p class="sub">Soy NOVA, tu compañero de aventuras. Estoy aquí para ayudarte a superar desafíos, descubrir secretos y mejorar tu experiencia de juego. Elige una opción o escríbeme abajo.</p>
      </div>
      <div class="grid">${cards}</div>
    </div>`;
}
 
function viewGames() {
  return `
    <div class="view">
      <h2>¿Con qué videojuego necesitas ayuda?</h2>
      <p class="sub">Busca o elige uno de los juegos populares.</p>
      <input id="q" type="text" placeholder="Buscar videojuego…" aria-label="Buscar videojuego" autocomplete="off">
      <div class="grid" id="gl" style="margin-top:16px">${gameListHtml("")}</div>
    </div>`;
}
 
function viewNeeds() {
  const cards = renderEach(CATEGORY_IDS, (categoryId) => {
    const category = CATEGORIES[categoryId];
    const isSuggested = state.highlightedCategoryId === categoryId;
    return `
      <button type="button" class="card${isSuggested ? " on" : ""}" data-action="select-category" data-category-id="${categoryId}">
        <span class="i">${category.icon}</span>
        <b>${category.title}</b>
        <small>${category.subtitle}</small>
      </button>`;
  });
  return `
    <div class="view">
      ${pickedGameHtml()}
      <h2>¡Excelente elección! ¿En qué puedo ayudarte con este juego?</h2>
      <p class="sub">Elige una categoría.</p>
      <div class="grid">${cards}</div>
    </div>`;
}
 
function viewForm() {
  const categoryId = currentCategoryId();
  const category = CATEGORIES[categoryId];
  const fields = renderEach(category.fields, fieldHtml);
  const helpModes =
    categoryId === "mission"
      ? `<div>
           <small>¿Qué tipo de ayuda quieres?</small>
           <div class="row" id="modes" role="group" aria-label="Tipo de ayuda">${chipsHtml(HELP_MODES, HELP_MODES[0])}</div>
         </div>`
      : "";
  return `
    <div class="view">
      ${pickedGameHtml()}
      <h2>${category.formTitle}</h2>
      <p class="sub">Mientras más detalles me des, mejor será mi ayuda.</p>
      <form class="form" id="help-form">
        ${fields}
        ${helpModes}
        <div><button type="submit" class="btn">Pedir ayuda a NOVA</button></div>
      </form>
    </div>`;
}
 
function viewThinking() {
  const particles = renderEach(
    PARTICLE_POSITIONS,
    (position, index) =>
      `<i class="part" style="left:${30 + position / 2}%;top:150px;animation-delay:${index * 0.5}s"></i>`,
  );
  const steps = renderEach(
    THINKING_STEPS,
    (text) => `<div class="stp"><span class="stp-icon" aria-hidden="true">⏳</span> ${text}</div>`,
  );
  return `
    <div class="view think">
      <div class="ring"></div>
      ${particles}
      <span class="orb lg"></span>
      <h2>Estoy preparando una solución para ti…</h2>
      <div class="bar" role="progressbar" aria-label="Progreso del análisis" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
      <div class="steps">${steps}</div>
    </div>`;
}
 
function viewAnswer() {
  const userText = state.userMessage || DEFAULT_USER_MESSAGE;
  return `
    <div class="view chat" id="chat" role="log" aria-live="polite">
      <div class="sepr">Hoy · ${currentGame().name}</div>
      ${userBubbleHtml(userText)}
      ${typingIndicatorHtml("typing")}
    </div>`;
}
 
function viewRecommender() {
  const groups = renderEach(
    PREFERENCE_GROUPS,
    (group) => `
      <div>
        <small>${group.label}</small>
        <div class="row" role="group" aria-label="${group.label}">${chipsHtml(group.options, group.options[0])}</div>
      </div>`,
  );
  return `
    <div class="view">
      <h2>Recomendador de videojuegos</h2>
      <p class="sub">Cuéntame qué te gusta y te sugiero tu próxima aventura.</p>
      <div class="form">
        ${groups}
        <div><button type="button" class="btn" data-action="go" data-view="recres">Ver recomendaciones</button></div>
      </div>
    </div>`;
}
 
function viewRecommendations() {
  const cards = renderEach(RECOMMENDATIONS, (recommendation) => {
    const game = getGame(recommendation.gameId);
    const mainGenre = game.genre.split(" ")[0];
    return `
      <div class="card">
        ${coverHtml(game)}
        <b>${game.name}</b>
        <small>${game.genre}</small>
        <p>Una experiencia que encaja con tu estilo.</p>
        <div>${tagsHtml([mainGenre, "Premiado"])}</div>
        <div class="note">Por qué: ${recommendation.reason}. ${recommendation.detail}.</div>
        <button type="button" class="btn" data-action="select-game" data-game-id="${game.id}">Más información</button>
      </div>`;
  });
  return `
    <div class="view">
      <h2>Tus recomendaciones</h2>
      <p class="sub">Elegidas según tus preferencias.</p>
      <div class="grid">${cards}</div>
    </div>`;
}
 
function viewGuides() {
  let cards = "";
  for (let index = 0; index < GUIDES.length; index++) {
    const guide = GUIDES[index];
    const matchesFilter = state.guideFilter === "Todo" || guide.type === state.guideFilter;
    if (!matchesFilter) {
      continue;
    }
    cards += `
      <button type="button" class="card" data-action="open-guide" data-index="${index}">
        <span class="tag" style="width:fit-content">${guide.type}</span>
        <b>${guide.title}</b>
        <small>${getGame(guide.gameId).name}</small>
      </button>`;
  }
  if (!cards) {
    cards = `<p class="sub empty-state">Aún no hay guías de este tipo. Pídeme una desde Nueva conversación.</p>`;
  }
  return `
    <div class="view">
      <h2>Guías y estrategias</h2>
      <div class="row" role="group" aria-label="Filtrar guías">${chipsHtml(GUIDE_FILTERS, state.guideFilter, "filter-guides")}</div>
      <div class="grid">${cards}</div>
    </div>`;
}
 
function viewLibrary() {
  const visibleGames = GAMES.slice(0, state.showFavorites ? FAVORITES_COUNT : LIBRARY_COUNT);
  const cards = renderEach(
    visibleGames,
    (game) => `
      <div class="card">
        ${coverHtml(game)}
        <b>${game.name}</b>
        <small>${game.platforms}</small>
        ${tagsHtml([game.genre])}
        <button type="button" class="btn" data-action="select-game" data-game-id="${game.id}">Pedir ayuda</button>
      </div>`,
  );
  return `
    <div class="view">
      <h2>${state.showFavorites ? "Favoritos" : "Mis videojuegos"}</h2>
      <p class="sub">Tu biblioteca personal con acceso rápido a ayuda.</p>
      <div class="grid">${cards}</div>
    </div>`;
}
 
function viewHistory() {
  const items = renderEach(HISTORY, (entry, index) => {
    const game = getGame(entry.gameId);
    return `
      <button type="button" class="card" data-action="open-history" data-index="${index}">
        <b>${entry.title}</b>
        <small>${game.name} · ${entry.when} · Última interacción: ${entry.lastInteraction}</small>
      </button>`;
  });
  return `
    <div class="view">
      <h2>Historial</h2>
      <p class="sub">Retoma tus conversaciones anteriores.</p>
      <div class="grid" style="grid-template-columns:1fr">${items}</div>
    </div>`;
}
 
function viewSettings() {
  const rows = renderEach(
    SETTINGS_LABELS,
    (label) => `<label class="setting">${label}<input type="checkbox" checked></label>`,
  );
  return `
    <div class="view">
      <h2>Configuración</h2>
      <p class="sub">Preferencias de demostración.</p>
      <div class="form">${rows}</div>
    </div>`;
}
 
/* Registro de pantallas: el nombre es el que se usa en go("nombre"). */
const VIEWS = {
  welcome: viewWelcome,
  games: viewGames,
  needs: viewNeeds,
  form: viewForm,
  think: viewThinking,
  answer: viewAnswer,
  rec: viewRecommender,
  recres: viewRecommendations,
  guides: viewGuides,
  lib: viewLibrary,
  hist: viewHistory,
  settings: viewSettings,
};
 
/* ==========================================================================
   6. EFECTOS DESPUÉS DE DIBUJAR UNA VISTA
   ========================================================================== */
 
/** Pantalla "pensando": activa los pasos uno a uno y luego muestra la respuesta. */
function startThinkingSequence() {
  const steps = $$(".stp");
  const bar = $(".bar");
  const barFill = $("i", bar);
 
  for (let activeIndex = 0; activeIndex < steps.length; activeIndex++) {
    schedule(
      () => {
        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
          const isDone = stepIndex < activeIndex;
          const isActive = stepIndex === activeIndex;
          steps[stepIndex].className = "stp" + (isDone ? " done" : isActive ? " on" : "");
          $(".stp-icon", steps[stepIndex]).textContent = isDone ? "✅" : "⏳";
        }
        const percent = Math.round(((activeIndex + 1) / steps.length) * 100);
        barFill.style.width = percent + "%";
        bar.setAttribute("aria-valuenow", String(percent));
      },
      activeIndex * THINKING_STEP_MS + 50,
    );
  }
 
  // "think" es transitoria: no se guarda en el historial del botón "Atrás".
  schedule(() => go("answer", { recordHistory: false }), THINKING_TOTAL_MS);
}
 
/** Pantalla "answer": cambia el indicador "escribiendo..." por la respuesta. */
function startAnswerSequence() {
  schedule(() => {
    const typingIndicator = $("#typing");
    if (!typingIndicator) {
      return;
    }
    const categoryId = currentCategoryId();
    const game = currentGame();
    state.lastAnswerText = buildAnswerText(categoryId, game);
    typingIndicator.outerHTML = assistantAnswerHtml(categoryId, game);
    scrollChatToBottom();
  }, ANSWER_DELAY_MS);
}
 
/* Qué función se ejecuta justo después de dibujar cada vista (si tiene). */
const AFTER_RENDER = {
  think: startThinkingSequence,
  answer: startAnswerSequence,
};
 
/* ==========================================================================
   7. NAVEGACIÓN Y DIBUJADO
   ========================================================================== */
 
/* Vistas que no deben quedar en el historial del botón "Atrás". */
const TRANSIENT_VIEWS = new Set(["think"]);
 
/**
 * Cambia de pantalla.
 * recordHistory = false evita guardar la pantalla actual en el historial.
 */
function go(view, { recordHistory = true } = {}) {
  if (!VIEWS[view]) {
    console.error(`Vista desconocida: "${view}"`);
    return;
  }
  const isLeavingToAnotherView = state.view !== view;
  if (recordHistory && isLeavingToAnotherView && !TRANSIENT_VIEWS.has(state.view)) {
    state.history.push(state.view);
  }
  state.view = view;
  draw();
}
 
/** Reinicia la conversación y vuelve al inicio (botón "Nueva conversación"). */
function startOver() {
  state.history = [];
  state.gameId = null;
  state.categoryId = null;
  state.highlightedCategoryId = null;
  state.userMessage = "";
  go("welcome", { recordHistory: false });
}
 
/** Dibuja la pantalla actual. moveFocus = false conserva el foco del teclado. */
function draw({ moveFocus = true } = {}) {
  cancelScheduled();
 
  const main = $("#main");
  main.innerHTML = VIEWS[state.view]();
  main.scrollTop = 0;
 
  updateNavHighlight();
  $("#back").style.visibility = state.history.length ? "visible" : "hidden";
  setSidebarOpen(false);
 
  const afterRender = AFTER_RENDER[state.view];
  if (afterRender) {
    afterRender();
  }
  if (moveFocus) {
    focusViewHeading();
  }
}
 
/** Marca en el menú la sección activa. */
function updateNavHighlight() {
  for (const button of $$(".navi")) {
    let isActive = button.dataset.view === state.view;
    if (isActive && state.view === "lib") {
      // "Mis videojuegos" y "Favoritos" comparten vista: se distingue por el modo.
      isActive = (button.dataset.favorites === "1") === state.showFavorites;
    }
    button.classList.toggle("on", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }
}
 
/** Al cambiar de pantalla el foco pasa al título, para lectores de pantalla y teclado. */
function focusViewHeading() {
  const heading = $("#main h1, #main h2");
  if (!heading) {
    return;
  }
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}
 
function setSidebarOpen(isOpen) {
  $("#side").classList.toggle("open", isOpen);
  $("#scrim").classList.toggle("show", isOpen);
  $("#burger").setAttribute("aria-expanded", String(isOpen));
}
 
/* ==========================================================================
   8. CHAT
   ========================================================================== */
 
function userBubbleHtml(text) {
  return `<div class="m me"><span class="av" aria-hidden="true">J</span><div class="bub">${escapeHtml(text)}</div></div>`;
}
 
function assistantBubbleHtml(innerHtml) {
  return `<div class="m"><span class="orb xs"></span><div class="bub">${innerHtml}</div></div>`;
}
 
function typingIndicatorHtml(id = "") {
  const idAttribute = id ? ` id="${id}"` : "";
  return `<div class="m"${idAttribute}><span class="orb xs"></span><div class="bub typing" role="status" aria-label="NOVA está escribiendo"><i></i><i></i><i></i></div></div>`;
}
 
function scrollChatToBottom() {
  const main = $("#main");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  main.scrollTo({ top: main.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" });
}
 
/** Agrega HTML al final del chat (si la pantalla actual tiene chat). */
function appendToChat(html) {
  const chat = $("#chat");
  if (!chat) {
    return;
  }
  chat.insertAdjacentHTML("beforeend", html);
  scrollChatToBottom();
}
 
/** Respuesta en texto plano: se usa para copiar y compartir. */
function buildAnswerText(categoryId, game) {
  const { answer } = CATEGORIES[categoryId];
  let text = `${answer.summary} (${game.name})\n`;
  for (let index = 0; index < answer.steps.length; index++) {
    text += `${index + 1}. ${answer.steps[index]}\n`;
  }
  text += `Consejo: ${answer.tip}`;
  return text;
}
 
/** Respuesta completa de NOVA, más la pregunta "¿Lograste resolver el problema?". */
function assistantAnswerHtml(categoryId, game) {
  const { answer, warning } = CATEGORIES[categoryId];
  const steps = renderEach(answer.steps, (step) => `<li>${step}</li>`);
  const warningHtml = warning ? `<div class="note warn">⚠️ ${warning}</div>` : "";
  const related = tagsHtml([`Guía de ${game.name}`, "Trucos", "Builds"]);
 
  const answerBubble = assistantBubbleHtml(`
    <b>¡No te preocupes! Vamos a resolverlo juntos.</b>
    <p>${answer.summary} (${game.name})</p>
    <ol>${steps}</ol>
    <div class="note">💡 Consejo: ${answer.tip}</div>
    ${warningHtml}
    <small>Relacionado: ${related}</small>
    <div class="row" style="margin:0">
      <button type="button" class="chip" data-action="more">Mostrar más detalles</button>
      <button type="button" class="chip" data-action="more">Dame una pista</button>
      <button type="button" class="chip" data-action="more">Explícame otra estrategia</button>
      <button type="button" class="chip" data-action="more">Hazme una guía paso a paso</button>
      <button type="button" class="chip" data-action="go" data-view="welcome">Tengo otra pregunta</button>
    </div>
    <div class="acts">
      <button type="button" class="ico" data-action="answer-copy">📋 Copiar</button>
      <button type="button" class="ico" data-action="answer-rate" data-rating="up" aria-pressed="false" aria-label="Me gusta">👍</button>
      <button type="button" class="ico" data-action="answer-rate" data-rating="down" aria-pressed="false" aria-label="No me gusta">👎</button>
      <button type="button" class="ico" data-action="more">🔄 Regenerar</button>
      <button type="button" class="ico" data-action="answer-share">↗ Compartir</button>
    </div>`);
 
  const feedbackBubble = assistantBubbleHtml(`
    <b>¿Lograste resolver el problema?</b>
    <div class="ask">
      <button type="button" class="btn" data-action="answer-yes">¡Sí, lo conseguí!</button>
      <button type="button" class="btn ghost" data-action="answer-no">Todavía necesito ayuda</button>
    </div>`);
 
  return answerBubble + feedbackBubble;
}
 
/** El usuario escribe en el campo de abajo mientras ya está viendo una respuesta. */
function sendFollowUp(text) {
  const chat = $("#chat");
  chat.insertAdjacentHTML("beforeend", userBubbleHtml(text));
  chat.insertAdjacentHTML("beforeend", typingIndicatorHtml());
  const typingIndicator = chat.lastElementChild;
  scrollChatToBottom();
 
  schedule(() => {
    typingIndicator.outerHTML = assistantBubbleHtml(FOLLOW_UP_REPLY);
    scrollChatToBottom();
  }, FOLLOW_UP_DELAY_MS);
}
 
/** Mensaje del campo de abajo: en una respuesta se agrega al chat; en otra pantalla inicia una. */
function sendComposerMessage(text) {
  if (state.view === "answer") {
    sendFollowUp(text);
    return;
  }
  state.userMessage = text;
  ensureConversationDefaults();
  go("answer");
}
 
/** Arma el mensaje del usuario a partir de los campos del formulario. */
function collectFormMessage() {
  const lines = [];
  for (const label of $$("#help-form label")) {
    const control = $("input, textarea, select", label);
    const value = control.value.trim();
    if (value) {
      lines.push(`${$(".field-label", label).textContent}: ${value}`);
    }
  }
  const selectedMode = $("#modes .chip.on");
  if (selectedMode) {
    lines.push(`Tipo de ayuda: ${selectedMode.dataset.chip}`);
  }
  return lines.join("\n");
}
 
function submitHelpForm() {
  state.userMessage = collectFormMessage();
  ensureConversationDefaults();
  go("think");
}
 
/** Copia la última respuesta. Si el navegador no lo permite, lo avisa en el botón. */
async function copyAnswer(button) {
  if (!button.dataset.label) {
    button.dataset.label = button.textContent; // texto original, para restaurarlo
  }
  try {
    await navigator.clipboard.writeText(state.lastAnswerText);
    button.textContent = "✔ Copiado";
  } catch (error) {
    button.textContent = "No se pudo copiar";
  }
  setTimeout(() => {
    button.textContent = button.dataset.label;
  }, 1500);
}
 
/** Usa el menú de compartir del dispositivo; si no existe, copia el texto. */
async function shareAnswer(button) {
  if (!navigator.share) {
    await copyAnswer(button);
    return;
  }
  try {
    await navigator.share({ title: "Consejo de NOVA", text: state.lastAnswerText });
  } catch (error) {
    // El usuario cerró el menú de compartir: no es un error.
  }
}
 
/** 👍 / 👎: solo uno puede estar activo; pulsar el activo lo desmarca. */
function rateAnswer(button) {
  const wasPressed = button.getAttribute("aria-pressed") === "true";
  for (const ratingButton of $$("[data-rating]", button.closest(".acts"))) {
    ratingButton.setAttribute("aria-pressed", "false");
  }
  button.setAttribute("aria-pressed", String(!wasPressed));
}
 
/* ==========================================================================
   9. ACCIONES (clics) Y EVENTOS
   ========================================================================== */
 
/* Cada botón del HTML declara qué hace con data-action="nombre".
   Aquí está la lista completa de acciones; cada una recibe el botón pulsado. */
const ACTIONS = {
  /* Navegación */
  go(button) {
    if (button.dataset.favorites !== undefined) {
      state.showFavorites = button.dataset.favorites === "1";
    }
    go(button.dataset.view);
  },
 
  home: startOver,
 
  /* Pantalla de inicio */
  "select-feature"(button) {
    const feature = FEATURES[Number(button.dataset.index)];
    state.highlightedCategoryId = feature.category || null;
    state.categoryId = null;
    go(feature.view);
  },
 
  /* Elegir juego y categoría */
  "select-game"(button) {
    state.gameId = button.dataset.gameId;
    go("needs");
  },
 
  "select-category"(button) {
    state.categoryId = button.dataset.categoryId;
    go("form");
  },
 
  /* Chips */
  "select-chip"(button) {
    const group = button.closest(".row");
    for (const chip of $$(".chip", group)) {
      const isSelected = chip === button;
      chip.classList.toggle("on", isSelected);
      chip.setAttribute("aria-pressed", String(isSelected));
    }
  },
 
  "filter-guides"(button) {
    state.guideFilter = button.dataset.chip;
    draw({ moveFocus: false });
    // El dibujado reemplaza los botones: se devuelve el foco al chip elegido.
    for (const chip of $$('[data-action="filter-guides"]')) {
      if (chip.dataset.chip === state.guideFilter) {
        chip.focus();
      }
    }
  },
 
  /* Guías e historial abren directamente una respuesta */
  "open-guide"(button) {
    const guide = GUIDES[Number(button.dataset.index)];
    state.gameId = guide.gameId;
    state.categoryId = guide.category;
    state.userMessage = `Quiero ver: ${guide.title}`;
    go("answer");
  },
 
  "open-history"(button) {
    const entry = HISTORY[Number(button.dataset.index)];
    state.gameId = entry.gameId;
    state.categoryId = entry.category;
    state.userMessage = entry.title;
    go("answer");
  },
 
  /* Botones dentro de la respuesta */
  more() {
    appendToChat(assistantBubbleHtml(MORE_DETAILS_REPLY));
  },
 
  "answer-copy": copyAnswer,
  "answer-share": shareAnswer,
  "answer-rate": rateAnswer,
 
  "answer-yes"() {
    appendToChat(
      assistantBubbleHtml(`
        <b>¡Excelente! 🎉 Me alegra haberte ayudado. ¿Qué aventura exploramos ahora?</b>
        <div class="row" style="margin:0">
          <button type="button" class="btn" data-action="go" data-view="needs">Ayúdame con otro problema</button>
          <button type="button" class="btn ghost" data-action="go" data-view="games">Explorar otro videojuego</button>
          <button type="button" class="btn ghost" data-action="go" data-view="welcome">Volver al inicio</button>
        </div>`),
    );
  },
 
  "answer-no"() {
    appendToChat(
      assistantBubbleHtml(`
        <b>¡No te preocupes! Vamos a intentarlo de otra manera.</b>
        <div class="row" style="margin:0">
          <button type="button" class="btn" data-action="more">Probar otra solución</button>
          <button type="button" class="btn ghost" data-action="go" data-view="form">Darme más detalles</button>
          <button type="button" class="btn ghost" data-action="more">Mostrar una guía alternativa</button>
          <button type="button" class="btn ghost" data-action="go" data-view="form">Explicar el problema de otra manera</button>
        </div>`),
    );
  },
};
 
/* Un solo oyente de clics para toda la aplicación. */
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }
  const action = ACTIONS[button.dataset.action];
  if (action) {
    action(button);
  } else {
    console.error(`Acción desconocida: "${button.dataset.action}"`);
  }
});
 
/* Formulario de ayuda: así también funciona la tecla Enter. */
$("#main").addEventListener("submit", (event) => {
  if (event.target.id === "help-form") {
    event.preventDefault();
    submitHelpForm();
  }
});
 
/* Buscador de la pantalla de juegos. */
$("#main").addEventListener("input", (event) => {
  if (event.target.id === "q") {
    $("#gl").innerHTML = gameListHtml(event.target.value);
  }
});
 
/* Campo de conversación siempre visible. */
$("#composer").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#msg");
  const text = input.value.trim();
  if (!text) {
    return;
  }
  input.value = "";
  sendComposerMessage(text);
});
 
$("#back").addEventListener("click", () => {
  if (state.history.length === 0) {
    return;
  }
  state.view = state.history.pop();
  draw();
});
 
/* Menú lateral */
$("#collapse").addEventListener("click", () => {
  const isCollapsed = $("#side").classList.toggle("mini");
  const collapseButton = $("#collapse");
  collapseButton.setAttribute("aria-expanded", String(!isCollapsed));
  collapseButton.setAttribute("aria-label", isCollapsed ? "Expandir menú" : "Contraer menú");
});
$("#burger").addEventListener("click", () => setSidebarOpen(true));
$("#scrim").addEventListener("click", () => setSidebarOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebarOpen(false);
  }
});
 
/* ==========================================================================
   10. ARRANQUE
   ========================================================================== */
 
$("#nav").innerHTML = renderEach(
  NAV_ITEMS,
  (item) => `
    <button type="button" class="navi" data-action="${item.view === "welcome" ? "home" : "go"}" data-view="${item.view}" data-favorites="${item.favorites ? 1 : 0}" title="${item.label}">
      <span aria-hidden="true">${item.icon}</span><span>${item.label}</span>
    </button>`,
);
 
draw({ moveFocus: false });
 