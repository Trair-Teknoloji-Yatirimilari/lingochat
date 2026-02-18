# Hesap Silme Özelliği - Apple App Store Uyumluluk Raporu

## Genel Bakış

LingoChat uygulaması, Apple App Store gerekliliklerine tam uyumlu bir hesap silme özelliği içermektedir. Kullanıcılar hesaplarını ve tüm verilerini kalıcı olarak silebilirler.

## Özellik Detayları

### 1. Kullanıcı Arayüzü

**Konum**: Profil Sayfası (`app/(tabs)/profile.tsx`)

**Buton**: "Hesabı Kalıcı Olarak Sil" (Kırmızı renk, trash ikonu)

**Erişim**: 
- Ana sayfa → Profil tabı → En altta hesap silme butonu
- Çıkış yap butonunun hemen altında
- Görünür ve kolayca erişilebilir

### 2. Güvenlik Önlemleri

**Çift Onay Sistemi**:
1. **İlk Onay**: "Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz?"
2. **İkinci Onay**: "Bu işlem geri alınamaz. Tüm mesajlarınız, profil bilgileriniz ve medya dosyalarınız kalıcı olarak silinecektir."

**Uyarılar**:
- Açık ve net uyarı mesajları
- İşlemin geri alınamaz olduğu vurgulanır
- Silinecek veri türleri listelenir

### 3. Silinen Veriler

Hesap silme işlemi aşağıdaki tüm verileri kalıcı olarak siler:

#### Veritabanı Tabloları:
1. **Read Receipts** (`readReceipts`) - Okundu bilgileri
2. **Media Messages** (`mediaMessages`) - Medya mesajları
3. **Messages** (`messages`) - Tüm mesajlar
4. **Conversations** (`conversations`) - Tüm konuşmalar
5. **Phone Verifications** (`phoneVerifications`) - Telefon doğrulamaları
6. **OTP Codes** (`otpCodes`) - OTP kodları
7. **User Profile** (`userProfiles`) - Kullanıcı profili
8. **User** (`users`) - Kullanıcı hesabı

#### Depolama:
- **Profil Fotoğrafı**: Cloudinary'den silinir (eğer varsa)
- **Medya Dosyaları**: Tüm yüklenen medya dosyaları silinir

#### Oturum:
- **Session Token**: SecureStore'dan temizlenir
- **Cookie**: Sunucu tarafında temizlenir
- **Cached User Info**: Yerel cache temizlenir

### 4. Teknik Uygulama

#### Backend Endpoint
```typescript
// server/routers.ts
profile.deleteAccount: protectedProcedure.mutation()
```

**İşlem Adımları**:
1. Profil fotoğrafını storage'dan sil
2. Veritabanından tüm ilişkili verileri sil (cascade)
3. Session cookie'yi temizle
4. Başarı mesajı döndür

#### Database Fonksiyonu
```typescript
// server/db.ts
export async function deleteUserAccount(userId: number)
```

**Özellikler**:
- Transaction güvenliği
- Detaylı loglama
- Hata yönetimi
- Cascade silme (child → parent sırası)

#### Frontend Hook
```typescript
// hooks/use-auth.ts
logout() - Session temizleme
```

**Temizlenen Veriler**:
- SecureStore session token
- Cached user info
- Local state

### 5. Kullanıcı Deneyimi

**Silme Öncesi**:
1. Kullanıcı profil sayfasına gider
2. "Hesabı Kalıcı Olarak Sil" butonuna basar
3. İlk onay dialogu görür
4. "Evet, Sil" seçeneğini seçer
5. İkinci onay dialogu görür
6. "Evet, Hesabımı Sil" seçeneğini seçer

**Silme Sırasında**:
- Loading göstergesi gösterilir
- Buton devre dışı bırakılır
- Kullanıcı işlemin tamamlanmasını bekler

**Silme Sonrası**:
1. Başarı mesajı gösterilir
2. Otomatik olarak login ekranına yönlendirilir
3. Session tamamen temizlenir
4. Kullanıcı yeniden giriş yapamaz (hesap yok)

### 6. Yasal Uyumluluk

#### Gizlilik Politikası
**Dosya**: `legal/privacy-policy.md` ve `app/legal/privacy.tsx`

**İçerik**:
- Hesap silme hakkı açıkça belirtilmiş
- Silme süreci detaylı açıklanmış
- 30 gün içinde tamamlanma garantisi
- İletişim bilgileri verilmiş

#### Kullanım Şartları
**Dosya**: `legal/terms-of-service.md` ve `app/legal/terms.tsx`

**İçerik**:
- Hesap silme prosedürü açıklanmış
- Geri alınamaz işlem uyarısı
- Silinecek veri türleri listelenmişş
- Alternatif iletişim yolu (e-posta)

### 7. Apple App Store Gereksinimleri

✅ **Gereksinim 1**: Hesap silme özelliği uygulamada mevcut
- Profil sayfasında açıkça görünür buton

✅ **Gereksinim 2**: Kolay erişilebilir
- 2 tıklama ile erişilebilir (Profil → Sil butonu)

✅ **Gereksinim 3**: Açık uyarılar
- Çift onay sistemi
- Net uyarı mesajları

✅ **Gereksinim 4**: Tüm veriler silinir
- Veritabanı, storage, cache tamamen temizlenir

✅ **Gereksinim 5**: Yasal dokümantasyon
- Gizlilik politikası ve kullanım şartlarında açıklanmış

✅ **Gereksinim 6**: Alternatif iletişim
- E-posta ile de hesap silme talebi yapılabilir (info@trairx.com)

### 8. Test Senaryoları

#### Manuel Test Adımları:
1. ✓ Yeni hesap oluştur
2. ✓ Profil bilgilerini doldur
3. ✓ Profil fotoğrafı yükle
4. ✓ Birkaç mesaj gönder
5. ✓ Profil → Hesabı Sil butonuna bas
6. ✓ İki onay dialogunu geç
7. ✓ Login ekranına yönlendirildiğini doğrula
8. ✓ Aynı telefon numarası ile yeni hesap oluşturabildiğini doğrula
9. ✓ Eski verilerin olmadığını doğrula

#### Otomatik Test:
**Dosya**: `tests/account-deletion.test.ts`

### 9. Güvenlik Önlemleri

1. **Authentication**: Sadece giriş yapmış kullanıcılar silebilir
2. **Authorization**: Kullanıcı sadece kendi hesabını silebilir
3. **Confirmation**: Çift onay ile yanlışlıkla silme önlenir
4. **Logging**: Tüm silme işlemleri loglanır
5. **Error Handling**: Hata durumunda kullanıcı bilgilendirilir

### 10. İletişim ve Destek

**Hesap Silme Desteği**:
- E-posta: info@trairx.com
- Şirket: TrairX Technology O.Ü
- Konum: Estonya

**Yanıt Süresi**: 48 saat içinde

## Sonuç

LingoChat uygulaması, Apple App Store'un hesap silme gerekliliklerine tam uyumludur:

✅ Özellik uygulamada mevcut ve çalışıyor
✅ Kullanıcı arayüzü açık ve erişilebilir
✅ Tüm veriler kalıcı olarak siliniyor
✅ Yasal dokümantasyon eksiksiz
✅ Güvenlik önlemleri alınmış
✅ Test edilebilir ve doğrulanabilir

**Apple Review için hazır!**

---

**Son Güncelleme**: 18 Şubat 2026
**Versiyon**: 1.0.0
**Durum**: ✅ Uyumlu ve Hazır
