export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Site dosyalarını göster
    if (url.pathname !== "/api/carvis") {
      return env.ASSETS.fetch(request);
    }

    // API anahtarı kontrolü
    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY bulunamadı."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=UTF-8"
          }
        }
      );
    }

    // Sadece POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Sadece POST kullanılabilir."
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=UTF-8"
          }
        }
      );
    }

    try {
      const body = await request.json();

      const messages = Array.isArray(body.messages)
        ? body.messages
        : [];

      if (messages.length === 0) {
        return new Response(
          JSON.stringify({
            error: "Mesaj bulunamadı."
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=UTF-8"
            }
          }
        );
      }

      const contents = messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: String(message.content || "")
          }
        ]
      }));

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
          encodeURIComponent(env.GEMINI_API_KEY),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    "Sen CARVIS'sın. Travel Pass Germany'nin Almanya vize ve kariyer destek asistanısın. Türkçe konuş. Kullanıcılara vize türleri, belge hazırlığı, çalışma, Ausbildung, Blue Card, aile birleşimi ve Almanya'ya yerleşme süreçleri hakkında yardımcı ol. Kesin vize kararı verme. Güncel ve resmi kaynakların kontrol edilmesi gerektiğini belirt. Cevaplarını anlaşılır, kısa ve pratik ver."
                }
              ]
            },
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
              "Gemini API hatası."
          }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json; charset=UTF-8"
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
        JSON.stringify({
          reply
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=UTF-8"
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
            "Content-Type": "application/json; charset=UTF-8"
          }
        }
      );
    }
  }
};
