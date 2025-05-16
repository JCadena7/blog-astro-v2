# PRD: Chatbot FAQ para Blog Astro usando DeepSeek

## 1. Visión  
Un chatbot integrado en tu sitio Astro que responda preguntas frecuentes de forma instantánea, mejorando la experiencia del usuario y reduciendo el trabajo manual de soporte.

## 2. Objetivos  
- Ofrecer respuestas precisas a FAQs en ≤2 s.  
- Mantener alta disponibilidad (≥99%).  
- Escalar según tráfico sin cambios mayores.

## 3. Público objetivo  
Visitantes de tu blog que buscan información sobre contenidos, suscripciones y uso de la plataforma.

## 4. Alcance  
### Incluido  
- UI de chat en la página principal.  
- Endpoint API en Astro (`/api/chatbot`).  
- Integración con DeepSeek.  
- Gestión de claves en variables de entorno.  
- Registro básico de consultas y errores.

### Excluido  
- Autenticación de usuarios (más allá de anónimo).  
- Chat multimedia (solo texto).

## 5. Requerimientos funcionales  
1. Input de pregunta → muestra “Escribiendo…” hasta recibir respuesta.  
2. Llamada POST a `/api/chatbot` con payload `{ question: string }`.  
3. Endpoint lee `DEEPSEEK_API_KEY`, envía petición a DeepSeek y devuelve `{ answer: string }`.  
4. UI renderiza `answer` y gestiona errores.

## 6. Requerimientos no funcionales  
- Respuestas en <2 s (sin contar latencia DeepSeek).  
- Código documentado y testeable.  
- Despliegue en Vercel o Netlify.

## 7. Casos de uso / User Stories  
- **Como visitante**, quiero preguntar “¿Cómo me suscribo?” y recibir la guía paso a paso.  
- **Como administrador**, quiero ver logs de preguntas y respuestas para mejorar el FAQ.

## 8. Métricas de éxito  
- Tasa de satisfacción ≥ 80% (sondeo post-chat).  
- 30% menos tickets de soporte en FAQs.

## 9. Cronograma y Hitos  
| Sprint | Entregable                     | Duración |
|--------|--------------------------------|----------|
| 1      | Setup básico + endpoint Astro  | 1 semana |
| 2      | UI de chat + fetch a API       | 1 semana |
| 3      | Integración DeepSeek + tests   | 1 semana |
| 4      | Logging, optimización y deploy | 1 semana |

---

# Backlog de Tareas

1. **Infra & Configuración**  
   - Crear `.env` con `DEEPSEEK_API_KEY`.  
   - Instalar dependencias (`node-fetch`, etc.).

2. **API en Astro**  
   - Crear `src/pages/api/chatbot.ts`.  
   - Leer env, validar input, llamar a DeepSeek.

3. **Integración DeepSeek**  
   - Formatear payload JSON.  
   - Manejar errores y timeouts.

4. **UI del Chat**  
   - Componente `ChatWidget.astro` + `chat.js`.  
   - Input de texto, lista de mensajes, indicador de carga.

5. **Estado y UX**  
   - Estado local con `signals` o `useState`.  
   - Animaciones de “typing”.

6. **Logging & Error Handling**  
   - Registrar en consola/DB las consultas y respuestas.  
   - Mostrar mensajes de error amigables.

7. **Testing**  
   - Unit tests para el endpoint API.  
   - Test manual de flujo completo.

8. **Despliegue**  
   - Configurar Vercel/Netlify.  
   - Variables de entorno en producción.

9. **Documentación**  
   - README con instrucciones de setup y uso.  
   - Ejemplos de preguntas y respuestas.

10. **Post-lanzamiento**  
    - Revisar métricas de uso.  
    - Ajustar prompts o contexto según feedback.

---

Con esto tienes un roadmap claro para arrancar. ¿Qué tarea quieres abordar primero?