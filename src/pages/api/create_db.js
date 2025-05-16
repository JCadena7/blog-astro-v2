// src/pages/api/setup-db.js

// import setupDatabase from '../../scripts/setup-db.js';

// export async function POST(context) {
//   try {
//     await setupDatabase();
//     return new Response(
//       JSON.stringify({ message: 'Base de datos creada e inicializada correctamente.' }),
//       { status: 200, headers: { 'Content-Type': 'application/json' } }
//     );
//   } catch (error) {
//     console.error(error);
//     return new Response(
//       JSON.stringify({ error: 'Error al inicializar la base de datos.' }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// }