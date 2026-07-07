#Mini Banco
React + Firebase · Programación reactiva y manejo de eventos

Prototipo de banca digital con una interfaz simple donde los datos se actualicen en tiempo real.

##Uso de IA
Para el desarrollo de este proyecto me apoyé en IA como guía experta. Le pedí ayuda para estructurar la arquitectura de carpetas separando la lógica de Firebase de los componentes. Además, me sirvió para entender cómo corregir errores de navegación en la terminal al levantar el entorno de Vite y para asegurar que la limpieza de suscripciones en los `useEffect` cumpliera con las buenas prácticas exigidas.

##Instalación y ejecución local
Para probar este proyecto en tu máquina, sigue estos pasos:

1. Clona este repositorio.
2. Crea un archivo llamado `.env` en la raíz del proyecto.
3. Copia el contenido de `.env.example` en tu nuevo archivo `.env` y rellena las variables con las credenciales de tu propio proyecto de Firebase.
4. Abre la terminal en la carpeta del proyecto y ejecuta `npm install` para descargar las dependencias.
5. Ejecuta `npm run dev` para levantar el servidor local.

Los usuarios creados de prueba son:
* **Usuario 1:**
  * Email: n@gmail.com
  * Contraseña: 123456
* **Usuario 2:**
  * Email: d@gmail.com
  * Contraseña: 123456

Modelo de datos en Firestore
* Colección `users/{uid}` -> `{ email, nombre, saldo }`
* Colección `movimientos/{id}` -> `{ emisorUid, receptorUid, emisorEmail, receptorEmail, monto, fecha }`