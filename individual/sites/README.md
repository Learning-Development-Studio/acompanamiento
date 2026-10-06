# Acompañamiento individual · Learning & Development Studio

Portal de descubrimientos del alumno, seguimiento familiar y edición del asesor.
Los recursos originales de ilustración y audio permanecen en el repositorio
Learning-Development-Studio/acompanamiento. La aplicación de Sites los referencia.

## Preparar la versión

Ejecuta npm run build. Conserva el diseño de source.html, integra la experiencia
familiar y produce dist/server/index.js y el manifiesto de Sites.

La base compartida usa el binding DB. Las migraciones de esquema están en
drizzle/; no contienen resultados ni datos personales.

Configura LDS_ROLE_HASHES como secreto de Sites, con los hashes SHA-256 de los
códigos de Alumno, Padres e Israel. Los códigos se verifican en el servidor en
cada petición. Las respuestas y los reportes no se escriben en GitHub.

Cada actividad se guarda al responder y al terminar. Los papás ven las actividades
terminadas automáticamente; los borradores de Israel permanecen en su perfil hasta
publicarlos. Los reportes se descargan en PDF. Los mensajes de la familia y las
respuestas de Israel se guardan en la misma base.

GitHub conserva esta copia de código. Publicar una actualización requiere preparar
y desplegar la versión correspondiente en Sites; los commits de GitHub no se
despliegan en Sites por sí solos.

## Panel del asesor

Inicio organiza pendientes, agenda y mensajes. Alumno y acuerdos guarda el contexto
pedagógico y la preparación de la entrevista. Plan de trabajo incluye las tres
valoraciones iniciales y una ruta ajustable de intervención. Sesiones conserva
borradores y el registro de apoyos, confianza, participación y cansancio. Metas y
avance permite criterios individuales, muestras comparables, corrección de datos,
comparación cualitativa de comprensión y revisiones en semanas 4, 8 y 12.

La planeación y las notas del asesor se guardan como documento privado advisor en
program_documents, dentro del mismo guardado transaccional de los demás registros.
Las gráficas agrupan muestras por modalidad y material; la consolidación de metas
es decisión del asesor. Nada de esto publica reportes sin su revisión. Se generan
PDFs del plan, la valoración y el seguimiento. No se necesitan nuevas tablas.

Verificación: ejecutar node tests/api.test.js, node tests/advisor-ui.test.js y
node tests/family-ui.test.js después de npm run build. Los ejemplos usados en las
pruebas viven en memoria y no se insertan en la base publicada.
