import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();

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
              {t('legal.privacy.title')}
            </Text>
            <Text className="text-xs text-muted">
              {t('legal.privacy.lastUpdated')}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Section title={t('legal.privacy.introduction.title')}>
            <Text className="text-sm text-foreground leading-6">
              {t('legal.privacy.introduction.content1')}
            </Text>
            <Text className="text-sm text-foreground leading-6 mt-3">
              {t('legal.privacy.introduction.content2')}
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                {t('legal.privacy.introduction.contactTitle')}
              </Text>
              <Text className="text-xs text-muted">{t('legal.privacy.introduction.company')}</Text>
              <Text className="text-xs text-muted">{t('legal.privacy.introduction.email')}</Text>
              <Text className="text-xs text-muted">{t('legal.privacy.introduction.address')}</Text>
            </InfoBox>
          </Section>

          <Section title={t('legal.privacy.dataCollection.title')}>
            <SubSection title={t('legal.privacy.dataCollection.userProvided')}>
              <BulletPoint>{t('legal.privacy.dataCollection.phoneNumber')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.username')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.profilePicture')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.languagePreference')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.privacy.dataCollection.autoCollected')}>
              <BulletPoint>{t('legal.privacy.dataCollection.deviceInfo')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.usageData')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.logData')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.privacy.dataCollection.messagingData')}>
              <BulletPoint>{t('legal.privacy.dataCollection.messageContent')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.messageMetadata')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataCollection.mediaFiles')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.privacy.dataUsage.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.privacy.dataUsage.intro')}
            </Text>
            <BulletPoint>{t('legal.privacy.dataUsage.serviceProvision')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataUsage.authentication')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataUsage.personalization')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataUsage.improvement')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataUsage.support')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataUsage.security')}</BulletPoint>
          </Section>

          <Section title={t('legal.privacy.dataSharing.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.privacy.dataSharing.intro')}
            </Text>

            <SubSection title={t('legal.privacy.dataSharing.serviceProviders')}>
              <BulletPoint>{t('legal.privacy.dataSharing.translationServices')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataSharing.cloudStorage')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataSharing.infrastructureProviders')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.privacy.dataSharing.legalRequirements')}>
              <BulletPoint>{t('legal.privacy.dataSharing.legalCompliance')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataSharing.rightsProtection')}</BulletPoint>
              <BulletPoint>{t('legal.privacy.dataSharing.publicSafety')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.privacy.dataRetention.title')}>
            <BulletPoint>{t('legal.privacy.dataRetention.activeAccounts')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataRetention.messages')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataRetention.accountDeletion')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataRetention.legalRetention')}</BulletPoint>
          </Section>

          <Section title={t('legal.privacy.dataSecurity.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.privacy.dataSecurity.intro')}
            </Text>
            <BulletPoint>{t('legal.privacy.dataSecurity.encryption')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataSecurity.accessControl')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataSecurity.securityTests')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.dataSecurity.secureServers')}</BulletPoint>
          </Section>

          <Section title={t('legal.privacy.childrenPrivacy.title')}>
            <Text className="text-sm text-foreground leading-6">
              {t('legal.privacy.childrenPrivacy.content')}
            </Text>
          </Section>

          <Section title={t('legal.privacy.yourRights.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.privacy.yourRights.intro')}
            </Text>
            <BulletPoint>{t('legal.privacy.yourRights.accessRight')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.yourRights.rectificationRight')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.yourRights.erasureRight')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.yourRights.objectionRight')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.yourRights.portabilityRight')}</BulletPoint>
            <BulletPoint>{t('legal.privacy.yourRights.complaintRight')}</BulletPoint>
            
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-2">
                {t('legal.privacy.yourRights.deleteAccountTitle')}
              </Text>
              <Text className="text-xs text-muted leading-5">
                {t('legal.privacy.yourRights.deleteAccountDescription')}
              </Text>
            </InfoBox>
          </Section>

          <Section title={t('legal.privacy.contact.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.privacy.contact.intro')}
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                {t('legal.privacy.contact.company')}
              </Text>
              <Text className="text-xs text-muted">{t('legal.privacy.contact.email')}</Text>
              <Text className="text-xs text-muted">{t('legal.privacy.contact.web')}</Text>
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
              {t('legal.privacy.footer')}
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
