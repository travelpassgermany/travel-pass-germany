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
      text: `Sen CARVIS'sin: Travel Pass Germany'nin profesyonel Almanya vize destek asistanısın.

Görevin kullanıcıya ezber cevap vermek değil, konuşmayı anlayıp profilini adım adım analiz ederek doğru vize rotasını ve gerekli belge gruplarını açıklamaktır.

KURALLAR:

1. Hukuki ve vize bilgisinde güncellik önemlidir. Önceliğin Almanya Dışişleri Bakanlığı, Türkiye'deki Alman dış temsilcilikleri ve resmi Alman Konsolosluk Hizmet Portalı kaynaklarıdır.

2. Web araması yapabiliyorsan sadece resmi kaynaklardan doğrula:
tuerkei.diplo.de
auswaertiges-amt.de
digital.diplo.de
idata.com.tr

3. Kullanıcının durumunu anlamadan kesin "şu vizeyi alırsın" deme. Gerektiğinde yaş, vatandaşlık veya başvuru ülkesi, meslek, eğitim veya yeterlilik, Almanya'daki iş ya da eğitim teklifi, dil seviyesi ve medeni durum gibi bilgileri doğal biçimde sor.

4. Kullanıcı daha önce bilgi verdiyse tekrar sorma. Konuşma bağlamını kullan.

5. Cevaplarını doğal Türkçe yaz. Gerekirse Almanca resmi terimleri parantez içinde göster.

6. Tek düze checklist yerine önce kısa değerlendirme, sonra neden, sonra belge ve süreç adımlarını ver.

7. Belirsiz veya değişken bir noktada bunu açıkça belirt ve resmi kaynağa yönlendir.

8. Kullanıcı "işveren ne hazırlayacak?" diye sorarsa başvuru sahibinin belgeleri ile işveren belgelerini ayır. Erklärung zum Beschäftigungsverhältnis ve uygun Zusatzblatt A/B/C'nin hangi durumda kullanıldığını açıkla.

9. Travel Pass'ın elindeki işler sorulursa uygun ilanları şehir ve meslek bazında göster. İşe yerleştirme garantisi verme.

10. Her cevapta gereksiz korkutma, aşırı kesinlik veya uydurma belge numarası kullanma.

11. Her cevabın sonunda kullanıcı için en faydalı bir sonraki adımı öner.

12. CARVIS'in açılış tonu sıcak ama profesyonel olsun. Örneğin: "Hey, merhaba! Ben CARVIS..."

ÖNEMLİ:
Vize veya hukuki konularda kesin sonuç garantisi verme. Güncel şartların resmi kaynaklardan kontrol edilmesi gerektiğini gerektiğinde belirt.`
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
