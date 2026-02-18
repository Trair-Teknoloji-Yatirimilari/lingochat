# LingoChat App - Arayüz Tasarımı

## Uygulama Amacı
Kullanıcıların dil bariyerini ortadan kaldırarak, farklı dillerde konuşan insanlarla gerçek zamanlı mesajlaşma yapabilmesini sağlayan basit bir mesajlaşma uygulaması. OpenAI API kullanarak mesajlar otomatik olarak çevrilir.

## Ekran Listesi

1. **Giriş Ekranı (Login/Signup)**
   - E-posta ve şifre ile kayıt/giriş
   - Dil seçimi (Türkçe, İngilizce, Fransızca, İspanyolca, Almanca, Japonca, Çince vb.)
   - Kullanıcı adı girişi

2. **Sohbet Listesi (Chat List)**
   - Aktif sohbetlerin listesi
   - Her sohbette son mesaj önizlemesi
   - Sohbet oluşturma butonu (+ simgesi)

3. **Sohbet Detayı (Chat Detail)**
   - Mesaj geçmişi (scroll yapılabilir)
   - Gönderici/alıcı bilgisi ve dil bilgisi
   - Mesaj giriş alanı ve gönder butonu
   - Her mesajın orijinal ve çevrilmiş versiyonu

4. **Ayarlar (Settings)**
   - Kullanıcı profili
   - Dil seçimi değiştirme
   - Çıkış (Logout)

## Birincil İçerik ve İşlevsellik

### Giriş Ekranı
- **İçerik**: Logo, başlık, e-posta input, şifre input, dil dropdown, kullanıcı adı input
- **İşlevsellik**: 
  - Yeni kullanıcı kaydı
  - Mevcut kullanıcı girişi
  - Dil seçimi (ilk kurulum sırasında)

### Sohbet Listesi
- **İçerik**: 
  - Sohbet kartları (kullanıcı adı, son mesaj, zaman damgası)
  - Yeni sohbet oluşturma butonu
- **İşlevsellik**:
  - Sohbetleri görüntüleme
  - Sohbete tıklayarak detay ekranına gitme
  - Yeni sohbet başlatma

### Sohbet Detayı
- **İçerik**:
  - Mesaj baloncukları (gönderici/alıcı ayrımı)
  - Her mesajda orijinal ve çevrilmiş metin
  - Mesaj gönderme formu
- **İşlevsellik**:
  - Mesajları görüntüleme
  - Mesaj gönderme
  - OpenAI API ile otomatik çeviri
  - Mesaj geçmişini yükleme

### Ayarlar
- **İçerik**: Profil bilgisi, dil seçimi, çıkış butonu
- **İşlevsellik**: Dil değiştirme, oturumu kapatma

## Temel Kullanıcı Akışları

### Akış 1: Yeni Kullanıcı Kaydı
1. Uygulama açılır → Giriş Ekranı
2. "Kayıt Ol" seçeneğine tıklar
3. E-posta, şifre, kullanıcı adı girer
4. **Dil seçimi yapar** (ÖNEMLI: Bu adım kullanıcının tercih ettiği dili belirler)
5. "Kayıt Ol" butonuna tıklar
6. Sohbet Listesi ekranına yönlendirilir

### Akış 2: Mevcut Kullanıcı Girişi
1. Giriş Ekranı açılır
2. E-posta ve şifre girer
3. "Giriş Yap" butonuna tıklar
4. Sohbet Listesi ekranına yönlendirilir

### Akış 3: Mesaj Gönderme ve Çeviri
1. Sohbet Listesi → Bir sohbete tıklar
2. Sohbet Detayı ekranı açılır
3. Mesaj giriş alanına metin yazar
4. "Gönder" butonuna tıklar
5. Mesaj gönderilir ve:
   - **Alıcının dili otomatik olarak algılanır**
   - **OpenAI API çağrılır**
   - **Mesaj alıcının diline çevrilir**
   - **Hem orijinal hem çevrilmiş metin gösterilir**
6. Alıcı mesajı görür ve yanıt verebilir (aynı çeviri işlemi tekrarlanır)

### Akış 4: Dil Değiştirme
1. Ayarlar ekranına gider
2. "Dil Seçimi" seçeneğine tıklar
3. Yeni dili seçer
4. Değişiklik kaydedilir ve uygulamaya geri dönülür

## Renk Seçimleri

- **Birincil Renk**: #0a7ea4 (Mavi - İletişim ve güven)
- **Arka Plan**: #ffffff (Açık) / #151718 (Koyu)
- **Yüzey**: #f5f5f5 (Açık) / #1e2022 (Koyu)
- **Metin**: #11181C (Açık) / #ECEDEE (Koyu)
- **İkincil Metin**: #687076 (Açık) / #9BA1A6 (Koyu)
- **Başarı**: #22C55E (Yeşil - Mesaj gönderildi)
- **Hata**: #EF4444 (Kırmızı - Hata durumları)

## Mobil Tasarım Özellikleri

- **Oryantasyon**: Dikey (Portrait 9:16)
- **Bir El Kullanımı**: Tüm butonlar ve kontroller alt yarıda erişilebilir
- **iOS HIG Uyumluluğu**: Native iOS uygulaması gibi hissettirilecek
- **Tab Bar**: Sohbet Listesi ve Ayarlar sekmelerine hızlı erişim
