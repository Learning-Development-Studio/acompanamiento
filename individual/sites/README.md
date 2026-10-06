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
