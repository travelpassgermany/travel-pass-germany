export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Ana site ve statik dosyalar
    if (url.pathname !== "/api/carvis") {
      return env.ASSETS.fetch(request);
    }

    // Sadece POST kabul et
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
      // Frontend'den gelen mesajları al
      const body = await request.json();

      const messages = Array.isArray(body.messages)
        ? body.messages
        : [
            {
              role: "user",
              content: body.message || ""
            }
          ];

      // OpenAI'ye gönder
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages
          })
        }
      );

      const data = await response.json();

      // OpenAI hata döndürdüyse aynısını frontend'e bildir
      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: data?.error?.message || "OpenAI API hatası"
          }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }

      const reply =
        data?.choices?.[0]?.message?.content ||
        "CARVIS şu anda cevap oluşturamadı.";

      return new Response(
        JSON.stringify({
          reply: reply
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "CARVIS sunucusunda bir hata oluştu."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
  }
};
