#!/usr/bin/env python3
"""Genera el arbol /es/ a partir de las paginas en ingles.

Se traduce TRANSFORMANDO el original en vez de reescribirlo a mano: asi la
estructura, la CSP, los atributos data-cascade, las tarjetas y los videos
quedan identicos entre idiomas, y lo unico que puede divergir es la copia.
Si manana cambia el marcado en ingles, este script se vuelve a correr.

Criterio de traduccion: el de la hoja de vida de Aleja. Lo que ella deja en
ingles (Technical UX/UI Designer, UI design, User flows, Wireframes,
stakeholders, test cases, concept art, writing) se deja; lo que ella traduce
(Diseno, Prototipado, Sistemas de diseno, Experiencia, Proyectos destacados,
Logros, Idiomas) se traduce.
"""
import pathlib, re, sys, html

RAIZ = pathlib.Path('/mnt/user-data/outputs/portfolio')
BASE = 'https://alejauruena.github.io/portfolio/'

# --- copia: cadena exacta en ingles -> espanol ------------------------------
TXT = [
 # <title> y metadatos
 ('<title>Alejandra Urueña — Technical UX/UI Designer</title>',
  '<title>Alejandra Urueña — Technical UX/UI Designer</title>'),
 ('<title>About · Alejandra Urueña</title>', '<title>Sobre mí · Alejandra Urueña</title>'),
 ('<title>Green Code: Play &amp; Learn · Alejandra Urueña</title>',
  '<title>Green Code: Play &amp; Learn · Alejandra Urueña</title>'),

 # navegacion y accesibilidad
 ('>Skip to content<', '>Saltar al contenido<'),
 ('<span class="nav-role">Technical UX/UI Designer</span>',
  '<span class="nav-role">Technical UX/UI Designer</span>'),

 # hero
 ('Designs that tell stories', 'Diseños que cuentan historias'),
 ('I design experiences that connect with people, and bring them to life with development.',
  'Diseño experiencias que conectan con las personas, y las construyo con código.'),
 ("Hi there, I'm Ale, Technical Designer specializing in UX/UI for digital media and games.",
  'Hola, soy Ale, Technical Designer especializada en UX/UI para medios digitales y videojuegos.'),
 ('Have a game, website, or interactive experience you need to level up with design and code? I got you.',
  '¿Tienes un juego, un sitio web o una experiencia interactiva que necesite subir de nivel con diseño y código? Yo te ayudo.'),
 ('data-enter="product">Digital Product</a>', 'data-enter="product">Producto Digital</a>'),
 ('data-enter="games">Games</a>', 'data-enter="games">Videojuegos</a>'),

 # seccion de proyectos
 ('<h2 class="section-title">Selected work</h2>', '<h2 class="section-title">Proyectos destacados</h2>'),
 ('aria-label="Project verticals"', 'aria-label="Verticales de proyecto"'),
 ('        Digital Product\n', '        Producto Digital\n'),
 ('        Games\n', '        Videojuegos\n'),
 ('<span class="p-kind">Solo Project</span>', '<span class="p-kind">Proyecto individual</span>'),
 ('<span class="p-kind">Team Project</span>', '<span class="p-kind">Proyecto en equipo</span>'),
 ('<span class="p-kind">Case Study</span>', '<span class="p-kind">Case Study</span>'),
 ('<span class="p-more">Read more <span class="p-more-arrow" aria-hidden="true">&#8594;</span></span>',
  '<span class="p-more">Ver más <span class="p-more-arrow" aria-hidden="true">&#8594;</span></span>'),

 # tarjetas
 ('In this gamified map app for the interactive science and technology museum Maloka, I collaborated with UI Art and Prototypes to help families find the exhibits quicker.',
  'En esta app de mapa gamificada para el museo interactivo de ciencia y tecnología Maloka, colaboré con UI Art y prototipos para que las familias encuentren las salas más rápido.'),
 ('For this lovecraftian-inspired app, I designed and prototyped UI to solve pain points in table top RPG players’ journey.',
  'Para esta app de inspiración lovecraftiana diseñé y prototipé la UI para resolver puntos de fricción en el recorrido de quienes juegan rol de mesa.'),
 ("I created unique iconography and followed the client's visual identity in a website tailored with responsive design. The goal was to take a fictional corporation and bring it to life.",
  'Creé iconografía propia y seguí la identidad visual del cliente en un sitio construido con diseño responsive. La meta era tomar una corporación ficticia y traerla a la vida.'),
 ('To promote appreciation for the neurodivergence spectrum, I cooperated with Paper Prototyping and UI Implementation to create this interactive arduino experience.',
  'Para promover el aprecio por el espectro de la neurodivergencia, aporté prototipado en papel e implementación de UI en esta experiencia interactiva con Arduino.'),
 ('For this educational mobile and desktop app, I prototyped UX improvements for a new level editor feature. I also collaborated closely with the client &amp; production to redesign game mechanics within a block-based programming language that teaches computational thinking to children and teenagers.',
  'Para esta app educativa de móvil y escritorio prototipé mejoras de UX para una nueva función de editor de niveles. También trabajé de cerca con el cliente y producción para rediseñar mecánicas dentro de un lenguaje de programación por bloques que enseña pensamiento computacional a niñas, niños y adolescentes.'),
 ('For this project, I took on a challenge to improve the navigation and usability on the HUD, Pause and Main Menu screens while modernizing the iconic original style.',
  'En este proyecto asumí el reto de mejorar la navegación y la usabilidad del HUD, la pausa y el menú principal, modernizando el estilo original sin perder su identidad.'),
 ('In this action-based roguelike I designed game mechanics, implemented menus &amp; dynamic UI, and developed Enemy AI, dialogue systems and object interaction in Unity.',
  'En este roguelike de acción diseñé mecánicas, implementé menús y UI dinámica, y desarrollé IA de enemigos, sistemas de diálogo e interacción con objetos en Unity.'),
 ('Paper prototyping', 'Prototipado en papel'),
 ('GenAI Placeholders', 'Placeholders con GenAI'),
 ('UX flows', 'User flows'),
 ('Prototyping', 'Prototipado'),
 ('[ poster pending ]', '[ miniatura pendiente ]'),

 # contacto
 ('<h2 class="section-title">See anything you like?</h2>', '<h2 class="section-title">¿Te gusta lo que ves?</h2>'),
 ("<p class=\"contact-line\">Let's have a chat!</p>", '<p class="contact-line">¡Hablemos!</p>'),
 ('<label for="cf-name">Name</label>', '<label for="cf-name">Nombre</label>'),
 ('<label for="cf-email">Email</label>', '<label for="cf-email">Correo</label>'),
 ('<label for="cf-msg">Message</label>', '<label for="cf-msg">Mensaje</label>'),
 ('>Send message</button>', '>Enviar mensaje</button>'),
 ('value="New message from your portfolio"', 'value="Nuevo mensaje desde tu portafolio (ES)"'),

 # about
 ('<h2 class="section-title">About me</h2>', '<h2 class="section-title">Sobre mí</h2>'),
 ("I'm based in Bogotá, Colombia, where I earned my Bachelor's degree in\n          Interaction Design.",
  'Vivo en Bogotá, Colombia, donde me gradué de Diseño Interactivo.'),
 ("I've worked professionally in game development, web building, and QA testing,\n          which sharpened how I read user and player psychology. Now, I bring that same\n          criteria and design thinking to how I design interfaces, prioritizing\n          functionality while maintaining a strong visual identity.",
  'He trabajado profesionalmente en desarrollo de videojuegos, construcción web y QA,\n          lo que afinó mi lectura de la psicología del usuario y del jugador. Hoy llevo\n          ese mismo criterio al diseño de interfaces, priorizando la funcionalidad sin\n          renunciar a una identidad visual fuerte.'),
 ('>Download resume</a>', '>Descargar CV</a>'),
 ('<h3>Latest focus</h3>', '<h3>En lo que ando ahora</h3>'),
 ('I have an open mindset towards AI integration and am currently exploring best\n          practices for using it in implementation workflows for pipeline automation.',
  'Tengo una mirada abierta a la integración de IA y estoy explorando buenas prácticas\n          para usarla en flujos de implementación y automatización de pipeline.'),
 ('<summary>Click to read some fun facts!</summary>', '<summary>¡Algunos datos sueltos sobre mí!</summary>'),
 ('Outside of work, I love spending my time playing the drums, gaming,\n            overanalyzing movies, and making art &amp; DIY projects.',
  'Fuera del trabajo me gusta tocar batería, jugar, sobreanalizar películas y hacer\n            arte y proyectos DIY.'),
 ("<p>You'll usually find me in game jams!</p>", '<p>Casi siempre me encuentras en alguna game jam.</p>'),
 ("<p>I'm really into video editing and fanart…</p>", '<p>Me gusta mucho la edición de video y el fanart…</p>'),
 ('<h3>Design skills</h3>', '<h3>Habilidades de diseño</h3>'),
 ('<h3>Technical range</h3>', '<h3>Herramientas y tecnologías</h3>'),
 ('<h3>Languages</h3>', '<h3>Idiomas</h3>'),
 ('<li>User flows</li>', '<li>User flows</li>'),
 ('<li>Information Architecture</li>', '<li>Arquitectura de información</li>'),
 ('<li>Wireframing</li>', '<li>Wireframes</li>'),
 ('<li>Prototyping</li>', '<li>Prototipado</li>'),
 ('<li>UI Design Systems</li>', '<li>Sistemas de diseño</li>'),
 ('<li>UX Writing</li>', '<li>UX Writing</li>'),
 ('<li>Illustration</li>', '<li>Ilustración</li>'),
 ('<li>Spanish &mdash; Native</li>', '<li>Español &mdash; Nativo</li>'),
 ('<li>English &mdash; C1</li>', '<li>Inglés &mdash; C1</li>'),

 # footer / varios
 ('aria-label="Email"', 'aria-label="Correo"'),
 ('&copy; <span id="year">2026</span> Alejandra Urueña',
  '&copy; <span id="year">2026</span> Alejandra Urueña'),
]


# --- case study Green Code --------------------------------------------------
TXT += [
 ('Designing a level editor for a game that teaches programming.',
  'Diseñar un editor de niveles para un juego que enseña a programar.'),
 ('<span class="k">Contribution</span>', '<span class="k">Aporte</span>'),
 ('<span class="k">Studio</span>', '<span class="k">Estudio</span>'),
 ('<span class="k">Scope</span>', '<span class="k">Alcance</span>'),
 ('<span class="k">Platforms</span>', '<span class="k">Plataformas</span>'),
 ('<span class="v">UX flows · mechanic design · prototyping · UX writing</span>',
  '<span class="v">User flows · diseño de mecánicas · prototipado · UX writing</span>'),
 ('<span class="v">Mobile, desktop and web</span>', '<span class="v">Móvil, escritorio y web</span>'),
 ("UI art and iconography were produced by a separate department.\n      Published with the studio's permission.",
  'El UI art y la iconografía los produjo otro departamento.\n      Publicado con permiso del estudio.'),
 ('<a class="back-link" href="../index.html?v=games#work">← Back to work</a>',
  '<a class="back-link" href="../index.html?v=games#work">← Volver a proyectos</a>'),

 ('<h2>Context</h2>', '<h2>Contexto</h2>'),
 ('Green Code is a cross-platform app that teaches programming fundamentals through play,\n        framed around environmental themes. Players solve challenges by chaining actions into a\n        sequence of action blocks, by decomposing a task into smaller ones, or by finding an\n        error in a block sequence.',
  'Green Code es una app multiplataforma que enseña fundamentos de programación jugando,\n        con una temática ambiental. Quien juega resuelve retos encadenando acciones en una\n        secuencia de bloques, descomponiendo una tarea en otras más pequeñas, o encontrando\n        el error dentro de una secuencia.'),
 ("I was brought in to test and improve the user experience design of a level editor, which\n        came with the opportunity to fix some mechanics that the editor's logic broke.",
  'Entré a probar y mejorar el diseño de experiencia de un editor de niveles, y eso trajo\n        de paso la oportunidad de arreglar algunas mecánicas que la lógica del editor rompía.'),

 ('<h2>The player becomes the author</h2>', '<h2>Quien juega pasa a ser quien crea</h2>'),
 ('An important insight I got while testing was that, until the editor, the player had to\n        solve pre-designed challenges with static written instructions. Now, the same player who\n        becomes a level creator has to make their own instructions and grids, and make sure the\n        challenge is solvable for other players by solving it themselves first.',
  'Un hallazgo importante de las pruebas fue que, hasta el editor, quien jugaba resolvía\n        retos ya diseñados con instrucciones escritas fijas. Ahora esa misma persona, al crear\n        un nivel, tiene que escribir sus propias instrucciones, armar la grilla y asegurarse de\n        que el reto sea resoluble para los demás resolviéndolo ella primero.'),
 ('This called for a task to reverse-engineer the experience, where the design approach was\n        finding the best way to give the player a usable and diverse level toolset — with all\n        game attributes, hazards and action blocks — to create with.',
  'Eso obligó a hacer ingeniería inversa de la experiencia: el enfoque de diseño fue\n        encontrar la mejor forma de entregar un kit de creación usable y variado, con todos los\n        atributos del juego, los peligros y los bloques de acción.'),

 ('<h2>Design decisions</h2>', '<h2>Decisiones de diseño</h2>'),
 ('After analysing the initial state of the editor with a user journey, a few decisions were\n        made, prototyped, pitched and deployed:',
  'Tras analizar el estado inicial del editor con un user journey, se tomaron, prototiparon,\n        presentaron y desplegaron varias decisiones:'),
 ('<strong>An icon-based, categorised, collapsible inventory</strong>, which replaced a\n          long scrollable list of more than a hundred items. Linear searching became efficient\n          searching. This shipped for the action blocks; the hazard inventory iterated to a\n          second solution and eventually shipped as a text-only dropdown.',
  '<strong>Un inventario por iconos, categorizado y plegable</strong>, que reemplazó una\n          lista scrolleable de más de cien elementos. La búsqueda lineal pasó a ser búsqueda\n          eficiente. Se implementó para los bloques de acción; el inventario de peligros iteró\n          a una segunda solución y terminó saliendo como un desplegable de solo texto.'),
 ('<strong>A delete-whole-answer button</strong>, because clearing a long answer tile by\n          tile punishes the experimentation an editor exists to encourage. This was implemented\n          and adopted across the whole game.',
  '<strong>Un botón para borrar la respuesta completa</strong>, porque limpiar una\n          respuesta larga ficha por ficha castiga justo la experimentación que un editor existe\n          para fomentar. Se implementó y se adoptó en todo el juego.'),
 ('<strong>Personalisation settings selected by the level creator</strong> — categorised\n          by ecosystem, by difficulty (basic to advanced action blocks), by creative or realistic\n          mode, and by algorithmic or decomposing — so players picked their tools beforehand,\n          solving saturation from the start.',
  '<strong>Ajustes de personalización que elige quien crea el nivel</strong>: por\n          ecosistema, por dificultad (de bloques básicos a avanzados), por modo creativo o\n          realista, y por algorítmico o de descomposición. Así se eligen las herramientas desde\n          el principio y se resuelve la saturación de entrada.'),
 ("<strong>Grid pinpoints for the action requirement inventory</strong>, so the level\n          creator could select and see where their required block actions sat on the grid instead\n          of re-reading the generated instructions on every edit. This also let players solve the\n          same created challenge with different answers, since the action requirements didn't\n          call for a mandatory order.",
  '<strong>Marcadores en la grilla para el inventario de acciones requeridas</strong>, para\n          poder seleccionar y ver dónde quedan las acciones exigidas sin releer las instrucciones\n          generadas en cada edición. Esto además permitió resolver un mismo reto con respuestas\n          distintas, porque las acciones requeridas no exigían un orden obligatorio.'),
 ('Other proposals were set aside to get the editor shipped. They are still in the user\n        flows. The art department made the final art and icons for the UI.',
  'Otras propuestas se dejaron de lado para sacar el editor a tiempo; siguen en los user\n        flows. El arte y los iconos finales de la UI los hizo el departamento de arte.'),
 ('[ editor inventory — before / after — 1600×900 ]', '[ inventario del editor — antes / después — 1600×900 ]'),
 ('The action block inventory: scrollable list versus categorised, collapsible grid.',
  'El inventario de bloques de acción: lista scrolleable contra grilla categorizada y plegable.'),

 ('<h2>Game design tasks</h2>', '<h2>Tareas de game design</h2>'),
 ('Since the original levels had previously written instructions, we created a system where\n        each required action block carries a phrase, and the blocks a level creator picks\n        concatenate into the instruction the next player reads. I wrote that system so it would\n        hold for any combination.',
  'Como los niveles originales tenían instrucciones escritas de antemano, creamos un sistema\n        donde cada bloque de acción requerido carga una frase, y los bloques que elige quien crea\n        el nivel se concatenan en la instrucción que leerá la siguiente persona. Escribí ese\n        sistema para que funcionara con cualquier combinación.'),
 ('<h3>Redesigning a game mechanic</h3>', '<h3>Rediseñar una mecánica</h3>'),
 ('During development, the clients came with a new dilemma: an existing mechanic stopped\n        making sense. The action block <em>Plant</em> had been designed for levels with fixed\n        crops, and for the level editor the crops were replaced with one soil block and one water\n        block. After reviewing the user journey and the as-is / to-be flows, I realised that the\n        level creator had to learn how to use <em>Plant</em> all over again, without a context.',
  'Durante el desarrollo, el cliente llegó con un dilema nuevo: una mecánica existente dejó\n        de tener sentido. El bloque <em>Plantar</em> se había diseñado para niveles con cultivos\n        fijos, y en el editor los cultivos se reemplazaron por un bloque de tierra y uno de agua.\n        Tras revisar el user journey y los flujos as-is / to-be, vi que quien creaba un nivel\n        tenía que volver a aprender a usar <em>Plantar</em>, y sin contexto.'),
 ('To ease that confusion I created a crop selection system, grouped by crop family, crop\n        type and ecosystem, making sure the editor opened to every crop the player was already\n        familiar with. After a few rounds with the client to settle which groups shipped, the\n        first part was ready.',
  'Para resolver esa confusión creé un sistema de selección de cultivos, agrupado por familia,\n        tipo y ecosistema, asegurando que el editor abriera con todos los cultivos que ya le eran\n        familiares a quien jugaba. Tras varias rondas con el cliente para fijar qué grupos salían,\n        la primera parte quedó lista.'),
 ('<h3>Making it fun</h3>', '<h3>Que además sea divertido</h3>'),
 ('Harder levels needed to explore different challenges. Following the plant redesign, on\n        medium and hard levels I added units per crop to the action requirements, to encourage\n        level creators to use loops in their algorithmic levels and make them more challenging\n        for other players.',
  'Los niveles difíciles necesitaban explorar retos distintos. Después del rediseño de\n        plantar, en los niveles medio y difícil añadí unidades por cultivo a las acciones\n        requeridas, para incentivar el uso de bucles en los niveles algorítmicos y hacerlos más\n        retadores para los demás.'),
 ("Once those changes were in, I refined production's new scoring base for player-created\n        levels into a system weighting answer match, length, response time, attempts and level\n        difficulty. That score feeds a leaderboard where players see the global and regional top\n        scores for the levels they solved, created by other players.",
  'Con esos cambios dentro, refiné la base de puntaje que producción propuso para los niveles\n        creados por jugadores, convirtiéndola en un sistema que pondera coincidencia de la\n        respuesta, longitud, tiempo, intentos y dificultad. Ese puntaje alimenta un leaderboard\n        con los mejores resultados globales y regionales de los niveles resueltos.'),
 ('Finally, once everything in the level editor worked, I authored a set of levels made with\n        the editor for a <em>Recommended levels</em> tab, so level creators learn the tool\u2019s range\n        by playing rather than by reading.',
  'Por último, cuando todo el editor funcionaba, escribí una tanda de niveles hechos con la\n        herramienta para una pestaña de <em>Niveles recomendados</em>, para que el alcance del\n        editor se aprenda jugando y no leyendo.'),
 ('[ crop selection system — 1600×900 ]', '[ sistema de selección de cultivos — 1600×900 ]'),
 ('Crop selection grouped by family, type and ecosystem.',
  'Selección de cultivos agrupada por familia, tipo y ecosistema.'),

 ('<h2>Learning from the player, and helping the player learn</h2>',
  '<h2>Aprender de quien juega, y ayudarle a aprender</h2>'),
 ('This project was a great way to explore how to give users as much freedom as possible and\n        still keep the experience immersive and easy to use. I enjoyed working with the\n        development team and the client to make it better and more memorable — I even had the\n        opportunity to talk about our work live.',
  'Este proyecto fue una gran forma de explorar cómo dar la mayor libertad posible sin perder\n        inmersión ni facilidad de uso. Disfruté trabajar con el equipo de desarrollo y con el\n        cliente para hacerlo mejor y más memorable; incluso tuve la oportunidad de hablar de\n        nuestro trabajo en vivo.'),
 ("What I take from it is to always prioritise the user's mind and capability, keeping their\n        intuition and knowledge on hand to tailor designs they not only need but also enjoy.",
  'Me llevo la idea de priorizar siempre la mente y la capacidad de quien usa el producto,\n        teniendo su intuición y su conocimiento a mano para diseñar algo que no solo necesite,\n        sino que además disfrute.'),

 ('aria-label="Keep browsing"', 'aria-label="Seguir navegando"'),
 ('>← Back to Games</a>', '>← Volver a Videojuegos</a>'),
 ('>Go to Digital Product</a>', '>Ir a Producto Digital</a>'),
 # el CV: cada version del sitio entrega el suyo
 ('href="../assets/CV_AlejandraUruena_Tech_UXUI_Designer.pdf"',
  'href="../assets/CV_AlejandraUruena_Tech_UXUI_Designer_es.pdf"'),
 ('download="CV_AlejandraUruena_Tech_UXUI_Designer.pdf"',
  'download="CV_AlejandraUruena_Tech_UXUI_Designer_es.pdf"'),
]


# --- ajustes de ruta, por profundidad --------------------------------------
def reprofundizar(s, extra):
    """Las paginas /es/ cuelgan un nivel mas abajo, asi que cada ruta relativa
       gana un ../ . UNA sola sustitucion con regex, no varias encadenadas: con
       reglas sucesivas, "css/ -> "../css/ y acto seguido "../css/ -> "../../css/,
       y la ruta sale con un nivel de mas."""
    if not extra:
        return s
    patron = re.compile(r'(["\'])((?:\.\./)*)(css/|js/|assets/|favicon\.ico)')
    return patron.sub(lambda m: m.group(1) + extra + m.group(2) + m.group(3), s)

def conmutador(s, href_en):
    """ES pasa a ser el idioma actual; EN se vuelve el enlace de vuelta."""
    m = re.search(r'<div class="lang-switch"[^>]*>.*?</div>', s, re.S)
    assert m, 'no encontre el conmutador'
    viejo = m.group(0)
    nuevo = ('<div class="lang-switch">\n'
             '        <a href="%s" hreflang="en">EN</a>\n'
             '        <span aria-current="true">ES</span>\n'
             '      </div>' % href_en)
    return s.replace(viejo, nuevo, 1)

def alternas(s, ruta_en, ruta_es):
    """hreflang: le dice a un buscador que son la misma pagina en dos idiomas.
       Idempotente: borra las alternas que ya hubiera antes de poner las suyas,
       para que volver a correr el script no las duplique."""
    s = re.sub(r'\n*<link rel="alternate" hreflang="[^"]*" href="[^"]*">', '', s)
    s = re.sub(r'\n{3,}</head>', '\n</head>', s)
    tags = ('\n<link rel="alternate" hreflang="en" href="%s%s">\n'
            '<link rel="alternate" hreflang="es" href="%s%s">\n'
            '<link rel="alternate" hreflang="x-default" href="%s%s">' % (BASE, ruta_en, BASE, ruta_es, BASE, ruta_en))
    return s.replace('</head>', tags + '\n</head>', 1)

NAV = {'Work': 'Proyectos', 'About': 'Sobre mí', 'Contact': 'Contacto'}

def navegacion(s):
    """El nav tiene tres variantes de href segun la profundidad de la pagina
       (#work, index.html#work, ../index.html#work). Se traduce el TEXTO del
       enlace, no el <li> completo, para cubrirlas todas de una vez."""
    for en, es in NAV.items():
        s = re.sub(r'(<li><a href="[^"]*">)' + en + r'(</a></li>)', r'\1' + es + r'\2', s)
    return s

def traducir(s):
    s = navegacion(s)
    for o, n in TXT:
        if o in s:
            s = s.replace(o, n)
    return s

PAGINAS = [
 ('index.html',               'es/index.html',               '../',   '../index.html',               'index.html',               'es/index.html'),
 ('about.html',               'es/about.html',               '../',   '../about.html',               'about.html',               'es/about.html'),
 ('projects/green-code.html', 'es/projects/green-code.html', '../',   '../../projects/green-code.html', 'projects/green-code.html', 'es/projects/green-code.html'),
]

for origen, destino, extra, href_en, ruta_en, ruta_es in PAGINAS:
    raw = (RAIZ / origen).read_bytes().decode('utf-8')
    crlf = '\r\n' in raw
    s = raw.replace('\r\n', '\n')
    s = s.replace('<html lang="en">', '<html lang="es">', 1)
    s = reprofundizar(s, extra)
    s = conmutador(s, href_en)
    s = alternas(s, ruta_en, ruta_es)
    s = traducir(s)
    d = RAIZ / destino
    d.parent.mkdir(parents=True, exist_ok=True)
    d.write_bytes((s.replace('\n', '\r\n') if crlf else s).encode('utf-8'))
    print('  ', destino)

# --- el lado ingles: destapar el conmutador y declarar la alterna ----------
for origen, _, _, _, ruta_en, ruta_es in PAGINAS:
    p = RAIZ / origen
    raw = p.read_bytes().decode('utf-8'); crlf = '\r\n' in raw
    s = raw.replace('\r\n', '\n')
    s = s.replace('<div class="lang-switch" hidden>', '<div class="lang-switch">', 1)
    s = s.replace('<span aria-current="true">EN</span>', '<span aria-current="true">EN</span>', 1)
    s = s.replace('<!-- Language switch. Unhide once /es/ exists; the ES entry becomes a link. -->',
                  '<!-- Language switch. /es/ ya existe: el enlace ES lleva a la misma pagina traducida. -->', 1)
    s = alternas(s, ruta_en, ruta_es)
    p.write_bytes((s.replace('\n', '\r\n') if crlf else s).encode('utf-8'))
    print('   EN actualizado:', origen)
