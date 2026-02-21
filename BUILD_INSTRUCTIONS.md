# 🏗️ LingoChat Build Talimatları

## 📋 Ön Hazırlık

### 1. EAS CLI Kurulumu
```bash
npm install -g eas-cli
```

### 2. Expo Hesabına Giriş
```bash
eas login
```

### 3. Proje Yapılandırması
```bash
eas build:configure
```

---

## 🧪 Development Build (Test İçin)

### iOS Simulator Build
```bash
eas build --platform ios --profile development
```

### Android Emulator Build
```bash
eas build --platform android --profile development
```

### Cihazda Test (Internal Distribution)
```bash
eas build --platform all --profile preview
```

**Sonuç**: 
- iOS: `.ipa` dosyası (TestFlight'a yüklenebilir)
- Android: `.apk` dosyası (direkt yüklenebilir)

---

## 🚀 Production Build (Store İçin)

### iOS Production Build
```bash
eas build --platform ios --profile production
```

**Gereksinimler**:
- Apple Developer hesabı ($99/yıl)
- App Store Connect'te app oluşturulmuş olmalı
- Certificates ve provisioning profiles

### Android Production Build
```bash
eas build --platform android --profile production
```

**Gereksinimler**:
- Google Play Console hesabı ($25 tek seferlik)
- Keystore (EAS otomatik oluşturur)

---

## 📱 Build Sonrası

### iOS - TestFlight'a Yükleme
```bash
eas submit --platform ios --profile production
```

**Gerekli Bilgiler**:
- Apple ID
- App-specific password
- ASC App ID

### Android - Internal Testing
```bash
eas submit --platform android --profile production
```

**Gerekli Bilgiler**:
- Google Service Account JSON
- Package name

---

## 🧪 Test Adımları

### 1. Local Test (Şimdi)
```bash
# Backend başlat
pnpm dev:server

# Frontend başlat
pnpm dev:metro
```

**Test Checklist**:
- [ ] Giriş/Kayıt çalışıyor
- [ ] Mesajlaşma çalışıyor
- [ ] Çeviri çalışıyor
- [ ] 4 dil değişimi çalışıyor
- [ ] Medya paylaşımı çalışıyor
- [ ] Push notifications çalışıyor
- [ ] Hesap silme çalışıyor
- [ ] Grup sohbetleri çalışıyor
- [ ] AI özet çalışıyor

### 2. Preview Build Test
```bash
eas build --platform all --profile preview
```

**Test**:
- Gerçek cihazda çalıştır
- Tüm özellikleri test et
- Performance kontrol et
- Crash test

### 3. Production Build
```bash
eas build --platform all --profile production
```

**Final Test**:
- TestFlight (iOS) - 10-20 beta tester
- Internal Testing (Android) - 10-20 beta tester
- 1 hafta beta test
- Feedback topla
- Bug fix

---

## ⚙️ Build Yapılandırması

### eas.json
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### app.config.ts
```typescript
{
  name: "LingoChat",
  version: "1.0.0",
  ios: {
    bundleIdentifier: "space.manus.lingo.chat.app.t20260211063907"
  },
  android: {
    package: "space.manus.lingo.chat.app.t20260211063907"
  }
}
```

---

## 🐛 Sorun Giderme

### Build Hatası
```bash
# Cache temizle
eas build:clear-cache

# Yeniden dene
eas build --platform ios --profile production --clear-cache
```

### Credentials Hatası
```bash
# Credentials'ı sıfırla
eas credentials

# iOS için
eas credentials -p ios

# Android için
eas credentials -p android
```

### Version Conflict
```bash
# app.config.ts'de version'ı güncelle
version: "1.0.1"

# Veya autoIncrement kullan (eas.json'da)
"autoIncrement": true
```

---

## 📊 Build Süresi

- **Development Build**: 10-15 dakika
- **Preview Build**: 15-20 dakika
- **Production Build**: 20-30 dakika

**Not**: İlk build daha uzun sürebilir (dependencies cache)

---

## 🎯 Önerilen Akış

### Bugün:
1. ✅ Local test yap
2. ✅ Bug varsa düzelt
3. ✅ Preview build al
4. ✅ Gerçek cihazda test et

### Yarın:
1. ✅ Domain setup
2. ✅ Production build al
3. ✅ TestFlight'a yükle
4. ✅ Beta test başlat

### 1 Hafta Sonra:
1. ✅ Beta feedback değerlendir
2. ✅ Bug fix
3. ✅ Final build
4. ✅ Store submission

---

## 📞 Destek

**EAS Build Dokümantasyon**:
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/submit/introduction/

**Sorun mu var?**
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/

---

## ✅ Checklist

### Build Öncesi:
- [ ] EAS CLI kurulu
- [ ] Expo hesabına giriş yapıldı
- [ ] Local test tamamlandı
- [ ] Bug'lar düzeltildi
- [ ] Version güncellendi

### Build Sonrası:
- [ ] Build başarılı
- [ ] Gerçek cihazda test edildi
- [ ] Tüm özellikler çalışıyor
- [ ] Performance iyi
- [ ] Crash yok

### Store Hazırlık:
- [ ] Privacy Policy URL hazır
- [ ] Terms of Service URL hazır
- [ ] App Store metadata hazır
- [ ] Screenshots hazır
- [ ] Test account hazır

---

**Hazırlayan**: AI Assistant  
**Tarih**: 20 Şubat 2026  
**Durum**: ✅ Hazır
