# Yiğit Simülasyon – Çevrim içi sunucu

Bu paket Node.js ve WebSocket tabanlı 4 kişilik oda sistemi içerir.

## Render üzerinde yayınlama
1. Bu klasörün içeriğini GitHub deposuna yükleyin (ZIP dosyasını GitHub'a tek parça yüklemeyin; ZIP'i telefonda/bilgisayarda çıkartıp içindeki dosyaları yükleyin).
2. Render'da **New → Web Service** seçip GitHub deposunu bağlayın.
3. Root Directory boş bırakın (server.js depo kökünde olmalı).
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Deploy tamamlanınca Render'ın verdiği `https://...` adresini iki telefonda da açın.

Render HTTPS'i otomatik sağlar. Oyun dosyasını telefondan `file://` ile açmayın; yayınlanan HTTPS adresini kullanın.

## Yerel deneme
Node.js 18+ kurulu bilgisayarda `npm install` ve `npm start` çalıştırın; ardından `http://localhost:3000` açın.

Oda sunucusu oda oluşturma/katılma ve araç konumlarını oyunculara aktarma işini yapar. Araç fiziği her telefonda ayrı simüle edilir. Gerçek çevrim içi kullanım için bu sunucunun bir Node.js hosting hizmetinde çalışıyor olması gerekir.
