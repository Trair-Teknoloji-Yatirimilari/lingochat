# 🧪 LingoChat - Kapsamlı Test Senaryosu

## 📱 Test Ortamı
- **Platform**: iOS Simulator (Fresh Install)
- **Tarih**: 20 Şubat 2026
- **Versiyon**: 1.0.0

---

## ✅ Test Checklist

### 1. İlk Açılış ve Onboarding (5 dk)
- [ ] Uygulama açılıyor
- [ ] Splash screen görünüyor
- [ ] Onboarding ekranları İngilizce
- [ ] 3 slide görünüyor
- [ ] "Get Started" butonu çalışıyor

**Beklenen**: Onboarding tamamlandıktan sonra OTP login ekranı

---

### 2. Giriş ve Kayıt (5 dk)

#### OTP Login
- [ ] Telefon numarası girişi çalışıyor
- [ ] Ülke kodu seçimi çalışıyor
- [ ] "Send Code" butonu çalışıyor
- [ ] OTP kodu geliyor
- [ ] 6 haneli kod girişi çalışıyor
- [ ] "Verify" butonu çalışıyor

**Test Numarası**: +90 532 164 6788  
**OTP**: Herhangi bir 6 haneli kod (dev mode)

#### Profil Oluşturma
- [ ] Username girişi çalışıyor
- [ ] Dil seçimi çalışıyor
- [ ] "Continue" butonu çalışıyor
- [ ] Profil oluşturuluyor

**Test Username**: testuser1

---

### 3. Ana Sayfa ve Navigasyon (5 dk)

#### Tab Bar
- [ ] Home tab görünüyor
- [ ] Chats tab görünüyor
- [ ] Groups tab görünüyor
- [ ] Profile tab görünüyor
- [ ] Tab değişimi çalışıyor

#### Home Tab
- [ ] "Home" yazısı görünüyor (İngilizce)
- [ ] Boş state mesajı görünüyor
- [ ] UI düzgün görünüyor

---

### 4. Dil Değiştirme (10 dk)

#### Profile → Language
- [ ] Profile tab'a git
- [ ] "Language Preference" görünüyor
- [ ] Dil seçimi açılıyor
- [ ] 4 dil görünüyor: English, Türkçe, Русский, Deutsch

#### Her Dili Test Et:
**İngilizce**:
- [ ] Dil değişti
- [ ] Tüm metinler İngilizce
- [ ] Tab isimleri İngilizce
- [ ] Profile sayfası İngilizce

**Türkçe**:
- [ ] Dil değişti
- [ ] Tüm metinler Türkçe
- [ ] Tab isimleri Türkçe
- [ ] Profile sayfası Türkçe

**Rusça**:
- [ ] Dil değişti
- [ ] Tüm metinler Rusça
- [ ] Tab isimleri Rusça
- [ ] Profile sayfası Rusça

**Almanca**:
- [ ] Dil değişti
- [ ] Tüm metinler Almanca
- [ ] Tab isimleri Almanca
- [ ] Profile sayfası Almanca

**Geri İngilizce'ye dön**

---

### 5. Profil Özellikleri (10 dk)

#### Profil Bilgileri
- [ ] Username görünüyor
- [ ] Telefon numarası görünüyor
- [ ] User ID görünüyor
- [ ] Dil tercihi görünüyor

#### Profil Fotoğrafı
- [ ] "Upload Photo" butonu çalışıyor
- [ ] Galeri izni isteniyor
- [ ] Fotoğraf seçimi çalışıyor
- [ ] Fotoğraf yükleniyor
- [ ] Profil fotoğrafı görünüyor
- [ ] "Delete Photo" butonu çalışıyor
- [ ] Fotoğraf siliniyor

#### Ayarlar
- [ ] Read Receipts toggle çalışıyor
- [ ] Online Status toggle çalışıyor
- [ ] Profile Photo toggle çalışıyor
- [ ] Auto-Delete Messages seçimi çalışıyor

#### Yasal Sayfalar
- [ ] Privacy Policy açılıyor
- [ ] Terms of Service açılıyor
- [ ] İçerik görünüyor
- [ ] Geri dönüş çalışıyor

---

### 6. Mesajlaşma (15 dk)

#### Yeni Sohbet Oluşturma
- [ ] Chats tab'a git
- [ ] "+" butonu görünüyor
- [ ] "New Chat" açılıyor
- [ ] "Load Contacts" butonu çalışıyor
- [ ] Kişi izni isteniyor
- [ ] Username arama çalışıyor

**Test**: İkinci bir kullanıcı oluştur (başka simulator/cihaz)

#### Mesaj Gönderme
- [ ] Sohbet açılıyor
- [ ] Mesaj input çalışıyor
- [ ] Mesaj gönderiliyor
- [ ] Mesaj görünüyor
- [ ] Timestamp görünüyor
- [ ] Read receipt görünüyor (✓ veya ✓✓)

#### Mesaj Alma
- [ ] Karşı taraftan mesaj geliyor
- [ ] Mesaj görünüyor
- [ ] Çeviri çalışıyor (farklı dil seçiliyse)
- [ ] "Original" butonu çalışıyor

#### Mesaj Özellikleri
- [ ] Mesaj silme (long press)
- [ ] Mesaj kopyalama
- [ ] Mesaj yanıtlama
- [ ] Kullanıcı engelleme

---

### 7. Medya Paylaşımı (10 dk)

#### Medya Menüsü
- [ ] "+" butonu (medya) çalışıyor
- [ ] 5 seçenek görünüyor:
  - Camera
  - Gallery
  - Document
  - Location
  - Contact

#### Fotoğraf Paylaşımı
- [ ] Gallery seçimi çalışıyor
- [ ] Fotoğraf seçimi çalışıyor
- [ ] Önizleme görünüyor
- [ ] Caption eklenebiliyor
- [ ] Gönderme çalışıyor
- [ ] Fotoğraf görünüyor

#### Belge Paylaşımı
- [ ] Document seçimi çalışıyor
- [ ] Belge seçimi çalışıyor
- [ ] Gönderme çalışıyor
- [ ] Belge görünüyor
- [ ] İndirme çalışıyor

#### Konum Paylaşımı
- [ ] Location seçimi çalışıyor
- [ ] Konum izni isteniyor
- [ ] Konum gönderiliyor
- [ ] Harita görünüyor
- [ ] Google Maps linki çalışıyor

---

### 8. Grup Sohbetleri (15 dk)

#### Grup Oluşturma
- [ ] Groups tab'a git
- [ ] "Create Room" butonu çalışıyor
- [ ] Oda adı girişi çalışıyor
- [ ] Açıklama girişi çalışıyor
- [ ] Max katılımcı seçimi çalışıyor
- [ ] "Create Room" çalışıyor
- [ ] Oda oluşturuluyor

#### Grup Mesajlaşma
- [ ] Grup sohbeti açılıyor
- [ ] Mesaj gönderiliyor
- [ ] Mesaj görünüyor
- [ ] Çeviri çalışıyor
- [ ] Katılımcılar görünüyor

#### Katılımcı Davet
- [ ] "Invite" butonu çalışıyor
- [ ] Kullanıcı arama çalışıyor
- [ ] Kullanıcı seçimi çalışıyor
- [ ] Davet gönderiliyor
- [ ] Katılımcı ekleniyor

#### AI Toplantı Özeti
- [ ] En az 5 mesaj gönder
- [ ] "Generate Summary" butonu çalışıyor
- [ ] Özet oluşturuluyor
- [ ] Özet görünüyor
- [ ] Ana konular görünüyor
- [ ] Kararlar görünüyor
- [ ] Paylaşım çalışıyor

---

### 9. Push Notifications (5 dk)

**Not**: Simulator'da push notification test edilemez, gerçek cihaz gerekir

- [ ] Notification izni isteniyor
- [ ] Token kaydediliyor
- [ ] (Gerçek cihazda test edilecek)

---

### 10. Hesap Silme (5 dk)

#### Hesap Silme Akışı
- [ ] Profile → "Delete Account Permanently"
- [ ] İlk onay dialogu açılıyor
- [ ] "Yes, Delete" seçiliyor
- [ ] İkinci onay dialogu açılıyor
- [ ] "Yes, Delete My Account" seçiliyor
- [ ] Loading göstergesi görünüyor
- [ ] Başarı mesajı görünüyor
- [ ] Login ekranına yönlendiriliyor

#### Silme Doğrulama
- [ ] Aynı numara ile yeni hesap oluşturulabiliyor
- [ ] Eski veriler yok
- [ ] Temiz başlangıç

---

## 🐛 Bug Raporu

### Bulunan Buglar:
1. **Bug Adı**: 
   - **Açıklama**: 
   - **Adımlar**: 
   - **Beklenen**: 
   - **Gerçekleşen**: 
   - **Öncelik**: 🔴 Kritik / 🟡 Orta / 🟢 Düşük

---

## 📊 Test Sonuçları

### Genel Durum:
- **Toplam Test**: 100+
- **Başarılı**: 
- **Başarısız**: 
- **Atlandı**: 

### Kritik Özellikler:
- [ ] ✅ Giriş/Kayıt
- [ ] ✅ Mesajlaşma
- [ ] ✅ Çeviri
- [ ] ✅ Dil Değiştirme
- [ ] ✅ Medya Paylaşımı
- [ ] ✅ Grup Sohbetleri
- [ ] ✅ Hesap Silme

### Dil Testleri:
- [ ] ✅ İngilizce
- [ ] ✅ Türkçe
- [ ] ✅ Rusça
- [ ] ✅ Almanca

---

## 🎯 Sonuç

**Test Durumu**: ⏳ Devam Ediyor

**Notlar**:
- 
- 
- 

**Sonraki Adımlar**:
1. Bug'ları düzelt
2. Yeniden test et
3. Preview build al
4. Gerçek cihazda test et

---

**Test Eden**: 
**Tarih**: 20 Şubat 2026  
**Süre**: ~90 dakika
