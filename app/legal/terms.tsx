import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function TermsOfServiceScreen() {
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
              Kullanım Şartları
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
          <Section title="1. Kabul ve Anlaşma">
            <Text className="text-sm text-foreground leading-6">
              LingoChat uygulamasını ("Uygulama", "Hizmet") kullanarak, TrairX Technology O.Ü ("Şirket", "biz", "bizim") tarafından belirlenen bu Kullanım Şartlarını kabul etmiş olursunuz.
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                Şirket Bilgileri:
              </Text>
              <Text className="text-xs text-muted">Şirket Adı: TrairX Technology O.Ü</Text>
              <Text className="text-xs text-muted">Kayıt Yeri: Estonya</Text>
              <Text className="text-xs text-muted">E-posta: info@trairx.com</Text>
            </InfoBox>
          </Section>

          <Section title="2. Hizmet Tanımı">
            <Text className="text-sm text-foreground leading-6 mb-3">
              LingoChat, kullanıcıların farklı dillerde mesajlaşmasını sağlayan, yapay zeka destekli otomatik çeviri özellikli bir mesajlaşma uygulamasıdır.
            </Text>
            <SubSection title="2.1 Sunulan Hizmetler">
              <BulletPoint>Anlık mesajlaşma</BulletPoint>
              <BulletPoint>Otomatik dil çevirisi</BulletPoint>
              <BulletPoint>Medya paylaşımı (resim, video, dosya)</BulletPoint>
              <BulletPoint>Sesli arama</BulletPoint>
              <BulletPoint>Profil yönetimi</BulletPoint>
            </SubSection>
          </Section>

          <Section title="3. Hesap Oluşturma ve Güvenlik">
            <SubSection title="3.1 Hesap Gereksinimleri">
              <BulletPoint>En az 13 yaşında olmalısınız</BulletPoint>
              <BulletPoint>Geçerli bir telefon numarası sağlamalısınız</BulletPoint>
              <BulletPoint>Doğru ve güncel bilgiler vermelisiniz</BulletPoint>
              <BulletPoint>Benzersiz bir kullanıcı adı seçmelisiniz</BulletPoint>
            </SubSection>

            <SubSection title="3.2 Hesap Güvenliği">
              <BulletPoint>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz</BulletPoint>
              <BulletPoint>Hesabınızda gerçekleşen tüm aktivitelerden sorumlusunuz</BulletPoint>
              <BulletPoint>Yetkisiz erişim durumunda derhal bizi bilgilendirmelisiniz</BulletPoint>
              <BulletPoint>Hesabınızı başkalarıyla paylaşamazsınız</BulletPoint>
            </SubSection>

            <SubSection title="3.3 Hesap Silme">
              <Text className="text-sm text-foreground leading-6 mb-2">
                Hesabınızı istediğiniz zaman silebilirsiniz:
              </Text>
              <BulletPoint>Profil sayfasından "Hesabı Kalıcı Olarak Sil" butonunu kullanın</BulletPoint>
              <BulletPoint>İşlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir</BulletPoint>
              <BulletPoint>Mesajlar, profil bilgileri ve medya dosyaları dahil tüm veriler silinir</BulletPoint>
              <BulletPoint>Silme işlemi 30 gün içinde tamamlanır</BulletPoint>
            </SubSection>
          </Section>

          <Section title="4. Kabul Edilebilir Kullanım">
            <Text className="text-sm text-foreground leading-6 mb-3">
              Aşağıdaki davranışlar kesinlikle yasaktır:
            </Text>
            <SubSection title="İçerik İhlalleri">
              <BulletPoint>Yasadışı, zararlı, tehdit edici içerik paylaşmak</BulletPoint>
              <BulletPoint>Nefret söylemi, ayrımcılık veya şiddet içeren içerik</BulletPoint>
              <BulletPoint>Pornografik veya müstehcen içerik</BulletPoint>
              <BulletPoint>Telif hakkı ihlali yapan içerik</BulletPoint>
            </SubSection>

            <SubSection title="Güvenlik İhlalleri">
              <BulletPoint>Uygulamayı tersine mühendislik yapmak</BulletPoint>
              <BulletPoint>Güvenlik açıklarını istismar etmek</BulletPoint>
              <BulletPoint>Kötü amaçlı yazılım yaymak</BulletPoint>
              <BulletPoint>Diğer kullanıcıların hesaplarına yetkisiz erişim</BulletPoint>
            </SubSection>

            <SubSection title="Spam ve Kötüye Kullanım">
              <BulletPoint>Spam veya istenmeyen toplu mesajlar göndermek</BulletPoint>
              <BulletPoint>Dolandırıcılık veya phishing faaliyetleri</BulletPoint>
              <BulletPoint>Yanıltıcı veya sahte bilgiler yaymak</BulletPoint>
              <BulletPoint>Otomatik botlar veya scriptler kullanmak</BulletPoint>
            </SubSection>
          </Section>

          <Section title="5. İçerik ve Fikri Mülkiyet">
            <SubSection title="5.1 Kullanıcı İçeriği">
              <BulletPoint>Paylaştığınız içeriğin sorumluluğu size aittir</BulletPoint>
              <BulletPoint>İçeriğiniz için gerekli tüm haklara sahip olduğunuzu garanti edersiniz</BulletPoint>
              <BulletPoint>Yasadışı veya ihlal edici içerik paylaşamazsınız</BulletPoint>
            </SubSection>

            <SubSection title="5.2 Şirket Fikri Mülkiyeti">
              <BulletPoint>Uygulama ve tüm içeriği Şirketin mülkiyetindedir</BulletPoint>
              <BulletPoint>"LingoChat" markası Şirketin tescilli markasıdır</BulletPoint>
              <BulletPoint>İzinsiz kullanım, kopyalama veya dağıtım yasaktır</BulletPoint>
            </SubSection>
          </Section>

          <Section title="6. Gizlilik">
            <Text className="text-sm text-foreground leading-6">
              Kişisel bilgilerinizin toplanması, kullanılması ve korunması Gizlilik Politikamızda açıklanmıştır. Uygulamayı kullanarak Gizlilik Politikamızı da kabul etmiş olursunuz.
            </Text>
          </Section>

          <Section title="7. Sorumluluk Reddi">
            <SubSection title="7.1 'Olduğu Gibi' Hizmet">
              <Text className="text-sm text-foreground leading-6 mb-2">
                Hizmet "olduğu gibi" ve "mevcut olduğu şekilde" sağlanır. Hiçbir garanti vermeyiz:
              </Text>
              <BulletPoint>Hizmetin kesintisiz veya hatasız olacağına dair</BulletPoint>
              <BulletPoint>Çeviri doğruluğuna dair</BulletPoint>
              <BulletPoint>Güvenlik ihlallerine karşı mutlak koruma</BulletPoint>
            </SubSection>

            <SubSection title="7.2 Çeviri Hizmeti">
              <BulletPoint>Otomatik çeviriler %100 doğru olmayabilir</BulletPoint>
              <BulletPoint>Önemli iletişimlerde profesyonel çeviri kullanmanızı öneririz</BulletPoint>
              <BulletPoint>Çeviri hatalarından kaynaklanan sorunlardan sorumlu değiliz</BulletPoint>
            </SubSection>
          </Section>

          <Section title="8. Sorumluluk Sınırlaması">
            <Text className="text-sm text-foreground leading-6 mb-2">
              Yasaların izin verdiği ölçüde:
            </Text>
            <BulletPoint>Dolaylı, arızi veya sonuç olarak ortaya çıkan zararlardan sorumlu değiliz</BulletPoint>
            <BulletPoint>Veri kaybı, kar kaybı veya iş kaybından sorumlu değiliz</BulletPoint>
            <BulletPoint>Toplam sorumluluğumuz son 12 ayda ödediğiniz ücretlerle sınırlıdır</BulletPoint>
          </Section>

          <Section title="9. Uyuşmazlık Çözümü">
            <SubSection title="9.1 Uygulanacak Hukuk">
              <Text className="text-sm text-foreground leading-6">
                Bu Kullanım Şartları Estonya yasalarına tabidir.
              </Text>
            </SubSection>

            <SubSection title="9.2 Yargı Yetkisi">
              <Text className="text-sm text-foreground leading-6">
                Uyuşmazlıklar Estonya mahkemelerinde çözülecektir.
              </Text>
            </SubSection>

            <SubSection title="9.3 Dostane Çözüm">
              <Text className="text-sm text-foreground leading-6">
                Herhangi bir uyuşmazlık durumunda, önce info@trairx.com adresi üzerinden bizimle iletişime geçmenizi rica ederiz.
              </Text>
            </SubSection>
          </Section>

          <Section title="10. Apple App Store Özel Hükümler">
            <SubSection title="10.1 Apple ile İlişki">
              <BulletPoint>Bu sözleşme sizinle TrairX Technology O.Ü arasındadır, Apple ile değil</BulletPoint>
              <BulletPoint>Apple, Uygulamadan veya içeriğinden sorumlu değildir</BulletPoint>
              <BulletPoint>Apple'ın Uygulamaya ilişkin herhangi bir garanti yükümlülüğü yoktur</BulletPoint>
            </SubSection>

            <SubSection title="10.2 Bakım ve Destek">
              <BulletPoint>Bakım ve destek hizmetlerinden TrairX Technology O.Ü sorumludur</BulletPoint>
              <BulletPoint>Apple'ın bakım veya destek yükümlülüğü yoktur</BulletPoint>
            </SubSection>

            <SubSection title="10.3 Üçüncü Taraf Lehtar">
              <Text className="text-sm text-foreground leading-6">
                Apple, bu Kullanım Şartlarının üçüncü taraf lehtarıdır ve şartları kabul ettiğinizde Apple'ın bu şartları size karşı uygulama hakkı vardır.
              </Text>
            </SubSection>
          </Section>

          <Section title="11. İletişim">
            <Text className="text-sm text-foreground leading-6 mb-3">
              Sorularınız veya endişeleriniz için:
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                TrairX Technology O.Ü
              </Text>
              <Text className="text-xs text-muted">E-posta: info@trairx.com</Text>
              <Text className="text-xs text-muted">Uygulama: LingoChat</Text>
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
              Bu Kullanım Şartları, Apple App Store ve Google Play Store gerekliliklerine uygun olarak hazırlanmıştır.
            </Text>
            <Text className="text-xs text-muted text-center mt-2">
              Son Güncelleme: 18 Şubat 2026 • Versiyon: 1.0
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
