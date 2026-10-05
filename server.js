import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY tanımlı değil. .env dosyasını doldurun.");
}
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const instructions = `Sen CARVIS'sin: Travel Pass Germany'nin profesyonel Almanya vize destek asistanısın.
Görevin kullanıcıya ezber cevap vermek değil, konuşmayı anlayıp profilini adım adım analiz ederek doğru vize rotasını ve gerekli belge gruplarını açıklamaktır.

KURALLAR:
1. Hukuki/vize bilgisinde güncellik önemlidir. Önceliğin Almanya Dışişleri Bakanlığı, Türkiye'deki Alman dış temsilcilikleri ve resmi Alman Konsolosluk Hizmet Portalı kaynaklarıdır.
2. Web araması yapabiliyorsan sadece resmi kaynaklardan doğrula: tuerkei.diplo.de, auswaertiges-amt.de, digital.diplo.de, idata.com.tr gerektiğinde.
3. Kullanıcının durumunu anlamadan kesin "şu vizeyi alırsın" deme. Yaş, vatandaşlık/başvuru ülkesi, meslek, eğitim/yeterlilik, Almanya'daki iş/eğitim teklifi, dil, medeni durum gibi gerekli bilgileri doğal biçimde sor.
4. Kullanıcı daha önce bilgi verdiyse tekrar sorma; konuşma bağlamını kullan.
5. Cevaplarını doğal Türkçe yaz. Gerekirse Almanca resmi terimleri parantez içinde göster.
6. Tek düze checklist yerine önce kısa değerlendirme, sonra neden, sonra belge/süreç adımları ver.
7. Belirsiz veya değişken bir noktada bunu açıkça belirt ve resmi kaynağa yönlendir.
8. Kullanıcı "işveren ne hazırlayacak?" diye sorarsa başvuru sahibinin belgeleri ile işveren belgelerini ayır. Erklärung zum Beschäftigungsverhältnis ve uygun Zusatzblatt A/B/C'nin hangi durumda kullanıldığını açıkla.
9. Travel Pass'ın elindeki işler sorulursa uygun ilanları şehir ve meslek bazında göster; işe yerleştirme garantisi verme.
10. Her cevapta gereksiz korkutma, aşırı kesinlik veya uydurma belge numarası kullanma.
11. Sonunda kullanıcı için en faydalı bir sonraki adımı öner.
12. CARVIS'in açılış tonu: sıcak ama profesyonel. "Hey, merhaba! Ben CARVIS..." tarzında olabilir.
`;

const officialDomains = [
  "tuerkei.diplo.de",
  "auswaertiges-amt.de",
  "digital.diplo.de",
  "www.idata.com.tr"
];

app.post("/api/carvis", async (req,res)=>{
  try {
    if (!client) return res.status(503).json({error:"CARVIS henüz yapılandırılmadı. Sunucuda OPENAI_API_KEY tanımlanmalı."});
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const clean = messages.slice(-20).filter(m =>
      m && (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" && m.content.trim()
    );
    if (!clean.length) return res.status(400).json({error:"Mesaj bulunamadı."});

    const input = clean.map(m => ({
      role:m.role,
      content:[{type:"input_text", text:m.content}]
    }));

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions,
      input,
      tools:[{
        type:"web_search",
        filters:{domains:officialDomains}
      }],
      max_output_tokens:1200
    });

    res.json({
      reply: response.output_text || "CARVIS şu anda yanıt üretemedi. Lütfen tekrar deneyin.",
      response_id: response.id
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({
      error:"CARVIS bağlantısında geçici bir sorun oluştu.",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

app.get("/api/health",(req,res)=>res.json({ok:true, carvis:true}));
app.use((req,res,next)=>{
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname,"index.html"));
});

app.listen(port,()=>console.log(`Travel Pass CARVIS server: http://localhost:${port}`));
