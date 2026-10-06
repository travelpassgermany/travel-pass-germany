export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/carvis") {
      return env.ASSETS.fetch(request);
    }

    // TEST: Tarayıcıdan açıldığında Gemini'yi doğrudan test et
    if (request.method === "GET") {
      try {
        if (!env.GEMINI_API_KEY) {
          return new Response(
            JSON.stringify({ error: "GEMINI_API_KEY bulunamadı." }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
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
              gemini_error: data?.error?.message || "Bilinmeyen Gemini hatası"
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        return new Response(
          JSON.stringify({
            gemini_status: 200,
            reply:
              data?.candidates?.[0]?.content?.parts?.[0]?.text ||
              "Gemini cevap verdi ama metin bulunamadı."
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error?.message || "Worker hatası"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "Test tamamlandı."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
