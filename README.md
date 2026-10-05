# Travel Pass Germany — CARVIS AI

Kurumsal Almanya vize danışmanlığı sitesi ve gerçek OpenAI Responses API tabanlı CARVIS asistanı.

## Çalıştırma

1. Node.js 20+ kurulu olsun.
2. `npm install`
3. `.env.example` dosyasını `.env` olarak kopyalayın.
4. `.env` içine OpenAI API anahtarınızı sunucu üzerinde girin. Anahtarı tarayıcı koduna koymayın.
5. `npm start`
6. `http://localhost:3000`

CARVIS konuşma geçmişinin son bölümünü modele gönderir ve resmi Alman kaynaklarıyla web araması yapabilir.

## Güvenlik
- API anahtarı yalnızca sunucuda tutulur.
- Hassas kişisel verileri gereksiz yere istemeyin veya loglamayın.
- Üretimde HTTPS, rate limit ve erişim loglarında PII minimizasyonu önerilir.
