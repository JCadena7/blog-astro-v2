import { pgQuery } from '../../../db/pgHelper';
import { Webhook } from 'svix';
import { ENV } from '../../../config/env';

export async function POST({ request }) {
  console.log('🎯 Webhook de Clerk recibido');
  try {
    // Verificar la firma del webhook
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");
    
    console.log('📨 Headers recibidos:', {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature?.substring(0, 10) + '...'
    });

    // Verificar que tenemos todos los headers necesarios
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Faltan headers de Svix');
      return new Response(
        JSON.stringify({
          error: "No se encontraron las cabeceras de Svix",
          missingHeaders: {
            'svix-id': !svix_id,
            'svix-timestamp': !svix_timestamp,
            'svix-signature': !svix_signature
          }
        }),
        { status: 400 }
      );
    }

    // Obtener el cuerpo de la petición como texto
    const payload = await request.text();
    console.log('📦 Payload recibido:', payload.substring(0, 100) + '...');

    // Verificar que tenemos la clave secreta configurada
    if (!ENV.CLERK_WEBHOOK_SECRET) {
      console.error('❌ CLERK_WEBHOOK_SECRET no está configurada');
      return new Response(
        JSON.stringify({
          error: "Falta configuración del webhook"
        }),
        { status: 500 }
      );
    }

    // Decodificar la clave del webhook si está codificada
    const webhookSecret = ENV.CLERK_WEBHOOK_SECRET.replace(/^"(.*)"$/, '$1').replace(/%2B/g, '+');
    console.log('🔑 Usando clave webhook (primeros caracteres):', webhookSecret.substring(0, 10) + '...');

    console.log('🔐 Verificando firma con webhook secret');
    // Verificar la firma usando la clave secreta de webhooks
    const wh = new Webhook(webhookSecret);
    let evt;
    
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
      console.log('✅ Firma verificada correctamente');
    } catch (err) {
      console.error("❌ Error al verificar webhook:", err);
      console.log('🔍 Detalles de verificación:', {
        secretLength: webhookSecret.length,
        payloadLength: payload.length,
        headers: {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature?.substring(0, 10) + '...'
        }
      });
      return new Response(
        JSON.stringify({
          error: "Error al verificar webhook",
          details: err.message
        }),
        { status: 400 }
      );
    }

    // Manejar el evento
    const eventType = evt.type;
    console.log("📣 Evento de Clerk recibido:", eventType);

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      // Verificar si el usuario ya existe en la base de datos
      const existingUser = await pgQuery(
        'SELECT * FROM usuarios WHERE clerk_id = $1',
        [id]
      );

      if (existingUser.length > 0) {
        // El usuario ya existe, no mostramos mensaje de sincronización
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // El usuario no existe, procedemos a crearlo
      console.log('👤 Creando nuevo usuario:', { id, email_addresses, first_name, last_name });
      
      try {
        const result = await pgQuery(
          'INSERT INTO usuarios (clerk_id, email, nombre, rol_id) VALUES ($1, $2, $3, 3) RETURNING *',
          [
            id,
            email_addresses[0]?.email_address || '',
            `${first_name || ''} ${last_name || ''}`.trim()
          ]
        );

        console.log("✅ Nuevo usuario creado en la base de datos");
        return new Response(JSON.stringify({ 
          success: true,
          message: "Usuario creado correctamente"
        }), { status: 201 });
      } catch (dbError) {
        console.error("❌ Error al crear usuario en la base de datos:", dbError);
        return new Response(JSON.stringify({
          error: "Error al crear usuario en la base de datos",
          details: dbError.message,
          needsSync: true
        }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
        needsSync: true
      }),
      { status: 500 }
    );
  }
} 