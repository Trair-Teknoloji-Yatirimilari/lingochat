# Push Notifications Özelliği - Tamamlandı ✅

## Özet
LingoChat uygulamasına tam fonksiyonel push notification sistemi eklendi. Kullanıcılar artık yeni mesajlar için anlık bildirimler alabilirler.

## Yapılan Değişiklikler

### 1. Database (Backend)
- ✅ `pushTokens` tablosu oluşturuldu
  - userId, token, deviceId, platform, isActive, createdAt, updatedAt
  - Index'ler eklendi (userId, token)

### 2. Backend Services
- ✅ `server/push-notification-service.ts` oluşturuldu
  - `registerPushToken()` - Token kaydetme
  - `removePushToken()` - Token silme
  - `getUserPushTokens()` - Kullanıcı token'larını getirme
  - `sendPushNotification()` - Tek kullanıcıya bildirim gönderme
  - `sendPushNotificationToUsers()` - Birden fazla kullanıcıya bildirim gönderme

- ✅ `server/push-notification-router.ts` oluşturuldu
  - `registerToken` - Token kaydetme endpoint'i
  - `removeToken` - Token silme endpoint'i
  - `testNotification` - Test bildirimi endpoint'i

- ✅ `server/routers.ts` güncellendi
  - Push notification router eklendi

- ✅ `server/group-router.ts` güncellendi
  - `sendMessage` fonksiyonuna push notification desteği eklendi
  - Grup mesajı gönderildiğinde diğer katılımcılara bildirim gönderiliyor

### 3. Frontend (React Native)
- ✅ `hooks/use-notifications.ts` güncellendi
  - Expo push token alma
  - Token'ı backend'e kaydetme
  - Bildirim izinleri isteme
  - Bildirim dinleme (foreground)
  - Bildirim tıklama dinleme (navigation için hazır)

- ✅ `app/_layout.tsx` güncellendi
  - `useNotifications` hook'u eklendi
  - Uygulama başladığında otomatik token kaydı

### 4. Dependencies
- ✅ `expo-server-sdk` eklendi (backend)
- ✅ `expo-device` eklendi (frontend)
- ✅ `expo-notifications` zaten mevcuttu

### 5. Database Schema
- ✅ `drizzle/schema.ts` güncellendi
  - `pushTokens` tablosu tanımı eklendi
  - Type export'ları eklendi

## Özellikler

### Mevcut Özellikler
1. ✅ Push token kaydetme (iOS, Android)
2. ✅ Grup mesajlarında otomatik bildirim
3. ✅ Bildirim izinleri yönetimi
4. ✅ Foreground bildirim gösterimi
5. ✅ Bildirim tıklama desteği (navigation hazır)
6. ✅ Çoklu cihaz desteği
7. ✅ Geçersiz token temizleme

### Bildirim Gönderilen Durumlar
- ✅ Grup sohbetinde yeni mesaj geldiğinde
- 🔄 Bire bir sohbette yeni mesaj (eklenebilir)
- 🔄 Gruba davet edildiğinde (eklenebilir)
- 🔄 Mesaja yanıt verildiğinde (eklenebilir)

## Kullanım

### Backend'de Bildirim Gönderme
```typescript
import { sendPushNotification, sendPushNotificationToUsers } from "./push-notification-service";

// Tek kullanıcıya
await sendPushNotification({
  userId: 123,
  title: "Yeni Mesaj",
  body: "Ali: Merhaba!",
  data: { conversationId: 456 }
});

// Birden fazla kullanıcıya
await sendPushNotificationToUsers(
  [123, 456, 789],
  "Grup Mesajı",
  "Yeni bir mesaj var",
  { roomId: 10 }
);
```

### Frontend'de Token Yönetimi
```typescript
// Otomatik olarak app/_layout.tsx'de çalışıyor
const { expoPushToken } = useNotifications();

// Test bildirimi gönderme
const testMutation = trpc.pushNotifications.testNotification.useMutation();
await testMutation.mutateAsync();
```

## Test Etme

### 1. Fiziksel Cihazda Test
```bash
# iOS
pnpm ios

# Android
pnpm android
```

### 2. Test Bildirimi Gönderme
- Profil sayfasına test butonu eklenebilir
- Backend'den manuel test:
```typescript
await sendPushNotification({
  userId: YOUR_USER_ID,
  title: "Test",
  body: "Bu bir test bildirimidir",
  data: { type: "test" }
});
```

## Notlar

### Önemli
- ⚠️ Push notifications sadece fiziksel cihazlarda çalışır (simulator/emulator'da çalışmaz)
- ⚠️ iOS için Apple Developer hesabı ve push notification sertifikası gerekli
- ⚠️ Android için Firebase Cloud Messaging (FCM) yapılandırması gerekli

### Expo Push Notifications
- Expo'nun kendi push notification servisi kullanılıyor
- Günde 600,000 ücretsiz bildirim limiti var
- Production'da kendi push notification servisi kurulabilir

### Gelecek İyileştirmeler
- [ ] Bire bir sohbete push notification ekle
- [ ] Grup davetlerinde bildirim
- [ ] Bildirim ayarları (sessize alma, belirli sohbetleri kapatma)
- [ ] Bildirim geçmişi
- [ ] Badge sayısı yönetimi
- [ ] Bildirim kategorileri (mesaj, davet, sistem)
- [ ] Rich notifications (resim, aksiyon butonları)

## Sorun Giderme

### Token Kaydedilmiyor
1. Bildirim izinleri verilmiş mi kontrol edin
2. Fiziksel cihaz kullanıldığından emin olun
3. Console log'larını kontrol edin

### Bildirim Gelmiyor
1. Token backend'e kaydedilmiş mi kontrol edin
2. Kullanıcı aktif mi kontrol edin
3. Backend log'larını kontrol edin
4. Expo push notification servisinin çalıştığından emin olun

### iOS Sorunları
- Apple Developer hesabı gerekli
- Push notification capability'si etkinleştirilmeli
- Provisioning profile güncel olmalı

### Android Sorunları
- Firebase Cloud Messaging yapılandırması gerekli
- google-services.json dosyası eklenmiş olmalı
- Bildirim izinleri AndroidManifest.xml'de tanımlı olmalı

## Kaynaklar
- [Expo Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Push Notification Best Practices](https://docs.expo.dev/push-notifications/sending-notifications/)
