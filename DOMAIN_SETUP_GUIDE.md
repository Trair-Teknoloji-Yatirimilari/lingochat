# 🌐 LingoChat Domain Setup Guide

## Domain: www.lingo-chat.com

### ✅ Tamamlanan Adımlar
1. ✅ Domain satın alındı: www.lingo-chat.com
2. ✅ HTML dosyaları güncellendi (privacy, terms, index)
3. ✅ Netlify yapılandırması hazırlandı

---

## 📋 Yapılacaklar Listesi

### 1. Netlify'da Deployment (5 dakika)

#### Adım 1: Netlify Hesabı Oluştur
1. https://www.netlify.com adresine git
2. GitHub hesabınla giriş yap (veya email ile kayıt ol)

#### Adım 2: Site Deploy Et
1. Netlify Dashboard'da "Add new site" → "Import an existing project"
2. GitHub repository'yi seç: `Trair-Teknoloji-Yatirimilari/lingochat`
3. Build settings:
   - **Base directory**: `docs`
   - **Publish directory**: `.` (nokta)
   - **Build command**: (boş bırak)
4. "Deploy site" butonuna tıkla

#### Adım 3: Custom Domain Ekle
1. Site settings → Domain management
2. "Add custom domain" → `www.lingo-chat.com` yaz
3. Netlify sana DNS kayıtlarını gösterecek

---

### 2. DNS Ayarları (Domain Sağlayıcıda)

Domain sağlayıcının (GoDaddy, Namecheap, vs.) DNS yönetim paneline git:

#### Seçenek A: CNAME Kaydı (Önerilen)
```
Type: CNAME
Name: www
Value: [netlify-site-name].netlify.app
TTL: 3600
```

#### Seçenek B: A Kaydı
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600
```

**Not**: Netlify'ın IP adresi değişebilir, CNAME kullanmak daha güvenli.

---

### 3. SSL Sertifikası (Otomatik)

Netlify otomatik olarak Let's Encrypt SSL sertifikası sağlar:
- DNS ayarları yayıldıktan sonra (15-30 dakika)
- Netlify otomatik olarak HTTPS'i aktif eder
- Hiçbir şey yapman gerekmez!

---

### 4. Test Et

DNS yayıldıktan sonra (15-30 dakika):

1. **Ana Sayfa**: https://www.lingo-chat.com
2. **Privacy Policy**: https://www.lingo-chat.com/privacy.html
3. **Terms of Service**: https://www.lingo-chat.com/terms.html

---

## 🔧 Alternatif: Vercel Deployment

Netlify yerine Vercel kullanmak istersen:

### Vercel ile Deployment
1. https://vercel.com adresine git
2. GitHub ile giriş yap
3. "New Project" → Repository seç
4. Build settings:
   - **Root Directory**: `docs`
   - **Output Directory**: `.`
5. Deploy et
6. Domain settings'den `www.lingo-chat.com` ekle

---

## 📱 App Config Güncelleme

Deployment tamamlandıktan sonra, app.config.ts dosyasını güncelle:

```typescript
export default {
  // ...
  extra: {
    // ...
    privacyPolicyUrl: "https://www.lingo-chat.com/privacy.html",
    termsOfServiceUrl: "https://www.lingo-chat.com/terms.html",
  }
}
```

---

## ✅ Doğrulama Checklist

Deployment sonrası kontrol et:

- [ ] https://www.lingo-chat.com açılıyor
- [ ] https://www.lingo-chat.com/privacy.html açılıyor
- [ ] https://www.lingo-chat.com/terms.html açılıyor
- [ ] HTTPS çalışıyor (yeşil kilit ikonu)
- [ ] Mobil cihazda düzgün görünüyor
- [ ] Tüm linkler çalışıyor

---

## 🚀 Sonraki Adımlar

Domain hazır olduktan sonra:

1. **App Store Metadata güncelle**
   - Privacy Policy URL: https://www.lingo-chat.com/privacy.html
   - Terms URL: https://www.lingo-chat.com/terms.html

2. **App Config güncelle**
   - `app.config.ts` dosyasında URL'leri güncelle

3. **Test Build al**
   - Preview build ile test et
   - URL'lerin çalıştığını doğrula

4. **Production Build**
   - Final build al
   - App Store'a submit et

---

## 📞 Destek

**Netlify Dokümantasyon**:
- https://docs.netlify.com/domains-https/custom-domains/

**DNS Yayılma Kontrolü**:
- https://www.whatsmydns.net/

**Sorun mu var?**
- Netlify Support: https://www.netlify.com/support/
- Email: info@trairx.com

---

## 💡 İpuçları

1. **DNS Yayılma**: 15-30 dakika sürebilir, sabırlı ol
2. **HTTPS**: Netlify otomatik halleder, bekle
3. **WWW vs Non-WWW**: Her ikisi de çalışmalı (Netlify otomatik redirect)
4. **Cache**: Tarayıcı cache'ini temizle (Cmd+Shift+R)

---

**Hazırlayan**: AI Assistant  
**Tarih**: 21 Şubat 2026  
**Durum**: ✅ Deployment için hazır
