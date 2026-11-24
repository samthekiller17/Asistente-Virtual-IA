/* NOVA · maqueta navegable. Todo el contenido es demostrativo (sin backend ni IA real).
   Estructura: DATA → estado → vistas (R.*) → navegación/eventos. Para agregar una pantalla: crea R.mivista y llama go('mivista'). */
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];

/* ---------- DATA ---------- */
const GAMES=[["Minecraft","Sandbox","PC · Consola · Móvil","#3f9b3f","#8b5a2b","MC"],["Fortnite","Battle Royale","Multiplataforma","#7c5cff","#22d3ee","FN"],["Grand Theft Auto V","Acción · Mundo abierto","PC · Consola","#f59e0b","#b91c1c","GTA"],["Valorant","Shooter táctico","PC","#ef4444","#7f1d1d","VAL"],["League of Legends","MOBA","PC","#0ea5e9","#1e3a8a","LoL"],["Elden Ring","RPG de acción","PC · Consola","#d4a017","#3b2a0a","ER"],["Resident Evil","Survival horror","PC · Consola","#991b1b","#111","RE"],["Call of Duty","Shooter","PC · Consola","#64748b","#0f172a","CoD"],["The Witcher 3","RPG · Mundo abierto","PC · Consola","#94a3b8","#475569","W3"],["Hollow Knight","Metroidvania","PC · Switch","#6366f1","#0b0b2a","HK"]];
const FEATS=[["🎮","Necesito ayuda con un videojuego","Elige tu juego y cuéntame qué pasa","games"],["🗺️","Quiero superar una misión","Te guío por niveles y capítulos","games","mission"],["⚔️","Busco estrategias y consejos","Mejora tu rendimiento","games","strategy"],["✨","Recomiéndame un videojuego","Encuentra tu próxima aventura","rec"],["🛠️","Tengo un problema técnico","Errores, lag y rendimiento","games","tech"],["🔍","Quiero descubrir secretos y trucos","Coleccionables y easter eggs","games","secrets"]];
const CATS=[["mission","🗺️","Misiones y niveles","Avanza cuando estés atascado"],["strategy","⚔️","Estrategias y consejos","Tácticas para ganar más"],["chars","🧙","Personajes y habilidades","Builds, clases y poderes"],["weapons","🗡️","Armas y equipamiento","Dónde conseguirlas y mejorarlas"],["secrets","💎","Secretos y coleccionables","Lo que casi nadie encuentra"],["bosses","👹","Jefes y enemigos","Patrones y puntos débiles"],["tech","🛠️","Problemas técnicos","Errores, FPS y conexión"],["info","📖","Información general","Aprende lo básico del juego"]];
const Q={mission:"¿En qué parte del juego te encuentras?",strategy:"Cuéntame cómo juegas",chars:"¿Sobre qué personaje quieres saber?",weapons:"¿Qué arma o equipo te interesa?",secrets:"¿Dónde quieres buscar secretos?",bosses:"¿Contra quién estás luchando?",tech:"Vamos a diagnosticar el problema",info:"¿Qué te gustaría saber?"};
const F={mission:[["Nombre de la misión","i"],["Nivel o capítulo","i"],["Descripción del problema","t"],["¿Qué has intentado hasta ahora?","t"]],
strategy:[["Modo de juego","s","Individual,Competitivo,Cooperativo"],["Tu objetivo","s","Subir de rango,Ganar más partidas,Progresar más rápido"],["Tu situación actual","t"]],
chars:[["Personaje o clase","i"],["¿Qué quieres saber?","s","Habilidades,Mejor build,Cómo desbloquearlo"]],
weapons:[["Arma u objeto","i"],["¿Qué buscas?","s","Dónde conseguirlo,Cómo mejorarlo,Comparativa"],["Tu nivel actual","i"]],
secrets:[["Zona o mapa","i"],["Tipo de secreto","s","Coleccionables,Logros,Easter eggs"]],
bosses:[["Jefe o enemigo","i"],["¿Qué te cuesta más?","s","Sus ataques,Mi equipamiento,Mi estrategia"],["Intentos hasta ahora","i"]],
tech:[["¿En qué plataforma juegas?","s","PC,PlayStation,Xbox,Switch,Móvil"],["¿Qué problema experimentas?","s","Bajo rendimiento,Se cierra solo,No carga,Lag en línea"],["¿Aparece algún mensaje de error?","i"]],
info:[["¿Qué quieres saber?","t"],["Tu experiencia con el juego","s","Nuevo,Intermedio,Veterano"]]};
const ANS={mission:["Parece que te falta un objeto o paso previo.",["Vuelve a la última zona segura y revisa tu mapa.","Habla de nuevo con los personajes clave: suelen dar pistas nuevas.","Busca puntos de interés marcados que aún no visitaste.","Guarda la partida antes de intentarlo otra vez."],"Prueba otro enfoque: sigilo en lugar de combate directo."],
strategy:["Tu rendimiento mejora con pequeños ajustes de hábito.",["Define un objetivo por partida.","Revisa tus repeticiones y detecta un error recurrente.","Domina un solo rol antes de cambiar.","Practica 10 minutos de entrenamiento antes de jugar."],"La constancia vale más que partidas largas."],
chars:["Este personaje destaca si combinas bien sus habilidades.",["Prioriza la habilidad principal en los primeros niveles.","Elige un equipamiento que refuerce tu estilo.","Combina pasivas con tu habilidad definitiva.","Prueba la build en una zona fácil."],"Reparte puntos con calma: algunos no se pueden reasignar."],
weapons:["Hay una opción mejor según tu nivel actual.",["Revisa el mapa de tiendas y cofres.","Cumple la misión secundaria asociada.","Mejora el arma con materiales raros.","Compara daño y alcance antes de equiparla."],"No gastes recursos raros en armas temporales."],
secrets:["Hay más secretos de los que parece en esa zona.",["Explora los bordes del mapa.","Fíjate en sonidos y luces distintas.","Interactúa con objetos fuera de lugar.","Anota lo que encuentres."],"Algunos secretos solo aparecen a ciertas horas."],
bosses:["Ese jefe tiene un patrón que puedes aprender.",["Observa sus tres primeros ataques sin atacar.","Esquiva hacia el lado, no hacia atrás.","Ataca solo tras su movimiento más lento.","Cura antes de la fase dos."],"Reduce su resistencia con el equipamiento adecuado."],
tech:["Esto suele resolverse con ajustes simples.",["Actualiza los controladores y el juego.","Baja la calidad gráfica y desactiva efectos pesados.","Verifica la integridad de los archivos.","Reinicia el router si el problema es de conexión."],"Cierra programas en segundo plano."],
info:["Te cuento lo esencial para empezar con buen pie.",["Completa el tutorial inicial.","Aprende los controles básicos.","Sigue la historia principal primero.","Explora por tu cuenta cuando te sientas listo."],"Juega a tu ritmo, no hay prisa."]};
const WARN={mission:"Cuidado: si avanzas sin guardar podrías perder el objeto clave.",weapons:"Advertencia: mejorar sin materiales suficientes puede ser irreversible.",tech:"Antes de reinstalar, respalda tus partidas guardadas.",bosses:"Cuidado: la fase dos aumenta mucho el daño."};
const HIST=[["Atascado en el castillo",5,"Hoy","Pedí una guía paso a paso","mission"],["Build para mago",5,"Ayer","Comparé dos builds","chars"],["Lag en partidas online",3,"Hace 3 días","Ajusté gráficos","tech"],["Jefe final del DLC",8,"Hace 1 semana","Estrategia para fase 2","bosses"]];
const GUIDES=[["Guías","Guía completa del primer mundo","Minecraft"],["Builds","Build de mago de hielo","Elden Ring"],["Trucos","5 trucos de movimiento","Fortnite"],["Secretos","Todos los coleccionables del mapa","Hollow Knight"],["Estrategias","Control de mapa y economía","League of Legends"],["Tutoriales","Primeros pasos para novatos","Valorant"]];
const PREFS=[["Género favorito","Acción,RPG,Aventura,Estrategia,Terror"],["Tipo de experiencia","Relajada,Competitiva,Narrativa,Desafiante"],["Modo","Individual,Multijugador"],["Dificultad","Fácil,Media,Difícil"],["Plataforma","PC,Consola,Móvil"]];
const RECS=[[5,"Elige RPG y dificultad alta","Mundo enorme y combates exigentes"],[8,"Te gustan las historias","Narrativa profunda y decisiones"],[9,"Prefieres explorar","Atmósfera única, precio accesible"]];

/* ---------- ESTADO ---------- */
const S={view:"welcome",arg:null,stack:[],game:null,cat:null,pre:null,msg:"",mode:"Pista",gf:"Todo",lib:0};
const gCover=g=>`<div class="cover" style="background:linear-gradient(135deg,${g[3]},${g[4]})">${g[5]}</div>`;
const tags=a=>a.map(t=>`<span class="tag">${t}</span>`).join("");
const chips=(items,on)=>items.map(c=>`<button type="button" class="chip${c===on?" on":""}" data-chip="${c}">${c}</button>`).join("");
const picked=()=>S.game!=null?`<div class="pick">${gCover(GAMES[S.game])}<span><b>${GAMES[S.game][0]}</b><small>${GAMES[S.game][1]}</small></span></div>`:"";
const gameCard=(g,i,btn)=>`<button class="card" data-game="${i}">${gCover(g)}<b>${g[0]}</b><small>${g[1]} · ${g[2]}</small><span class="tag" style="width:fit-content">${btn}</span></button>`;

/* ---------- VISTAS ---------- */
const R={
welcome:()=>`<div class="view"><div class="hero"><span class="orb lg"></span><h1>¡Hola, jugador! 🎮</h1><p class="sub">Soy NOVA, tu compañero de aventuras. Estoy aquí para ayudarte a superar desafíos, descubrir secretos y mejorar tu experiencia de juego. Elige una opción o escríbeme abajo.</p></div>
<div class="grid">${FEATS.map((f,i)=>`<button class="card" data-feat="${i}"><span class="i">${f[0]}</span><b>${f[1]}</b><small>${f[2]}</small></button>`).join("")}</div></div>`,
games:()=>`<div class="view"><h2>¿Con qué videojuego necesitas ayuda?</h2><p class="sub">Busca o elige uno de los juegos populares.</p>
<input id="q" placeholder="Buscar videojuego…" aria-label="Buscar videojuego"><div class="grid" id="gl" style="margin-top:16px">${GAMES.map((g,i)=>gameCard(g,i,"Seleccionar")).join("")}</div></div>`,
needs:()=>`<div class="view">${picked()}<h2>¡Excelente elección! ¿En qué puedo ayudarte con este juego?</h2><p class="sub">Elige una categoría.</p>
<div class="grid">${CATS.map(c=>`<button class="card${S.pre===c[0]?" on":""}" data-cat="${c[0]}"><span class="i">${c[1]}</span><b>${c[2]}</b><small>${c[3]}</small></button>`).join("")}</div></div>`,
form:()=>`<div class="view">${picked()}<h2>${Q[S.cat]}</h2><p class="sub">Mientras más detalles me des, mejor será mi ayuda.</p>
<div class="form">${F[S.cat].map(f=>`<label>${f[0]}${f[1]=="i"?`<input>`:f[1]=="t"?`<textarea rows="3"></textarea>`:`<select>${f[2].split(",").map(o=>`<option>${o}</option>`).join("")}</select>`}</label>`).join("")}
${S.cat=="mission"?`<div><small>¿Qué tipo de ayuda quieres?</small><div class="row" id="modes">${chips(["Una pista","Guía completa","Paso a paso"],"Una pista")}</div></div>`:""}
<div><button class="btn" data-go="think">Pedir ayuda a NOVA</button></div></div></div>`,
think:()=>{setTimeout(()=>{$$(".stp").forEach((e,i)=>setTimeout(()=>{if(S.view!="think")return;$$(".stp").forEach((x,j)=>x.className="stp "+(j<i?"done":j==i?"on":""));$(".bar i").style.width=(i+1)*33+"%"},i*1000));setTimeout(()=>S.view=="think"&&go("answer",null,1),3300)},50);
return`<div class="view think"><div class="ring"></div>${[20,45,70,30,60].map((l,i)=>`<i class="part" style="left:${30+l/2}%;top:150px;animation-delay:${i*.5}s"></i>`).join("")}<span class="orb lg"></span><h2>Estoy preparando una solución para ti…</h2>
<div class="bar"><i></i></div><div class="steps"><div class="stp">⏳ Analizando tu situación</div><div class="stp">⏳ Identificando posibles soluciones</div><div class="stp">⏳ Preparando recomendaciones</div></div></div>`},
answer:()=>{const c=S.cat||"mission",a=ANS[c],g=GAMES[S.game??0];
setTimeout(()=>{if(S.view!="answer")return;const t=$("#typ");if(!t)return;t.outerHTML=`<div class="m"><span class="orb xs"></span><div class="bub"><b>¡No te preocupes! Vamos a resolverlo juntos.</b><p>${a[0]} (${g[0]})</p><ol>${a[1].map(s=>`<li>${s}</li>`).join("")}</ol><div class="note">💡 Consejo: ${a[2]}</div>${WARN[c]?`<div class="note warn">⚠️ ${WARN[c]}</div>`:""}<small>Relacionado: ${tags(["Guía de "+g[0],"Trucos","Builds"])}</small>
<div class="row" style="margin:0"><button class="chip" data-act="more">Mostrar más detalles</button><button class="chip" data-act="more">Dame una pista</button><button class="chip" data-act="more">Explícame otra estrategia</button><button class="chip" data-act="more">Hazme una guía paso a paso</button><button class="chip" data-go="welcome">Tengo otra pregunta</button></div>
<div class="acts"><button class="ico" data-act="copy">📋 Copiar</button><button class="ico" data-act="like">👍</button><button class="ico" data-act="like">👎</button><button class="ico" data-act="regen">🔄 Regenerar</button><button class="ico" data-act="copy">↗ Compartir</button></div></div></div>
<div class="m"><span class="orb xs"></span><div class="bub"><b>¿Lograste resolver el problema?</b><div class="ask"><button class="btn" data-act="yes">¡Sí, lo conseguí!</button><button class="btn ghost" data-act="no">Todavía necesito ayuda</button></div></div></div>`;$("#main").scrollTo({top:9e9,behavior:"smooth"})},1400);
return`<div class="view chat" id="chat"><div class="sepr">Hoy · ${g[0]}</div><div class="m me"><span class="av">J</span><div class="bub">${S.msg||"Estoy atascado y no encuentro cómo continuar."}</div></div><div class="m" id="typ"><span class="orb xs"></span><div class="bub typing"><i></i><i></i><i></i></div></div></div>`},
rec:()=>`<div class="view"><h2>Recomendador de videojuegos</h2><p class="sub">Cuéntame qué te gusta y te sugiero tu próxima aventura.</p><div class="form">${PREFS.map(p=>`<div><small>${p[0]}</small><div class="row" data-grp>${chips(p[1].split(","),p[1].split(",")[0])}</div></div>`).join("")}<div><button class="btn" data-go="recres">Ver recomendaciones</button></div></div></div>`,
recres:()=>`<div class="view"><h2>Tus recomendaciones</h2><p class="sub">Elegidas según tus preferencias.</p><div class="grid">${RECS.map(r=>{const g=GAMES[r[0]];return`<div class="card">${gCover(g)}<b>${g[0]}</b><small>${g[1]}</small><p>Una experiencia que encaja con tu estilo.</p><div>${tags([g[1].split(" ")[0],"Premiado"])}</div><div class="note">Por qué: ${r[1]}. ${r[2]}.</div><button class="btn" data-game="${r[0]}">Más información</button></div>`}).join("")}</div></div>`,
guides:()=>{const f=["Todo","Guías","Consejos","Estrategias","Tutoriales","Builds","Trucos","Secretos"];return`<div class="view"><h2>Guías y estrategias</h2><div class="row" id="gf">${chips(f,S.gf)}</div><div class="grid">${GUIDES.filter(g=>S.gf=="Todo"||g[0]==S.gf).map(g=>`<button class="card" data-go="answer" data-cat="strategy"><span class="tag" style="width:fit-content">${g[0]}</span><b>${g[1]}</b><small>${g[2]}</small></button>`).join("")||"<p class='sub'>Aún no hay guías de este tipo. Pídeme una desde Nueva conversación.</p>"}</div></div>`},
lib:()=>`<div class="view"><h2>${S.lib?"Favoritos":"Mis videojuegos"}</h2><p class="sub">Tu biblioteca personal con acceso rápido a ayuda.</p><div class="grid">${GAMES.slice(0,S.lib?3:6).map((g,i)=>`<div class="card">${gCover(g)}<b>${g[0]}</b><small>${g[2]}</small>${tags([g[1]])}<button class="btn" data-game="${i}">Pedir ayuda</button></div>`).join("")}</div></div>`,
hist:()=>`<div class="view"><h2>Historial</h2><p class="sub">Retoma tus conversaciones anteriores.</p><div class="grid" style="grid-template-columns:1fr">${HIST.map(h=>`<button class="card" data-hist="${h[1]}|${h[4]}"><b>${h[0]}</b><small>${GAMES[h[1]][0]} · ${h[2]} · Última interacción: ${h[3]}</small></button>`).join("")}</div></div>`,
settings:()=>`<div class="view"><h2>Configuración</h2><p class="sub">Preferencias de demostración.</p><div class="form">${["Sonidos del asistente","Animaciones","Modo compacto"].map(t=>`<label style="display:flex;justify-content:space-between;align-items:center;color:var(--tx)">${t}<input type="checkbox" checked style="width:auto"></label>`).join("")}</div></div>`};

/* ---------- NAVEGACIÓN ---------- */
const NAV=[["🏠","Inicio","welcome"],["🎮","Mis videojuegos","lib"],["🕘","Historial","hist"],["🧭","Explorar videojuegos","games"],["⭐","Favoritos","lib",1],["✨","Recomendador","rec"],["📚","Guías","guides"],["⚙️","Configuración","settings"]];
$("#nav").innerHTML=NAV.map(n=>`<button class="navi" data-go="${n[2]}" data-lib="${n[3]||0}"><span>${n[0]}</span><span>${n[1]}</span></button>`).join("");
function go(v,arg,skip){if(!skip&&S.view!=v)S.stack.push(S.view);S.view=v;S.arg=arg;draw()}
function draw(){$("#main").innerHTML=R[S.view]();$("#main").scrollTop=0;$$(".navi").forEach(n=>n.classList.toggle("on",n.dataset.go==S.view&&(n.dataset.go!="lib"||+n.dataset.lib==S.lib)));$("#back").style.visibility=S.stack.length?"visible":"hidden";side(0)}
function side(o){$("#side").classList.toggle("open",!!o);$("#scrim").classList.toggle("show",!!o)}
const say=h=>{$("#chat").insertAdjacentHTML("beforeend",h);$("#main").scrollTo({top:9e9,behavior:"smooth"})};
const reply=t=>`<div class="m"><span class="orb xs"></span><div class="bub">${t}</div></div>`;

document.addEventListener("click",e=>{
 const t=e.target.closest("[data-feat],[data-game],[data-cat],[data-go],[data-act],[data-chip],[data-hist]");if(!t)return;const d=t.dataset;
 if(d.feat!=null){const f=FEATS[d.feat];S.pre=f[4]||null;S.cat=null;return go(f[3])}
 if(d.hist){const[g,c]=d.hist.split("|");S.game=+g;S.cat=c;S.msg="";return go("answer")}
 if(d.game!=null){S.game=+d.game;return go("needs")}
 if(d.cat){S.cat=d.cat;if(d.go=="answer")S.game=S.game??0;return go(d.go||"form")}
 if(d.chip){const g=t.closest(".row");if(g.id=="gf"){S.gf=d.chip;return draw()}$$(".chip",g).forEach(c=>c.classList.toggle("on",c==t));return}
 if(d.go){if(d.go=="welcome"&&!t.closest(".bub")){S.stack=[];S.pre=null}if(d.go=="think"){S.msg=($("textarea")||{}).value||"";}if(d.lib!=null)S.lib=+d.lib;if(d.go=="think"||d.go=="answer"){if(S.game==null)S.game=0;if(!S.cat)S.cat="mission"}return go(d.go)}
 if(d.act=="yes")say(reply("<b>¡Excelente! 🎉 Me alegra haberte ayudado. ¿Qué aventura exploramos ahora?</b><div class='row' style='margin:0'><button class='btn' data-go='needs'>Ayúdame con otro problema</button><button class='btn ghost' data-go='games'>Explorar otro videojuego</button><button class='btn ghost' data-go='welcome'>Volver al inicio</button></div>"));
 if(d.act=="no")say(reply("<b>¡No te preocupes! Vamos a intentarlo de otra manera.</b><div class='row' style='margin:0'><button class='btn' data-act='more'>Probar otra solución</button><button class='btn ghost' data-go='form'>Darme más detalles</button><button class='btn ghost' data-act='more'>Mostrar una guía alternativa</button><button class='btn ghost' data-go='form'>Explicar el problema de otra manera</button></div>"));
 if(d.act=="more"||d.act=="regen")say(reply("Aquí tienes otra perspectiva: prueba cambiar el orden de los pasos y revisa si te falta un requisito previo. <small>Respuesta de demostración.</small>"));
 if(d.act=="like"||d.act=="copy"){t.textContent="✔";}
});
$("#main").addEventListener("input",e=>{if(e.target.id=="q"){const v=e.target.value.toLowerCase();$("#gl").innerHTML=GAMES.map((g,i)=>g[0].toLowerCase().includes(v)?gameCard(g,i,"Seleccionar"):"").join("")||"<p class='sub'>Sin resultados. Prueba con otro nombre.</p>"}});
$("#composer").addEventListener("submit",e=>{e.preventDefault();const v=$("#msg").value.trim();if(!v)return;$("#msg").value="";S.msg=v;S.game=S.game??0;S.cat=S.cat||"mission";go("answer")});
$("#back").onclick=()=>{if(S.stack.length){S.view=S.stack.pop();draw()}};
$("#collapse").onclick=()=>$("#side").classList.toggle("mini");
$("#burger").onclick=()=>side(1);$("#scrim").onclick=()=>side(0);
draw();
