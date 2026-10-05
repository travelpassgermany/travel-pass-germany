export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Ana site ve statik dosyalar
    if (url.pathname !== "/api/carvis") {
      return env.ASSETS.fetch(request);
    }

    // CARVIS API
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json();

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: body.messages || [
            {
              role: "user",
              content: body.message || ""
            }
          ]
        })
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "CARVIS request failed"
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
