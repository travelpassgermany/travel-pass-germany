# CARVIS yayınlama

## 1. Sunucu
Node.js 20+ destekleyen bir hosting/VPS kullanın.

## 2. Kurulum
```bash
npm install
cp .env.example .env
```
`.env` içine `OPENAI_API_KEY` değerini girin.

## 3. Başlatma
```bash
npm start
```

## 4. Domain / HTTPS
Reverse proxy (ör. Nginx veya hosting platformunun proxy'si) üzerinden HTTPS kullanın. `/api/carvis` endpoint'ini dışarı açarken rate limiting ekleyin.

## 5. Önemli
OpenAI API anahtarını `index.html`, JavaScript dosyaları veya Git deposuna koymayın. Yalnızca sunucu ortam değişkeninde tutun.

## 6. Model
Varsayılan model `gpt-6-luna` olarak ayarlanmıştır. İsterseniz `.env` içinde `OPENAI_MODEL` ile değiştirebilirsiniz.
