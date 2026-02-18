import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              Gizlilik Politikası
            </Text>
            <Text className="text-xs text-muted">
              Son Güncelleme: 18 Şubat 2026
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Section title="1. Giriş">
            <Text className="text-sm text-foreground leading-6">
              LingoChat uygulaması ("Uygulama"), TrairX Technology O.Ü ("Şirket", "biz", "bizim") tarafından işletilmektedir. Şirket merkezi Estonya'da bulunmaktadır.
            </Text>
            <Text className="text-sm text-foreground leading-6 mt-3">
              Bu Gizlilik Politikası, Uygulamamızı kullandığınızda kişisel bilgilerinizin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                İletişim Bilgileri:
              </Text>
              <Text className="text-xs text-muted">Şirket: TrairX Technology O.Ü</Text>
              <Text className="text-xs text-muted">E-posta: info@trairx.com</Text>
              <Text className="text-xs text-muted">Adres: Estonya</Text>
            </InfoBox>
          </Section>

          <Section title="2. Topladığımız Bilgiler">
            <SubSection title="2.1 Kullanıcı Tarafından Sağlanan Bilgiler">
              <BulletPoint>Telefon Numarası: Hesap oluşturma ve kimlik doğrulama için</BulletPoint>
              <BulletPoint>Kullanıcı Adı: Profil oluşturma için</BulletPoint>
              <BulletPoint>Profil Fotoğrafı: İsteğe bağlı, profil özelleştirme için</BulletPoint>
              <BulletPoint>Dil Tercihi: Uygulama deneyimini kişiselleştirmek için</BulletPoint>
            </SubSection>

            <SubSection title="2.2 Otomatik Olarak Toplanan Bilgiler">
              <BulletPoint>Cihaz Bilgileri: Cihaz modeli, işletim sistemi versiyonu</BulletPoint>
              <BulletPoint>Kullanım Verileri: Uygulama kullanım istatistikleri</BulletPoint>
              <BulletPoint>Log Verileri: Hata raporları ve performans verileri</BulletPoint>
            </SubSection>

            <SubSection title="2.3 Mesajlaşma Verileri">
              <BulletPoint>Mesaj İçeriği: Çeviri hizmeti sağlamak için geçici olarak işlenir</BulletPoint>
              <BulletPoint>Mesaj Meta Verileri: Gönderim zamanı, alıcı bilgisi</BulletPoint>
              <BulletPoint>Medya Dosyaları: Paylaşılan resim, video ve dosyalar</BulletPoint>
            </SubSection>
          </Section>

          <Section title="3. Bilgilerin Kullanımı">
            <Text className="text-sm text-foreground leading-6 mb-3">
              Topladığımız bilgileri şu amaçlarla kullanırız:
            </Text>
            <BulletPoint>Hizmet Sağlama: Mesajlaşma ve çeviri hizmetlerini sunmak</BulletPoint>
            <BulletPoint>Kimlik Doğrulama: Hesap güvenliğini sağlamak</BulletPoint>
            <BulletPoint>Kişiselleştirme: Dil tercihlerinize göre deneyim sunmak</BulletPoint>
            <BulletPoint>İyileştirme: Uygulama performansını ve özelliklerini geliştirmek</BulletPoint>
            <BulletPoint>Destek: Teknik destek ve müşteri hizmetleri sağlamak</BulletPoint>
            <BulletPoint>Güvenlik: Dolandırıcılık ve kötüye kullanımı önlemek</BulletPoint>
          </Section>

          <Section title="4. Bilgi Paylaşımı">
            <Text className="text-sm text-foreground leading-6 mb-3">
              Kişisel bilgilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:
            </Text>

            <SubSection title="4.1 Hizmet Sağlayıcılar">
              <BulletPoint>Çeviri Hizmetleri: OpenAI API (mesaj çevirisi için)</BulletPoint>
              <BulletPoint>Bulut Depolama: Profil fotoğrafları ve medya dosyaları için</BulletPoint>
              <BulletPoint>Altyapı Sağlayıcıları: Sunucu ve veritabanı hizmetleri</BulletPoint>
            </SubSection>

            <SubSection title="4.2 Yasal Gereklilikler">
              <BulletPoint>Yasal yükümlülüklere uymak için</BulletPoint>
              <BulletPoint>Haklarımızı, mülkiyetimizi veya güvenliğimizi korumak için</BulletPoint>
              <BulletPoint>Acil durumlarda kamu güvenliğini sağlamak için</BulletPoint>
            </SubSection>
          </Section>

          <Section title="5. Veri Saklama">
            <BulletPoint>Aktif Hesaplar: Hesabınız aktif olduğu sürece verilerinizi saklarız</BulletPoint>
            <BulletPoint>Mesajlar: Silinen mesajlar kalıcı olarak kaldırılır</BulletPoint>
            <BulletPoint>Hesap Silme: Hesabınızı sildiğinizde tüm kişisel verileriniz 30 gün içinde silinir</BulletPoint>
            <BulletPoint>Yasal Saklama: Yasal gerekliliklere göre bazı veriler daha uzun süre saklanabilir</BulletPoint>
          </Section>

          <Section title="6. Veri Güvenliği">
            <Text className="text-sm text-foreground leading-6 mb-3">
              Bilgilerinizi korumak için şu önlemleri alırız:
            </Text>
            <BulletPoint>Şifreleme: Veri iletimi ve depolama sırasında şifreleme</BulletPoint>
            <BulletPoint>Erişim Kontrolü: Sınırlı personel erişimi</BulletPoint>
            <BulletPoint>Güvenlik Testleri: Düzenli güvenlik denetimleri</BulletPoint>
            <BulletPoint>Güvenli Sunucular: Endüstri standardı güvenlik protokolleri</BulletPoint>
          </Section>

          <Section title="7. Çocukların Gizliliği">
            <Text className="text-sm text-foreground leading-6">
              Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaşın altındaki çocuklardan kişisel bilgi toplamayız. Eğer 13 yaşın altında bir çocuğun bilgilerini topladığımızı fark edersek, bu bilgileri derhal sileriz.
            </Text>
          </Section>

          <Section title="8. Haklarınız">
            <Text className="text-sm text-foreground leading-6 mb-3">
              GDPR ve diğer veri koruma yasaları kapsamında aşağıdaki haklara sahipsiniz:
            </Text>
            <BulletPoint>Erişim Hakkı: Kişisel verilerinize erişim talep edebilirsiniz</BulletPoint>
            <BulletPoint>Düzeltme Hakkı: Yanlış veya eksik bilgileri düzeltebilirsiniz</BulletPoint>
            <BulletPoint>Silme Hakkı: Verilerinizin silinmesini talep edebilirsiniz</BulletPoint>
            <BulletPoint>İtiraz Hakkı: Veri işlemeye itiraz edebilirsiniz</BulletPoint>
            <BulletPoint>Taşınabilirlik Hakkı: Verilerinizi yapılandırılmış formatta alabilirsiniz</BulletPoint>
            <BulletPoint>Şikayet Hakkı: Veri koruma otoritesine şikayette bulunabilirsiniz</BulletPoint>
            
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-2">
                Hesabınızı Silme
              </Text>
              <Text className="text-xs text-muted leading-5">
                Hesabınızı ve tüm verilerinizi kalıcı olarak silmek için Profil sayfasından "Hesabı Kalıcı Olarak Sil" butonunu kullanabilirsiniz. Bu işlem geri alınamaz ve tüm verileriniz 30 gün içinde kalıcı olarak silinir.
              </Text>
            </InfoBox>
          </Section>

          <Section title="9. İletişim">
            <Text className="text-sm text-foreground leading-6 mb-3">
              Gizlilik Politikamız hakkında sorularınız veya endişeleriniz varsa bizimle iletişime geçin:
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                TrairX Technology O.Ü
              </Text>
              <Text className="text-xs text-muted">E-posta: info@trairx.com</Text>
              <Text className="text-xs text-muted">Web: LingoChat Uygulaması</Text>
            </InfoBox>
          </Section>

          <View
            style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 12,
              padding: 16,
              marginTop: 20,
              marginBottom: 40,
            }}
          >
            <Text className="text-xs text-muted text-center leading-5">
              Bu Gizlilik Politikası, Apple App Store ve Google Play Store gerekliliklerine uygun olarak hazırlanmıştır ve GDPR, KVKK ve diğer veri koruma düzenlemelerine uygundur.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View className="mb-6">
      <Text
        style={{ color: colors.primary }}
        className="text-base font-bold mb-3"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-3 mt-2">
      <Text className="text-sm font-semibold text-foreground mb-2">
        {title}
      </Text>
      {children}
    </View>
  );
}

function BulletPoint({ children }: { children: string }) {
  return (
    <View className="flex-row mb-2">
      <Text className="text-sm text-muted mr-2">•</Text>
      <Text className="text-sm text-foreground flex-1 leading-5">{children}</Text>
    </View>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}
