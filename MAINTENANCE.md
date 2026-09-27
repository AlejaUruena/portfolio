# Notas de construcción y despliegue

Documentación interna del sitio. La portada pública del repositorio es `README.md`.

## Estructura

```
portfolio/
├── index.html                        Hero · Work · About · Contact
├── css/style.css                     todos los estilos; las variables de :root controlan el tema
├── js/main.js                        filtro de verticales + estado en URL + nav
├── projects/
│   ├── _template-case-study.html     duplica este archivo por cada proyecto nuevo
│   ├── guitar-hero-iii.html          redactado
│   ├── kungata.html                  borrador
│   ├── el-ultimo-aliento.html        borrador
│   ├── maloka.html                   borrador
│   ├── umbrella-corp.html            borrador
│   └── necronomicon.html             borrador
├── assets/                           miniaturas, imágenes, SVGs de herramientas
├── .nojekyll                         evita que GitHub Pages procese el sitio con Jekyll
└── README.md
```

## Cómo funciona el filtro de verticales

Los dos botones de la sección Work intercambian el listado **en sitio**: sin recarga y sin
salto de scroll. El estado se refleja en la URL:

- `index.html` → abre en **Game UI/UX**
- `index.html?v=product` → abre en **Product & Digital**

Usa el segundo enlace cuando apliques a vacantes de producto digital. Evita mantener dos
portafolios separados.

## Etiquetas de contribución

Cada tarjeta declara el alcance real: `Concept & UI Design`, `Implementation`,
`UI Design & Writing`, `UI Art & Illustration`, `UX & UI Design`. La etiqueta de la tarjeta
y la del case study tienen que coincidir. No infles el alcance — es lo que más rápido
destruye credibilidad en una entrevista de portafolio.

## Miniaturas con movimiento en hover

Cada tarjeta usa una imagen estática más un clip que se reproduce solo al pasar el cursor.
Tres archivos por proyecto, con el mismo nombre base, en `assets/thumbs/`:

```
guitar-hero-iii.jpg     póster estático, 960×720 — es lo único que carga de entrada
guitar-hero-iii.webm    clip principal
guitar-hero-iii.mp4     respaldo para Safari antiguo
```

En `index.html`, borra el `<div class="thumb-empty">` de esa tarjeta y descomenta el bloque
de debajo. El `alt` ya está escrito; revísalo si el contenido de la imagen cambia.

### Por qué video y no GIF

Un GIF no se puede pausar: una vez cargado se reproduce siempre. Pesa entre diez y quince
veces más que el mismo clip en MP4, y se limita a 256 colores — justo donde un degradado
morado oscuro produce bandeado visible. Enseñar trabajo de UI en un formato que degrada el
color es un argumento en contra.

### Convertir una grabación

```bash
# Póster (fotograma 1 — cambia -ss para tomar otro momento)
ffmpeg -i grabacion.mov -ss 00:00:00 -frames:v 1 -vf "scale=960:-2" -q:v 3 nombre.jpg

# WebM (el que sirve a casi todos)
ffmpeg -i grabacion.mov -vf "scale=960:-2,fps=24" \
       -c:v libvpx-vp9 -crf 40 -b:v 0 -an nombre.webm

# MP4 (respaldo)
ffmpeg -i grabacion.mov -vf "scale=960:-2,fps=24" \
       -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -an \
       -movflags +faststart nombre.mp4
```

`-an` quita el audio: nadie quiere sonido inesperado, y los navegadores bloquean la
reproducción automática con audio de todos modos.

**Presupuesto de peso:** 4–6 segundos por clip, por debajo de 600 KB. Si un WebM pasa de
1 MB, sube el `-crf` (más compresión) o acorta el clip. Siete clips de 600 KB son 4 MB que
solo se descargan si alguien pasa el cursor — pero si son de 3 MB cada uno, el primer hover
se siente roto.

**Qué grabar:** una transición, no un recorrido. Cuatro segundos de un menú abriéndose con
su animación dicen más que veinte de navegación completa. El clip no es el case study: es
el anzuelo para que lo abran.

### Comportamiento implementado

- **No descarga nada hasta el primer hover** (`preload="none"`). Quien no pase el cursor no
  paga ni un byte por los siete videos.
- **Respeta `prefers-reduced-motion`.** Si el sistema del visitante pide movimiento reducido,
  el clip nunca se reproduce y queda la imagen. Se comprueba en cada hover, no solo al cargar.
- **En táctil no existe.** Sin puntero no hay hover, así que el clip y el rótulo se ocultan
  por completo — anunciar un gesto imposible es peor que no anunciarlo.
- **Rótulo "Hover"** en la esquina de la miniatura, que desaparece al reproducir. Sin él, el
  movimiento queda escondido detrás de un gesto que nadie sabe que debe hacer.

## Añadir el español

La estructura ya lo contempla. Cuando tengas la traducción:

1. Duplica los HTML bajo `es/` conservando los nombres de archivo.
2. Cambia `lang="en"` por `lang="es"` en cada uno.
3. Quita el atributo `hidden` del bloque `.lang-switch` en las páginas que ya tengan par.

## Estado de los marcadores

Nombre, correo, LinkedIn y GitHub ya están puestos. Lo que sigue pendiente:

| Pendiente | Dónde |
|---|---|
| Texto entre `[corchetes]` | About, y sección "What I learned" de cada case study |
| Miniaturas de proyecto | `assets/` + los `<div class="thumb-empty">` de `index.html` |
| Enlaces a prototipos de Figma | `href="#"` en cada case study |

## Tipografía

Las cuatro se cargan desde Google Fonts con el `@import` de `css/style.css`. No hay nada
que autoalojar.

| Uso | Familia |
|---|---|
| Títulos grandes (h1, h2, títulos de tarjeta) | BBH Bartle |
| Etiquetas, navegación, pestañas, h3 | Michroma |
| Cuerpo de texto y botones | Aleo |
| Etiquetas de contribución | Alumni Sans SC itálica |

**Revisa los acentos.** BBH Bartle es una tipografía display; conviene mirar en pantalla
cómo se ven «Kungatá», «El último aliento» y «Urueña». Si algún glifo acentuado no existe
en la familia, el navegador lo sustituye por otra y se nota. Si pasa, esos títulos se
pueden pasar a Michroma cambiando una variable.

---

## 1. Publicar en GitHub Pages

```bash
cd portfolio

git init
git add .
git commit -m "Portafolio: estructura inicial"
git branch -M main
```

Crea un repositorio **público** vacío en GitHub (sin README, sin .gitignore) y conéctalo:

```bash
git remote add origin https://github.com/AlejaUruena/portfolio.git
git push -u origin main
```

Luego, en el repositorio: **Settings → Pages**
- *Source*: `Deploy from a branch`
- *Branch*: `main`, carpeta `/ (root)`
- **Save**

La URL queda en `https://alejauruena.github.io/portfolio/` y tarda 1–2 minutos en aparecer la primera vez.

**Truco:** si nombras el repositorio `AlejaUruena.github.io`, la URL es `https://alejauruena.github.io/` — más limpia para un CV. Solo puedes tener uno así por cuenta.

### Actualizaciones posteriores

```bash
git add .
git commit -m "Añade prototipo X"
git push
```

Pages redespliega solo, en menos de un minuto.

---

## 2. Ver el sitio localmente (antes de publicar)

Abrir `index.html` con doble clic funciona, pero usa el protocolo `file://` y algunas cosas se comportan distinto. Mejor levanta un servidor:

**Opción A — extensión Live Server** (recomendada): instala *Live Server* en VSCode, clic derecho en `index.html` → *Open with Live Server*. Recarga sola al guardar.

**Opción B — línea de comandos:**

```bash
python -m http.server 5500
# → http://localhost:5500
```

---

## 3. Port forwarding en VSCode (compartir el preview temporalmente)

Esto **no reemplaza a GitHub Pages**. Es un túnel temporal a tu `localhost`, útil para que alguien vea un cambio antes de publicarlo.

1. Levanta el servidor local (paso 2).
2. En VSCode, panel inferior → pestaña **PORTS** (junto a Terminal). Si no aparece: `Ctrl+Shift+P` → *Ports: Focus on Ports View*.
3. **Forward a Port** → escribe `5500`.
4. Clic derecho en el puerto → **Port Visibility → Public** (si lo dejas en *Private*, solo tú puedes entrar).
5. Copia la URL `https://xxxx-5500.devtunnels.ms`.

**Limitaciones que debes conocer antes de usarlo para algo importante:**

- La URL muere al cerrar VSCode o apagar el equipo.
- Si el puerto es *Private*, quien entre necesita iniciar sesión con GitHub.
- La URL es larga y poco presentable.
- El tráfico pasa por tu máquina: si tu conexión va lenta, el sitio va lenta.

**Regla práctica:** port forwarding para revisar en pareja o pedir feedback rápido; GitHub Pages para cualquier cosa que vaya en un CV, LinkedIn o una postulación.

---

## Notas de mantenimiento

- **Tema:** todo el color y espaciado sale de las variables en `:root` (`css/style.css`). Cambia ahí y cambia todo el sitio.
- **Añadir un proyecto:** copia `projects/_template-case-study.html`, renómbralo, rellénalo, y duplica una tarjeta en `index.html` apuntando a él.
- **Iconos de herramientas:** son máscaras CSS rellenadas con `currentColor`. Para cambiarles el color, cambia el color del texto de `.tool` en `css/style.css` — no hay que tocar los SVG.
- **GIFs e imágenes:** son lo primero que mira un reclutador. Mantenlos por debajo de ~3 MB o la página tardará en cargar.
- **Sin assets ni información de tu empleador** en ningún archivo de este repositorio. El repo es público.
