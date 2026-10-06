export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Statik site
    if (url.pathname !== "/api/carvis") {
      return env.ASSETS.fetch(request);
    }

    // Gemini anahtarı kontrolü
    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY bulunamadı."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // GET: Gemini bağlantı testi
    if (request.method === "GET") {
      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
            encodeURIComponent(env.GEMINI_API_KEY),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: "Merhaba"
                    }
                  ]
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              gemini_status: response.status,
              gemini_error:
                data?.error?.message || "Gemini hatası"
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8"
              }
            }
          );
        }

        return new Response(
          JSON.stringify({
            gemini_status: 200,
            reply:
              data?.candidates?.[0]?.content?.parts
                ?.map((part) => part.text || "")
                .join("") ||
              "Gemini cevap verdi."
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error?.message || "Gemini bağlantı hatası"
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }
    }

    // Sadece POST kabul et
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method Not Allowed"
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    try {
      const body = await request.json();

      const messages = Array.isArray(body.messages)
        ? body.messages
        : [];

      if (!messages.length) {
        return new Response(
          JSON.stringify({
            error: "Mesaj bulunamadı."
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }

      // Frontend'deki konuşma geçmişini Gemini formatına çevir
      const contents = messages.map((message) => ({
        role:
          message.role === "assistant"
            ? "model"
            : "user",
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
              "Gemini API hatası"
          }),
          {
            status: response.status,
            headers: {
              "Content-Type":
                "application/json; charset=utf-8"
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
            "Content-Type":
              "application/json; charset=utf-8"
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
            "Content-Type":
              "application/json; charset=utf-8"
          }
        }
      );
    }
  }
};
