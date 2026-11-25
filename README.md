# Asistente-Virtual-IA · NOVA
 
NOVA es un asistente virtual para jugadores: ayuda con misiones, estrategias,
jefes, builds, secretos y problemas técnicos de videojuegos.
 
> **Estado:** maqueta navegable. Todo el contenido es de demostración; todavía
> no hay backend ni IA real.
 
## Cómo ejecutarlo
 
No necesita instalación. Abre `index.html` en el navegador.
 
## Estructura
 
| Archivo      | Qué contiene                                        |
| ------------ | --------------------------------------------------- |
| `index.html` | Estructura de la página (menú, cabecera, chat)      |
| `styles.css` | Estilos y tema visual                               |
| `script.js`  | Datos, pantallas, navegación y lógica del asistente |
 
## Cómo agregar contenido
 
- **Un juego nuevo:** añade un objeto a `GAMES` en `script.js`.
- **Una categoría de ayuda nueva:** añade una entrada a `CATEGORIES` con su
  formulario, su respuesta y su aviso opcional.
- **Una pantalla nueva:** crea una función `viewMiVista()` que devuelva HTML,
  regístrala en `VIEWS` y navega a ella con `go("miVista")`.
## Próximos pasos
 
- Conectar una IA real mediante un backend propio (nunca pongas claves de API
  en el código del navegador).
- Guardar historial, favoritos y configuración.
- Permitir adjuntar imágenes (capturas del juego).
 
gi