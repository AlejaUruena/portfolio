# Fuentes auto-hospedadas

## bbh-bartle-extended.woff2

BBH Bartle (© 2025 The BBH Project Authors, https://github.com/Studio-DRAMA/BBH),
**modificada**. Licencia SIL Open Font License 1.1 — texto completo en `OFL.txt`.
El aviso de copyright original no declara Reserved Font Name, así que la versión
modificada puede conservar el nombre de la familia.

### Qué se le cambió y por qué

La versión que sirve Google tiene 121 glifos, solo ASCII: no trae ñ, ni vocales
acentuadas, ni los signos de apertura ¿ ¡. En las páginas de `/es/` el navegador
resolvía esos caracteres con la siguiente fuente de la pila, así que un titular
salía con una letra de otra tipografía en medio — distinto grosor, distinta
anchura, y la tilde descuadrando la altura de línea.

Se añadieron 16 glifos: `ñÑ áéíóúÁÉÍÓÚ üÜ ¿¡`. Ninguno se dibujó de cero; todos
se derivan de formas que ya estaban en la fuente, para que conserven su grosor y
su carácter:

| Glifo | De dónde sale |
|---|---|
| ñ Ñ | `asciitilde` colocada sobre la n |
| á é í ó ú (y mayúsculas) | `grave` espejado horizontalmente = acento agudo |
| ü Ü | dos `period` escalados al 70% |
| ¿ ¡ | `question` y `exclam` rotados 180° |

### Cómo regenerarla

    python3 tools/extender-fuente.py <bbh-bartle-original.woff2> assets/fonts/bbh-bartle-extended.woff2

El original se obtiene con `npm pack @fontsource/bbh-bartle`.

### Por qué está auto-hospedada

Una fuente modificada no la puede servir Google. Como efecto secundario, esta
familia ya no sale de `fonts.googleapis.com`: una petición menos a un tercero.
Las otras tres familias (Michroma, Aleo, Alumni Sans SC) siguen viniendo de
Google — auto-hospedarlas también sigue pendiente.
