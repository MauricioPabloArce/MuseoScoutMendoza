# Prompt maestro para Google Antigravity — Museo Scout Mendoza

## Rol y objetivo

Actuá como arquitecto de software senior, desarrollador full-stack, diseñador UX/UI, especialista en bases de datos, seguridad, testing y Git. Tu misión es construir desde cero una aplicación web completa para la gestión del acervo del Museo Scout Mendoza y, al mismo tiempo, un sitio público para visitantes.

No hagas solamente un prototipo visual. Debe quedar una aplicación funcional de punta a punta, ejecutándose en un servidor local, con base de datos local persistente, autenticación, permisos, panel administrativo, catálogo, piezas, campos dinámicos, dashboard, pruebas y documentación.

Trabajá de forma autónoma hasta dejar cada etapa funcional y verificable. Antes de implementar, inspeccioná las skills/herramientas disponibles y utilizá las que correspondan para arquitectura, frontend, backend, base de datos, autenticación, seguridad, pruebas, navegador y Git.

## Repositorio obligatorio

Usar exclusivamente este repositorio para el proyecto:

`https://github.com/MauricioPabloArce/MuseoScoutMendoza.git`

Reglas de Git:

1. Clonar el repositorio si todavía no existe localmente.
2. Verificar que `origin` apunte exactamente al repositorio indicado.
3. Mantener `main` como rama estable.
4. Crear una rama de trabajo, por ejemplo `develop` o `feature/initial-platform`.
5. Hacer commits pequeños, claros y frecuentes.
6. Subir al repositorio una copia funcional luego de cada hito estable importante.
7. No hacer force-push sobre `main`.
8. Nunca subir secretos, credenciales, tokens OAuth ni archivos `.env` reales.
9. Mantener `.env.example`, README, documentación de instalación y migraciones actualizados.
10. Antes de finalizar cada hito, ejecutar pruebas y comprobar la aplicación en navegador.

## Stack técnico preferido

Elegí versiones estables y compatibles al momento de implementar. Como arquitectura preferida usar:

- Next.js con TypeScript.
- React.
- Tailwind CSS.
- shadcn/ui o componentes equivalentes accesibles.
- Prisma ORM.
- SQLite como base de datos local inicial.
- Auth.js / NextAuth o solución estable equivalente para Google OAuth.
- Zod para validación de datos.
- React Hook Form para formularios cuando resulte conveniente.
- Recharts u otra librería mantenida para los gráficos del dashboard.
- Vitest/Jest para pruebas unitarias y Playwright para pruebas end-to-end.

La arquitectura debe permitir migrar posteriormente de SQLite a PostgreSQL sin tener que rediseñar el dominio completo.

Crear también una abstracción para archivos/imágenes: en desarrollo deben poder almacenarse localmente; la arquitectura tiene que permitir reemplazar ese almacenamiento en producción por S3, Cloudflare R2 u otro almacenamiento compatible sin modificar la lógica de piezas.

## Reglas generales de arquitectura

- Separar claramente UI, lógica de negocio, autorización, acceso a datos y almacenamiento de archivos.
- Todas las operaciones sensibles deben validarse del lado servidor. No confiar únicamente en ocultar botones en el frontend.
- Implementar auditoría básica: quién creó y quién modificó una pieza, categoría, campo o permiso, junto con fecha/hora.
- Usar soft-delete o archivado para entidades importantes cuando sea conveniente, evitando pérdida accidental del acervo.
- La interfaz debe estar en español.
- Diseño responsive para escritorio, tablet y móvil.
- Priorizar claridad, velocidad y facilidad de uso para personas que no sean técnicas.

# 1. Dos áreas claramente separadas

La aplicación debe tener dos experiencias:

### Área pública

Para visitantes del Museo Scout Mendoza.

Debe permitir:

- Página de inicio institucional.
- Explorar el acervo por categorías y subcategorías.
- Navegar una jerarquía de categorías de cualquier profundidad.
- Buscar piezas por texto.
- Ver ficha pública de cada pieza.
- Mostrar fotografías de las piezas.
- Mostrar solamente categorías y piezas autorizadas para publicación.
- No mostrar campos internos o privados.
- URLs amigables mediante slug.
- Breadcrumbs para saber en qué nivel del acervo se encuentra el visitante.

### Área de gestión

Debe requerir autenticación y permisos.

Menú sugerido:

- Dashboard.
- Acervo / Piezas.
- Categorías.
- Campos generales.
- Usuarios y equipo.
- Permisos.
- Configuración del museo.
- Configuración del código de registro.
- Auditoría, si se implementa como pantalla independiente.

# 2. Categorías y subcategorías ilimitadas

Este punto es crítico.

No crear tablas separadas para categoría, subcategoría, sub-subcategoría, etc. Implementar una estructura recursiva de árbol con una sola entidad `Category` que tenga una referencia opcional a `parentId`.

Debe soportar una cantidad ilimitada de niveles conceptualmente.

Ejemplo:

- Insignias
  - Argentina
    - Scouts de Argentina
      - Distrito 2
        - Grupo Scout 252
- Uniformes
  - Camisas
  - Pañuelos
- Documentos
  - Libros
  - Revistas

Cada categoría debe permitir al menos:

- ID.
- Nombre.
- Slug.
- Descripción.
- Categoría padre opcional.
- Orden de visualización.
- Imagen opcional.
- Activa/archivada.
- Publicar en sitio público: sí/no.
- Prefijo de registro de 2 letras calculado inicialmente a partir del nombre y editable únicamente bajo reglas controladas.
- Fechas de creación/modificación.
- Usuario creador/modificador.

La administración de categorías debe ofrecer una vista de árbol cómoda, con expandir/contraer y posibilidad de crear un hijo desde cualquier nodo.

## Regla para asignar piezas

Una pieza solamente puede asignarse a una categoría hoja, es decir, una categoría que no tenga subcategorías.

Si una categoría ya contiene piezas y posteriormente el administrador intenta crearle una subcategoría, el sistema debe impedir la operación o solicitar que primero se reubiquen las piezas. No permitir que una misma categoría tenga simultáneamente piezas directas y subcategorías.

Si se intenta mover una categoría dentro de uno de sus propios descendientes, bloquear la operación para evitar ciclos.

# 3. Campos dinámicos configurables

El sistema no debe tener una ficha rígida para todas las piezas.

Debe existir un constructor de campos similar conceptualmente a Google Forms.

Habrá dos clases de campos:

### A. Campos generales del museo

Son campos definidos por un administrador que pueden aplicarse a todas las piezas del museo.

Cada campo general debe permitir configurar:

- Nombre visible.
- Clave interna estable.
- Descripción/ayuda.
- Tipo de campo.
- Activo/inactivo.
- Obligatorio sí/no.
- Visible públicamente sí/no.
- Visible internamente sí/no.
- Buscable sí/no.
- Filtrable sí/no cuando el tipo lo permita.
- Orden.
- Valor predeterminado opcional.
- Validaciones específicas.

### B. Campos específicos de categoría

Cada categoría hoja debe poder tener su propia configuración de campos adicionales.

Ejemplo:

`Insignias > Argentina` puede tener:

- Organización.
- Año aproximado.
- Material.
- Forma.
- Medidas.
- Tipo de fijación.

Mientras que `Documentos > Libros` puede tener:

- Autor.
- Editorial.
- Año de edición.
- ISBN.
- Número de páginas.

Los campos específicos se configuran en la categoría hoja y se muestran al crear o editar una pieza de esa categoría.

## Tipos de campo mínimos

Implementar como mínimo:

1. Texto corto.
2. Texto largo / párrafo.
3. Número entero.
4. Número decimal.
5. Moneda opcional.
6. Fecha.
7. Hora.
8. Fecha y hora.
9. Email.
10. URL.
11. Sí/No.
12. Lista desplegable de una opción.
13. Opción única / radio.
14. Selección múltiple / checkboxes.
15. Etiquetas múltiples.
16. Archivo.
17. Imagen.
18. Galería de imágenes.

Para listas, radios y checkboxes debe existir un editor de opciones con orden configurable.

No borrar físicamente de forma destructiva un campo que ya tenga información histórica sin advertencia. Preferir archivarlo/desactivarlo.

# 4. Modelo de piezas del museo

Crear una entidad principal `MuseumPiece`.

Datos estructurales mínimos que debe tener toda pieza independientemente de los campos dinámicos:

- ID interno.
- Código de registro único.
- Categoría hoja.
- Título o denominación de la pieza.
- Imagen principal opcional.
- Estado: borrador / publicado / archivado, o modelo equivalente.
- Fecha de registro en el sistema.
- Creado por.
- Modificado por.
- Fecha de creación.
- Fecha de última modificación.

Los demás datos deben provenir del sistema de campos generales y específicos.

La ficha debe combinar automáticamente:

`campos estructurales + campos generales activos + campos específicos de la categoría hoja`.

Los valores dinámicos deben guardarse en una arquitectura mantenible. Elegir un modelo que permita validación, búsquedas y futuras migraciones. Evitar una solución improvisada que vuelva imposible filtrar o evolucionar el esquema.

# 5. Código único de registro de las piezas

Todas las piezas, sin excepción, deben poseer un código de registro único generado automáticamente por el servidor.

Debe existir una pantalla de configuración global del museo para definir el formato del código.

El formato debe ser configurable, pero obligatoriamente tiene que contener:

- Las dos primeras letras/prefijo de la categoría correspondiente.
- El año de registro.
- Un número secuencial.

Formato inicial recomendado:

`{CAT2}-{YEAR}-{SEQ}`

Ejemplo:

`IN-2026-000001`

Para una categoría llamada `Insignias`, `CAT2` será `IN`.

Si la siguiente pieza pertenece a `Uniformes`, y el secuencial es global para el museo, podría quedar:

`UN-2026-000002`

## Configuración permitida

El administrador debe poder configurar:

- Separador: `-`, `/`, `.`, etc.
- Longitud del secuencial, por ejemplo 4, 5, 6 u 8 dígitos.
- Uso de año de 2 o 4 dígitos.
- Reinicio del secuencial: nunca o cada año.
- Vista previa del resultado antes de guardar la configuración.

Los tokens `CAT2`, `YEAR` y `SEQ` son obligatorios y no deben poder eliminarse del patrón.

El código debe generarse dentro de una transacción segura y de manera atómica para impedir códigos duplicados aunque dos usuarios creen piezas al mismo tiempo.

Una vez asignado a una pieza, el código no debe modificarse automáticamente si más adelante cambia el nombre de la categoría. El código forma parte del registro histórico de la pieza.

El prefijo `CAT2` debe almacenarse en la categoría. Al crear una categoría, proponer automáticamente las dos primeras letras alfabéticas en mayúsculas, sin acentos ni símbolos. El administrador debe poder corregirlo antes de que la categoría posea piezas. Validar conflictos y advertir si dos categorías usan el mismo prefijo.

# 6. Usuarios, inicio de sesión con Google y equipo del museo

Los visitantes pueden navegar el sitio público sin iniciar sesión.

Los usuarios deben poder registrarse/iniciar sesión mediante Google OAuth utilizando una cuenta de Gmail/Google.

Después del primer login, crear el usuario interno correspondiente.

Roles mínimos:

### Usuario registrado

- Tiene cuenta.
- No obtiene automáticamente permisos de edición del museo.

### Colaborador

- Forma parte del equipo del museo.
- Solo puede trabajar en las categorías/subcategorías que un administrador le haya asignado.

### Administrador

- Acceso total al área de gestión.
- Gestiona usuarios, equipo, permisos, categorías, campos, piezas, configuración y publicación.

Si resulta útil, separar `User` de `MuseumMember`, de modo que no toda persona que inicia sesión sea automáticamente miembro del equipo.

# 7. Permisos por categorías

Este punto también es crítico y debe validarse en backend.

Un administrador debe poder asignar a cada colaborador una o varias categorías o subcategorías sobre las que puede trabajar.

Para cada asignación permitir al menos:

- Ver internamente.
- Crear piezas.
- Editar piezas.
- Opcionalmente archivar piezas.

Usar una tabla de permisos explícita, no guardar una lista de IDs dentro del usuario.

Agregar a cada permiso una opción `incluir descendientes`.

Ejemplo:

Si a Ana se le asigna `Insignias` con `incluir descendientes = sí`, puede trabajar en todas sus subcategorías hoja.

Si a Pedro se le asigna únicamente `Insignias > Argentina` con `incluir descendientes = sí`, no puede modificar `Insignias > Chile`.

Los colaboradores NO deben poder:

- Acceder a categorías no autorizadas.
- Crear o editar piezas mediante URL/API manipulada en categorías sin permiso.
- Administrar roles o permisos.
- Cambiar la configuración global del museo.

Si se desea permitir que determinados colaboradores gestionen la estructura de una categoría, tratarlo como un permiso separado y explícito; no concederlo por defecto.

# 8. Publicación del acervo

Cada categoría debe permitir definir `publicada = sí/no`.

Reglas:

- Una categoría no publicada no debe aparecer en la navegación pública.
- Sus descendientes tampoco deben quedar accesibles públicamente si alguno de sus ancestros está oculto.
- Las piezas de una categoría oculta no deben encontrarse desde búsqueda pública ni mediante URL directa pública.
- La información debe seguir disponible para usuarios internos con permisos.

Cada pieza debe tener un estado de publicación para permitir cargar y revisar información antes de mostrarla al público.

Para que una pieza sea visible públicamente deben cumplirse ambas condiciones:

1. La pieza está publicada.
2. Toda la ruta de categorías desde la raíz hasta su categoría hoja está publicada.

Los campos dinámicos marcados como privados nunca deben exponerse en las respuestas públicas del servidor.

# 9. Dashboard administrativo

Crear un dashboard visual y responsive.

Debe mostrar como mínimo:

- Total de piezas registradas.
- Total de categorías.
- Cantidad de piezas publicadas.
- Cantidad de piezas en borrador.
- Cantidad de piezas archivadas.
- Altas de piezas recientes.
- Piezas por categoría principal.
- Piezas por subcategoría.
- Posibilidad de navegar desde un gráfico/contador hacia el listado filtrado correspondiente.

Cuando un colaborador entre al dashboard, las métricas deben respetar sus permisos y mostrar solamente los sectores del acervo a los que tiene acceso.

Un administrador sí puede ver estadísticas de todo el museo.

# 10. Listados y búsqueda interna

Crear una vista de listado del acervo con:

- Código de registro.
- Título.
- Categoría completa.
- Estado.
- Fecha de registro.
- Usuario creador.
- Última modificación.
- Acciones según permisos.

Agregar:

- Búsqueda.
- Filtros.
- Ordenamiento.
- Paginación.
- Filtro por rama del árbol de categorías.
- Filtro por estado.
- Filtro por año.

Siempre respetar permisos de categoría del usuario autenticado.

# 11. Experiencia de carga de piezas

El formulario para crear una pieza debe seguir este flujo:

1. Seleccionar categoría mediante árbol/buscador.
2. Solo permitir seleccionar categorías hoja.
3. Al seleccionar la categoría, cargar dinámicamente sus campos específicos además de los campos generales.
4. Mostrar claramente cuáles son obligatorios.
5. Permitir subir imágenes con previsualización.
6. Validar antes de guardar.
7. Generar el código de registro automáticamente en backend al confirmar la creación.
8. Mostrar el código generado en la ficha final.

No confiar en un código calculado únicamente en el navegador.

# 12. Historial y auditoría

Como mínimo registrar:

- Creador de la pieza.
- Último editor.
- Fechas.

Preferentemente implementar un historial de cambios que permita saber:

- Qué usuario hizo el cambio.
- Cuándo.
- Qué entidad cambió.
- Qué campos cambiaron.
- Valor anterior y nuevo cuando resulte razonable.

No almacenar tokens OAuth, contraseñas ni información sensible dentro del historial.

# 13. Seguridad

Implementar y verificar:

- Autorización server-side en cada mutación.
- Protección de rutas administrativas.
- Protección contra IDOR.
- Validación de MIME/tamaño para archivos.
- Sanitización/escape de contenido generado por usuarios.
- CSRF según mecanismo de autenticación elegido.
- Cookies seguras según entorno.
- Secrets solamente mediante variables de entorno.
- Rate limiting razonable para login y endpoints públicos sensibles si corresponde.
- No exponer campos privados del acervo en API pública.

# 14. Base de datos local

Durante esta primera etapa utilizar SQLite local persistente mediante Prisma.

La base debe quedar fuera del control de versiones.

Crear:

- Esquema Prisma.
- Migraciones.
- Seed de demostración.
- Comando simple para reiniciar únicamente la base de desarrollo.

El seed debe crear al menos:

- Configuración inicial del museo.
- Categorías de demostración.
- Subcategorías de varios niveles.
- Campos generales.
- Campos específicos.
- Varias piezas de demostración.

No incluir credenciales reales en el seed.

Diseñar enums y relaciones pensando en futura migración a PostgreSQL.

# 15. Servidor local y entorno de desarrollo

La aplicación debe quedar ejecutándose localmente al terminar la implementación.

Crear scripts claros, idealmente:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run db:migrate`
- `npm run db:seed`

Si conviene usar otros nombres, documentarlos.

Crear `.env.example` con las variables necesarias para:

- URL de base de datos SQLite.
- Google OAuth Client ID.
- Google OAuth Client Secret.
- Auth secret.
- URL de la aplicación.
- Configuración de almacenamiento local.

El sistema debe arrancar aun sin Google OAuth configurado siempre que sea técnicamente razonable, por ejemplo proporcionando un modo de desarrollo local claramente marcado y deshabilitado en producción. Si se implementa ese mecanismo, nunca debe quedar activo automáticamente en producción.

# 16. Diseño visual

El Museo Scout Mendoza es una institución histórica. El diseño debe transmitir archivo, patrimonio, historia y movimiento scout sin parecer una plantilla infantil.

Lineamientos:

- Estética institucional moderna.
- Buena legibilidad.
- Fondos claros y secciones limpias.
- Uso moderado de tonos verdes/scout y tonos cálidos de archivo si corresponden.
- Navegación simple.
- Árbol de categorías especialmente usable.
- Tarjetas de piezas con fotografías protagonistas.
- Ficha de pieza clara, casi de catálogo museológico.
- Dashboard profesional, no recargado.

No inventar un logotipo oficial. Preparar un espacio reemplazable para identidad visual.

# 17. Accesibilidad y calidad

- HTML semántico.
- Navegación por teclado.
- Labels asociados a inputs.
- Estados de foco visibles.
- Contraste suficiente.
- Mensajes de error entendibles.
- Estados loading/empty/error.
- Confirmaciones antes de operaciones destructivas.
- Responsive real, no solamente reducción de ancho.

# 18. Pruebas obligatorias

Crear pruebas unitarias/integración para la lógica crítica y pruebas end-to-end para los principales flujos.

Casos mínimos:

### Categorías

- Crear categorías raíz.
- Crear múltiples niveles.
- Bloquear ciclos.
- Bloquear asignación de una pieza a categoría con hijos.
- Bloquear creación de un hijo si la categoría ya contiene piezas sin antes resolverlas.

### Código de registro

- Generación correcta de `CAT2-YEAR-SEQ`.
- Secuencia sin duplicados.
- Comportamiento del reinicio anual según configuración.
- Código histórico inmutable.

### Permisos

- Admin ve todo.
- Colaborador autorizado puede crear/editar en su categoría.
- Colaborador no autorizado recibe rechazo real del servidor.
- Permiso con descendientes funciona correctamente.
- Usuario registrado sin rol de equipo no puede entrar a administración.

### Publicación

- Categoría oculta no aparece públicamente.
- Descendientes de categoría oculta tampoco.
- Pieza en borrador no aparece.
- Campos privados no se devuelven públicamente.

### Campos dinámicos

- Cargar campos generales.
- Cargar campos específicos según categoría.
- Validar campos obligatorios.
- Guardar correctamente listas y selección múltiple.

# 19. Verificación mediante navegador

No considerar terminada una funcionalidad solo porque compila.

Usar las capacidades de navegador de Antigravity para recorrer la aplicación real.

Verificar manualmente al menos:

1. Inicio público.
2. Navegación por categorías.
3. Ficha pública de pieza.
4. Login.
5. Dashboard.
6. Árbol de categorías.
7. Creación de categoría/subcategoría.
8. Configuración de campos.
9. Creación de pieza.
10. Código de registro generado.
11. Restricción por permisos.
12. Ocultar/publicar categoría.
13. Responsive en viewport de escritorio y móvil.

Corregir errores encontrados antes de cerrar el hito.

# 20. Documentación obligatoria

Crear un `README.md` útil que incluya:

- Descripción del proyecto.
- Stack utilizado.
- Requisitos.
- Instalación local paso a paso.
- Configuración de Google OAuth.
- Variables de entorno.
- Inicialización de SQLite.
- Migraciones.
- Seed.
- Ejecución local.
- Pruebas.
- Build.
- Estructura de carpetas.
- Roles y permisos.
- Explicación resumida del modelo de categorías y campos dinámicos.
- Estrategia futura para migrar a PostgreSQL y almacenamiento externo.

Agregar documentación técnica adicional en `/docs` cuando sea necesario.

# 21. Modelo de datos de referencia

No es obligatorio copiar estos nombres literalmente, pero el dominio debe cubrir como mínimo entidades equivalentes a:

- `User`
- `Account` / tablas necesarias para OAuth
- `MuseumMember`
- `Role`
- `Category`
- `CategoryPermission`
- `FieldDefinition`
- `FieldOption`
- `CategoryField`
- `MuseumPiece`
- `PieceFieldValue`
- `PieceMedia`
- `MuseumSettings`
- `RegistrySequence`
- `AuditLog`

Evitar relaciones redundantes.

Para categorías usar relación recursiva padre-hijos.

Para campos dinámicos, separar la definición del campo de sus valores.

# 22. Configuración del museo

Crear una pantalla de configuración general reservada a administradores con al menos:

- Nombre del museo.
- Descripción breve.
- Datos públicos básicos.
- Configuración del código de registro.
- Preferencias básicas de publicación.

Dejar preparada la arquitectura para futuras configuraciones sin hardcodearlas en componentes.

# 23. Estrategia de implementación por hitos

Trabajar en este orden y terminar/verificar cada bloque antes del siguiente:

### Hito 1 — Base del proyecto

- Inicializar stack.
- Configurar TypeScript, UI, Prisma y SQLite.
- Crear esquema inicial.
- Migraciones.
- Seed.
- Layout público/admin.
- README inicial.
- Ejecutar servidor local.
- Commit y push.

### Hito 2 — Autenticación y roles

- Google OAuth.
- Usuarios.
- Miembros del museo.
- Admin/colaborador.
- Protección de rutas.
- Pruebas.
- Commit y push.

### Hito 3 — Árbol de categorías

- Categorías recursivas.
- Árbol administrativo.
- Publicación.
- Reglas de categorías hoja.
- Pruebas.
- Commit y push.

### Hito 4 — Campos dinámicos

- Campos generales.
- Campos por categoría.
- Tipos de Google Forms solicitados.
- Editor y validaciones.
- Pruebas.
- Commit y push.

### Hito 5 — Piezas y código registral

- CRUD de piezas.
- Multimedia.
- Secuencial automático.
- Configurador del patrón.
- Transacciones y unicidad.
- Pruebas.
- Commit y push.

### Hito 6 — Permisos granulares

- Asignaciones colaborador-categoría.
- Descendientes.
- Autorización backend.
- UI de permisos.
- Pruebas de acceso indebido.
- Commit y push.

### Hito 7 — Catálogo público

- Navegación pública.
- Búsqueda.
- Fichas.
- Campos visibles/privados.
- SEO básico.
- Responsive.
- Commit y push.

### Hito 8 — Dashboard y acabado

- Métricas.
- Gráficos.
- Filtros.
- Auditoría.
- Estados vacíos/error/loading.
- Accesibilidad.
- Commit y push.

### Hito 9 — QA final

- Tests completos.
- Build de producción.
- Recorrido con navegador.
- Correcciones.
- Documentación definitiva.
- Push final y PR hacia `main` si se está trabajando en rama.

# 24. Criterios de aceptación final

No declarar terminado el proyecto hasta que se pueda demostrar localmente que:

1. El servidor inicia sin errores.
2. SQLite persiste la información entre reinicios.
3. Se pueden crear categorías con múltiples niveles.
4. Solo las hojas aceptan piezas.
5. Se pueden crear campos generales configurables.
6. Cada hoja puede tener campos propios.
7. Los formularios de piezas se adaptan dinámicamente.
8. Cada pieza recibe un código único automático.
9. El formato del código se puede configurar manteniendo obligatoriamente categoría + año + secuencia.
10. Un usuario puede autenticarse con Google.
11. Un admin puede convertir usuarios en miembros del museo.
12. Un admin puede asignar roles.
13. Un admin puede asignar categorías a colaboradores.
14. Los colaboradores solo trabajan dentro de sus permisos.
15. Los permisos también se verifican en backend.
16. Las categorías pueden publicarse u ocultarse.
17. El catálogo público respeta toda la cadena de publicación.
18. Los campos privados nunca se muestran públicamente.
19. El dashboard contabiliza piezas por categorías/subcategorías.
20. El sistema funciona correctamente en escritorio y móvil.
21. Existen pruebas automatizadas para la lógica crítica.
22. `npm run build` o equivalente finaliza correctamente.
23. README explica cómo instalarlo desde cero.
24. El código está subido al repositorio indicado con historial claro de commits.

# 25. Regla de trabajo autónomo

No limitarse a entregar código sin comprobarlo. Cada vez que aparezca un error de compilación, migración, ejecución, permisos, autenticación o UI, diagnosticarlo y corregirlo.

Si una decisión técnica no está especificada, elegir la alternativa más simple, mantenible y migrable, documentar la decisión y continuar sin bloquear el trabajo.

No sustituir requisitos solicitados por mocks permanentes. Los mocks solo pueden usarse transitoriamente durante desarrollo y deben eliminarse o quedar claramente aislados antes de considerar finalizada la funcionalidad.

Al cerrar cada hito informar:

- Qué se implementó.
- Qué archivos principales cambiaron.
- Qué pruebas se ejecutaron.
- Resultado de las pruebas.
- URL local utilizada para verificar.
- Commit SHA generado.
- Qué queda pendiente para el siguiente hito.

## Comenzar ahora

1. Clonar/abrir `https://github.com/MauricioPabloArce/MuseoScoutMendoza.git`.
2. Revisar el estado real del repositorio.
3. Crear la rama de trabajo.
4. Definir la arquitectura definitiva manteniendo los requisitos anteriores.
5. Implementar el Hito 1.
6. Levantar el servidor local y comprobarlo en navegador.
7. Hacer commit y push del hito estable.
8. Continuar sucesivamente hasta completar todos los criterios de aceptación.