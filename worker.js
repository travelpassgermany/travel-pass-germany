export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Site ve statik dosyalar
    if (url.pathname !== "/api/carvis") {
      return env.ASSETS.fetch(request);
    }

    // Sadece POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    try {
      const body = await request.json();

      const messages = Array.isArray(body.messages)
        ? body.messages
        : [
            {
              role: "user",
              content: body.message || ""
            }
          ];

      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({
            error: "GEMINI_API_KEY Cloudflare Worker'a ulaşmıyor."
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      // Gemini formatına çevir
      const contents = messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: String(message.content || "")
          }
        ]
      }));

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          encodeURIComponent(env.GEMINI_API_KEY),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error:
              data?.error?.message ||
              "Gemini API hatası"
          }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      const reply =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("") ||
        "CARVIS şu anda cevap oluşturamadı.";

      return new Response(
        JSON.stringify({ reply }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error?.message ||
            "CARVIS sunucusunda bir hata oluştu."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};
