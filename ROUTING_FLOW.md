# LingoChat - Uygulama Akışı

## 🚀 Yeni Routing Yapısı (v2.2 - Onboarding Eklendi!)

### Uygulama Açılış Akışı

```
1. app/index.tsx (Splash/Loading)
   ↓
   ├─ Onboarding gösterildi mi? (AsyncStorage kontrolü)
   │  ├─ HAYIR → /onboarding (İlk kez açılış) ← YENİ!
   │  └─ EVET → Auth kontrolü
   │     ├─ Kullanıcı var → /(tabs)
   │     └─ Kullanıcı yok → /otp-login
   │
2. /onboarding (Tanıtım Sayfaları) ← YENİ!
   ↓ 4 sayfa swipe ile geçiş
   ↓ Animasyonlu pagination dots
   ↓ "Atla" butonu (son sayfa hariç)
   ↓ "Başlayalım" butonu
   ↓ AsyncStorage'a kaydet: @onboarding_completed = true
   ↓
3. /otp-login (Telefon Numarası + OTP)
   ↓ Telefon numarası gir (20+ ülke)
   ↓ OTP al ve doğrula (6 haneli)
   ↓
4. /register (Profil Oluştur)
   ↓ Ad, Soyad, Username
   ↓ Username müsaitlik kontrolü (gerçek zamanlı)
   ↓ Hesabı oluştur
   ↓
5. /(tabs) (Ana Sayfa)
   ✓ Giriş tamamlandı
```

## 📱 Onboarding Sayfaları (YENİ!)

### Sayfa 1: Hoş Geldin
- 💬 İkon: Chatbubbles
- 🎨 Renk: Mavi (#0a7ea4)
- 📝 Başlık: "LingoChat'e Hoş Geldin"
- 📄 Açıklama: "Dünya çapında dil bariyerlerini kaldıran yeni nesil mesajlaşma uygulaması"

### Sayfa 2: Dil Bariyeri
- 🌍 İkon: Globe
- 🎨 Renk: Yeşil (#4CAF50)
- 📝 Başlık: "Dil Bariyerini Kaldır"
- 📄 Açıklama: "Yapay zeka destekli otomatik çeviri ile dünyanın her yerinden insanlarla anında iletişim kur"

### Sayfa 3: Güvenlik
- 🛡️ İkon: Shield Checkmark
- 🎨 Renk: Mavi (#2196F3)
- 📝 Başlık: "Güvenli & Özel"
- 📄 Açıklama: "Mesajların şifreli ve güvende. Gizliliğin bizim için öncelik"

### Sayfa 4: Sosyal Etkileşim
- 👥 İkon: People
- 🎨 Renk: Mor (#9C27B0)
- 📝 Başlık: "Sosyal Etkileşim"
- 📄 Açıklama: "Farklı kültürlerden insanlarla bağlantı kur, dünyayı keşfet"

## 🎯 Özellikler

### Onboarding Ekranı
- ✅ 4 sayfa swipe ile geçiş
- ✅ Animasyonlu pagination dots
- ✅ "Atla" butonu (son sayfa hariç)
- ✅ "Devam" / "Başlayalım" butonu
- ✅ "Zaten hesabın var mı? Giriş Yap" linki
- ✅ AsyncStorage ile gösterilme kontrolü
- ✅ Sadece ilk açılışta gösterilir

### Akıllı Yönlendirme
```typescript
// İlk açılış (Onboarding hiç gösterilmemiş)
AsyncStorage: @onboarding_completed = null
  → /onboarding (Tanıtım sayfaları)
  → AsyncStorage'a kaydet: @onboarding_completed = "true"
  → /otp-login

// Sonraki açılışlar (Onboarding gösterilmiş)
AsyncStorage: @onboarding_completed = "true"
  ├─ Giriş yapılmamış → /otp-login
  └─ Giriş yapılmış → /(tabs)
```

## 📊 Görsel Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    UYGULAMA AÇILIR                          │
│                    (app/index.tsx)                          │
│                                                             │
│                    ⏱ Loading...                             │
│                    🔍 Kontroller                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                ┌───────────┴───────────┐
                │                       │
                ↓                       ↓
    ┌──────────────────┐    ┌──────────────────┐
    │  İLK AÇILIŞ      │    │  TEKRAR AÇILIŞ   │
    │  (Onboarding yok)│    │  (Onboarding var)│
    └──────────────────┘    └──────────────────┘
                │                       │
                ↓                       ↓
    ┌──────────────────────┐    ┌──────────┴──────────┐
    │  📱 ONBOARDING       │    │                     │
    │  ─────────────       │    ↓                     ↓
    │  1️⃣ Hoş Geldin      │  ┌─────────┐      ┌──────────┐
    │  2️⃣ Dil Bariyeri    │  │ Giriş   │      │ Giriş    │
    │  3️⃣ Güvenlik        │  │ Yapılmış│      │ Yapılmamış│
    │  4️⃣ Sosyal          │  └─────────┘      └──────────┘
    │                      │       │                 │
    │  [Başlayalım]        │       │                 │
    └──────────────────────┘       │                 │
                │                  │                 │
                ↓                  │                 ↓
    ┌──────────────────────┐       │      ┌──────────────────┐
    │  📞 OTP LOGIN        │       │      │  📞 OTP LOGIN    │
    │  ─────────────       │       │      │  ─────────────   │
    │  • Telefon No        │       │      │  • Telefon No    │
    │  • OTP Doğrula       │       │      │  • OTP Doğrula   │
    └──────────────────────┘       │      └──────────────────┘
                │                  │                 │
                ↓                  │                 ↓
    ┌──────────────────────┐       │      ┌──────────────────┐
    │  👤 REGISTER         │       │      │  👤 REGISTER     │
    │  ─────────────       │       │      │  ─────────────   │
    │  • Ad, Soyad         │       │      │  • Ad, Soyad     │
    │  • Username ✓        │       │      │  • Username ✓    │
    └──────────────────────┘       │      └──────────────────┘
                │                  │                 │
                └──────────────────┴─────────────────┘
                                   ↓
                    ┌──────────────────────────┐
                    │  🏠 ANA SAYFA            │
                    │  ─────────────           │
                    │  • Hoş geldin kartı      │
                    │  • Dil seçimi            │
                    │  • Hızlı erişim          │
                    │  • Özellikler            │
                    │                          │
                    │  ✅ Giriş Tamamlandı     │
                    └──────────────────────────┘
```

### Root Level
- `app/index.tsx` - İlk yükleme ve yönlendirme
- `app/_layout.tsx` - Root layout

### Auth Flow
- `app/otp-login.tsx` - Telefon + OTP girişi
- `app/register.tsx` - Kullanıcı kaydı

### Main App
- `app/(tabs)/_layout.tsx` - Tab navigation
- `app/(tabs)/index.tsx` - Ana sayfa
- `app/(tabs)/chats.tsx` - Sohbetler
- `app/(tabs)/settings.tsx` - Ayarlar

### Other Screens
- `app/chat-detail.tsx` - Sohbet detayı
- `app/new-chat.tsx` - Yeni sohbet
- `app/media-picker.tsx` - Medya seçici

## 🔐 Auth Kontrolü

### app/index.tsx
```typescript
useEffect(() => {
  if (!loading) {
    if (user) {
      router.replace("/(tabs)");  // Giriş yapılmış
    } else {
      router.replace("/otp-login"); // Giriş yapılmamış
    }
  }
}, [user, loading]);
```

## ✨ Yeni Özellikler

### 1. Otomatik Username Önerisi
- Ad + Soyad → username
- Örnek: "Ahmet Yılmaz" → "ahmetyilmaz"
- Otomatik küçük harf ve temizleme

### 2. Akıllı Yönlendirme
- İlk açılışta auth kontrolü
- Giriş yapılmışsa direkt ana sayfa
- Yapılmamışsa OTP login

### 3. Modal Presentation
- OTP Login: Full screen modal
- Register: Full screen modal
- Smooth geçişler

## 🎯 Kullanıcı Deneyimi

### İlk Kullanım (İlk Açılış)
```
Uygulama Aç
  ↓
Loading (AsyncStorage kontrolü)
  ↓
Onboarding Ekranı (4 sayfa)
  ↓
"Başlayalım" Butonu
  ↓
OTP Login Ekranı
  ↓
Telefon Numarası Gir
  ↓
OTP Doğrula
  ↓
Kayıt Ekranı
  ↓
Ad, Soyad, Username
  ↓
Ana Sayfa
```

### Tekrar Giriş (Onboarding Gösterilmiş)
```
Uygulama Aç
  ↓
Loading (Auth kontrolü)
  ↓
Ana Sayfa (Direkt)
```

### Çıkış Yapıp Tekrar Giriş
```
Uygulama Aç
  ↓
Loading (Onboarding atlanır)
  ↓
OTP Login Ekranı
  ↓
Telefon + OTP
  ↓
Ana Sayfa
```

## 📊 Ekran Durumları

| Ekran | Auth Gerekli | Geri Dönüş | Presentation | Gösterim |
|-------|--------------|------------|--------------|----------|
| index | Hayır | - | Default | Her açılış |
| onboarding | Hayır | Hayır | Modal | Sadece ilk açılış |
| otp-login | Hayır | Hayır | Modal | Auth gerektiğinde |
| register | Hayır | Hayır | Modal | OTP sonrası |
| (tabs) | Evet | Hayır | Default | Auth başarılı |
| chat-detail | Evet | Evet | Default | Sohbet açıldığında |
| new-chat | Evet | Evet | Default | Yeni sohbet |

## 🔄 Navigation Komutları

### Yönlendirme Tipleri
```typescript
// Replace (geri dönüş yok)
router.replace("/otp-login");
router.replace("/(tabs)");

// Push (geri dönüş var)
router.push("/chat-detail");
router.push("/register");

// Back (bir önceki ekran)
router.back();
```

## 🎨 Ekran Özellikleri

### OTP Login
- Ülke seçici (20+ ülke)
- Telefon numarası validasyonu
- 6 haneli OTP girişi
- Yeniden gönderme (60 saniye)
- Türkçe arayüz

### Register
- Ad, Soyad alanları
- Otomatik username önerisi
- Gerçek zamanlı müsaitlik kontrolü
- Yeşil ✓ / Kırmızı ✗ göstergesi
- 3 alternatif öneri
- Telefon numarası gösterimi

### Ana Sayfa
- Hoş geldin kartı
- Dil seçimi dropdown
- Hızlı erişim butonları
- Özellik kartları
- Türkçe arayüz

## 🚦 Durum Yönetimi

### Auth State
```typescript
const { user, loading } = useAuth();

// user: null → Giriş yapılmamış
// user: {...} → Giriş yapılmış
// loading: true → Kontrol ediliyor
```

### Navigation State
```typescript
// İlk yükleme
loading: true → Splash ekranı

// Auth kontrolü
user ? Ana Sayfa : OTP Login

// Kayıt tamamlandı
router.replace("/(tabs)")
```

## 📝 Notlar

1. **İlk Ekran**: Her zaman `app/index.tsx`
2. **Onboarding**: Sadece ilk açılışta gösterilir (AsyncStorage kontrolü)
3. **Auth Kontrolü**: Otomatik ve hızlı
4. **Smooth Transitions**: Modal presentation ile
5. **Geri Dönüş**: Auth ekranlarında kapalı
6. **Türkçe**: Tüm arayüz Türkçe
7. **AsyncStorage Key**: `@onboarding_completed` (string: "true")

## 🔧 Teknik Detaylar

### AsyncStorage Kullanımı
```typescript
// Onboarding gösterildi mi kontrol et
const onboardingCompleted = await AsyncStorage.getItem("@onboarding_completed");

// Onboarding tamamlandı olarak işaretle
await AsyncStorage.setItem("@onboarding_completed", "true");

// Test için sıfırla (geliştirme)
await AsyncStorage.removeItem("@onboarding_completed");
```

### Onboarding Özellikleri
- ✅ 4 sayfa swipe ile geçiş
- ✅ Horizontal ScrollView (pagingEnabled)
- ✅ Animasyonlu pagination dots
- ✅ "Atla" butonu (son sayfa hariç)
- ✅ "Devam" / "Başlayalım" butonu
- ✅ "Zaten hesabın var mı? Giriş Yap" linki
- ✅ Gesture enabled: false (geri dönüş kapalı)
- ✅ Full screen modal presentation

## 🎉 Sonuç

Artık uygulama profesyonel bir giriş akışına sahip:
- ✅ İlk açılışta onboarding (tanıtım sayfaları)
- ✅ AsyncStorage ile akıllı kontrol
- ✅ Otomatik auth kontrolü
- ✅ OTP ile güvenli giriş
- ✅ Detaylı kayıt formu
- ✅ Username benzersizlik kontrolü
- ✅ Akıllı yönlendirme
- ✅ Türkçe arayüz
- ✅ Smooth animasyonlar

**Geliştirici:** AI Assistant  
**Tarih:** 18 Şubat 2026  
**Versiyon:** 2.2.0 (Onboarding Eklendi)
