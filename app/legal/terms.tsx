import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";

export default function TermsOfServiceScreen() {
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
              {t('legal.terms.title')}
            </Text>
            <Text className="text-xs text-muted">
              {t('legal.terms.lastUpdated')}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Section title={t('legal.terms.acceptance.title')}>
            <Text className="text-sm text-foreground leading-6">
              {t('legal.terms.acceptance.content')}
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                {t('legal.terms.acceptance.companyInfoTitle')}
              </Text>
              <Text className="text-xs text-muted">{t('legal.terms.acceptance.companyName')}</Text>
              <Text className="text-xs text-muted">{t('legal.terms.acceptance.registrationPlace')}</Text>
              <Text className="text-xs text-muted">{t('legal.terms.acceptance.email')}</Text>
            </InfoBox>
          </Section>

          <Section title={t('legal.terms.serviceDescription.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.terms.serviceDescription.intro')}
            </Text>
            <SubSection title={t('legal.terms.serviceDescription.servicesOffered')}>
              <BulletPoint>{t('legal.terms.serviceDescription.instantMessaging')}</BulletPoint>
              <BulletPoint>{t('legal.terms.serviceDescription.autoTranslation')}</BulletPoint>
              <BulletPoint>{t('legal.terms.serviceDescription.mediaSharing')}</BulletPoint>
              <BulletPoint>{t('legal.terms.serviceDescription.voiceCalls')}</BulletPoint>
              <BulletPoint>{t('legal.terms.serviceDescription.profileManagement')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.accountCreation.title')}>
            <SubSection title={t('legal.terms.accountCreation.requirements')}>
              <BulletPoint>{t('legal.terms.accountCreation.ageRequirement')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.phoneRequirement')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.accurateInfo')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.uniqueUsername')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.accountCreation.accountSecurity')}>
              <BulletPoint>{t('legal.terms.accountCreation.responsibility')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.activityResponsibility')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.unauthorizedAccess')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.noSharing')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.accountCreation.accountDeletion')}>
              <Text className="text-sm text-foreground leading-6 mb-2">
                {t('legal.terms.accountCreation.deletionIntro')}
              </Text>
              <BulletPoint>{t('legal.terms.accountCreation.deletionStep1')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.deletionStep2')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.deletionStep3')}</BulletPoint>
              <BulletPoint>{t('legal.terms.accountCreation.deletionStep4')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.acceptableUse.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.terms.acceptableUse.intro')}
            </Text>
            <SubSection title={t('legal.terms.acceptableUse.contentViolations')}>
              <BulletPoint>{t('legal.terms.acceptableUse.illegalContent')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.hateSpeech')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.pornographicContent')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.copyrightViolation')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.acceptableUse.securityViolations')}>
              <BulletPoint>{t('legal.terms.acceptableUse.reverseEngineering')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.exploitingVulnerabilities')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.malwareSpreading')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.unauthorizedAccess')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.acceptableUse.spamAbuse')}>
              <BulletPoint>{t('legal.terms.acceptableUse.spamMessages')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.fraudActivities')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.misleadingInfo')}</BulletPoint>
              <BulletPoint>{t('legal.terms.acceptableUse.automatedBots')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.intellectualProperty.title')}>
            <SubSection title={t('legal.terms.intellectualProperty.userContent')}>
              <BulletPoint>{t('legal.terms.intellectualProperty.contentResponsibility')}</BulletPoint>
              <BulletPoint>{t('legal.terms.intellectualProperty.rightsGuarantee')}</BulletPoint>
              <BulletPoint>{t('legal.terms.intellectualProperty.noIllegalContent')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.intellectualProperty.companyIP')}>
              <BulletPoint>{t('legal.terms.intellectualProperty.appOwnership')}</BulletPoint>
              <BulletPoint>{t('legal.terms.intellectualProperty.trademark')}</BulletPoint>
              <BulletPoint>{t('legal.terms.intellectualProperty.noUnauthorizedUse')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.privacy.title')}>
            <Text className="text-sm text-foreground leading-6">
              {t('legal.terms.privacy.content')}
            </Text>
          </Section>

          <Section title={t('legal.terms.disclaimer.title')}>
            <SubSection title={t('legal.terms.disclaimer.asIs')}>
              <Text className="text-sm text-foreground leading-6 mb-2">
                {t('legal.terms.disclaimer.intro')}
              </Text>
              <BulletPoint>{t('legal.terms.disclaimer.noInterruption')}</BulletPoint>
              <BulletPoint>{t('legal.terms.disclaimer.noTranslationAccuracy')}</BulletPoint>
              <BulletPoint>{t('legal.terms.disclaimer.noAbsoluteSecurity')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.disclaimer.translationService')}>
              <BulletPoint>{t('legal.terms.disclaimer.notPerfect')}</BulletPoint>
              <BulletPoint>{t('legal.terms.disclaimer.professionalRecommendation')}</BulletPoint>
              <BulletPoint>{t('legal.terms.disclaimer.noLiability')}</BulletPoint>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.limitationLiability.title')}>
            <Text className="text-sm text-foreground leading-6 mb-2">
              {t('legal.terms.limitationLiability.intro')}
            </Text>
            <BulletPoint>{t('legal.terms.limitationLiability.noIndirectDamages')}</BulletPoint>
            <BulletPoint>{t('legal.terms.limitationLiability.noDataLoss')}</BulletPoint>
            <BulletPoint>{t('legal.terms.limitationLiability.limitedLiability')}</BulletPoint>
          </Section>

          <Section title={t('legal.terms.disputeResolution.title')}>
            <SubSection title={t('legal.terms.disputeResolution.applicableLaw')}>
              <Text className="text-sm text-foreground leading-6">
                {t('legal.terms.disputeResolution.lawContent')}
              </Text>
            </SubSection>

            <SubSection title={t('legal.terms.disputeResolution.jurisdiction')}>
              <Text className="text-sm text-foreground leading-6">
                {t('legal.terms.disputeResolution.jurisdictionContent')}
              </Text>
            </SubSection>

            <SubSection title={t('legal.terms.disputeResolution.amicableResolution')}>
              <Text className="text-sm text-foreground leading-6">
                {t('legal.terms.disputeResolution.amicableContent')}
              </Text>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.appleProvisions.title')}>
            <SubSection title={t('legal.terms.appleProvisions.relationship')}>
              <BulletPoint>{t('legal.terms.appleProvisions.agreementParties')}</BulletPoint>
              <BulletPoint>{t('legal.terms.appleProvisions.appleNotResponsible')}</BulletPoint>
              <BulletPoint>{t('legal.terms.appleProvisions.noAppleWarranty')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.appleProvisions.maintenanceSupport')}>
              <BulletPoint>{t('legal.terms.appleProvisions.companyResponsible')}</BulletPoint>
              <BulletPoint>{t('legal.terms.appleProvisions.noAppleObligation')}</BulletPoint>
            </SubSection>

            <SubSection title={t('legal.terms.appleProvisions.thirdPartyBeneficiary')}>
              <Text className="text-sm text-foreground leading-6">
                {t('legal.terms.appleProvisions.beneficiaryContent')}
              </Text>
            </SubSection>
          </Section>

          <Section title={t('legal.terms.contact.title')}>
            <Text className="text-sm text-foreground leading-6 mb-3">
              {t('legal.terms.contact.intro')}
            </Text>
            <InfoBox>
              <Text className="text-xs font-semibold text-foreground mb-1">
                {t('legal.terms.contact.company')}
              </Text>
              <Text className="text-xs text-muted">{t('legal.terms.contact.email')}</Text>
              <Text className="text-xs text-muted">{t('legal.terms.contact.app')}</Text>
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
              {t('legal.terms.footer')}
            </Text>
            <Text className="text-xs text-muted text-center mt-2">
              {t('legal.terms.footerVersion')}
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
