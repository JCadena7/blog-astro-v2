import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { question } = await request.json();

  if (!question) {
    return new Response(JSON.stringify({ error: 'Pregunta vacía' }), { status: 400 });
  }

  // Usa tu variable de entorno
  const apiKey = import.meta.env.DEEPSEEK_API_KEY;

  // Llama a la API de DeepSeek (ajusta la URL y payload según su doc)
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // Ajusta el modelo si es necesario
      messages: [
        { role: 'system', content: 'Responde preguntas frecuentes del sitio.' },
        { role: 'user', content: question }
      ],
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Error en DeepSeek' }), { status: 500 });
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || 'No se pudo obtener respuesta.';

  return new Response(JSON.stringify({ answer }), { status: 200 });
};