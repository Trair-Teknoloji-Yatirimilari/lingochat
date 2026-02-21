import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/hooks/use-i18n";
import { trpc } from "@/lib/trpc";

export default function MeetingSummaryScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const params = useLocalSearchParams();
  
  const summaryId = parseInt(params.summaryId as string);

  const { data: summary, isLoading } = trpc.groups.getSummary.useQuery(
    { summaryId },
    { enabled: !!summaryId }
  );

  const handleShare = async () => {
    if (!summary) return;

    const summaryText = `
# ${summary.summaryData.conclusion || t('meetingSummary.title')}

📅 ${new Date(summary.startTime).toLocaleDateString()} ${new Date(summary.startTime).toLocaleTimeString()} - ${new Date(summary.endTime).toLocaleTimeString()}
👥 ${summary.participantCount} ${t('meetingSummary.participants')} | 💬 ${summary.messageCount} ${t('meetingSummary.messages')}

## 📌 ${t('meetingSummary.mainTopics')}
${summary.summaryData.mainTopics?.map((topic: string, i: number) => `${i + 1}. ${topic}`).join("\n") || "-"}

## ✅ ${t('meetingSummary.decisions')}
${summary.summaryData.decisions?.map((decision: string, i: number) => `${i + 1}. ${decision}`).join("\n") || "-"}

## 📋 ${t('meetingSummary.actionItems')}
${summary.summaryData.actionItems?.map((item: any, i: number) => `${i + 1}. ${item.assignee}: ${item.task}${item.deadline ? ` (${item.deadline})` : ""}`).join("\n") || "-"}

## 💡 ${t('meetingSummary.highlights')}
${summary.summaryData.highlights?.map((highlight: string, i: number) => `• ${highlight}`).join("\n") || "-"}

## 🎯 ${t('meetingSummary.conclusion')}
${summary.summaryData.conclusion || "-"}
    `.trim();

    try {
      await Share.share({
        message: summaryText,
        title: t('meetingSummary.title'),
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleCopy = () => {
    Alert.alert(t('meetingSummary.copied'), t('meetingSummary.copiedToClipboard'));
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted mt-4">{t('meetingSummary.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!summary) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle" size={64} color={colors.muted} />
          <Text className="text-lg font-bold text-foreground mt-4">
            {t('meetingSummary.notFound')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginTop: 16,
            }}
          >
            <Text className="text-white font-semibold">{t('meetingSummary.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const summaryData = summary.summaryData;
  const duration = Math.floor(
    (new Date(summary.endTime).getTime() - new Date(summary.startTime).getTime()) / 60000
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{t('meetingSummary.title')}</Text>
          <Text className="text-xs text-muted">
            {new Date(summary.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        style={{ flex: 1 }}
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text className="text-sm text-muted">
                {new Date(summary.startTime).toLocaleDateString("tr-TR")}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text className="text-sm text-muted">{duration} {t('meetingSummary.duration')}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text className="text-sm text-muted">
                {summary.participantCount} {t('meetingSummary.participants')}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="chatbubbles" size={16} color={colors.primary} />
              <Text className="text-sm text-muted">
                {summary.messageCount} {t('meetingSummary.messages')}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Topics */}
        {summaryData.mainTopics && summaryData.mainTopics.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="list" size={20} color={colors.primary} />
              <Text className="text-base font-bold text-foreground">
                {t('meetingSummary.mainTopics')}
              </Text>
            </View>
            {summaryData.mainTopics.map((topic: string, index: number) => (
              <View key={index} className="flex-row items-start gap-2 mb-2">
                <Text className="text-sm font-semibold text-primary">
                  {index + 1}.
                </Text>
                <Text className="text-sm text-foreground flex-1">{topic}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Decisions */}
        {summaryData.decisions && summaryData.decisions.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text className="text-base font-bold text-foreground">
                {t('meetingSummary.decisions')}
              </Text>
            </View>
            {summaryData.decisions.map((decision: string, index: number) => (
              <View key={index} className="flex-row items-start gap-2 mb-2">
                <Ionicons name="checkmark" size={16} color="#22c55e" />
                <Text className="text-sm text-foreground flex-1">{decision}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Items */}
        {summaryData.actionItems && summaryData.actionItems.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="clipboard" size={20} color={colors.primary} />
              <Text className="text-base font-bold text-foreground">
                {t('meetingSummary.actionItems')}
              </Text>
            </View>
            {summaryData.actionItems.map((item: any, index: number) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="person" size={14} color={colors.primary} />
                  <Text className="text-sm font-semibold text-primary">
                    {item.assignee}
                  </Text>
                </View>
                <Text className="text-sm text-foreground mb-1">{item.task}</Text>
                {item.deadline && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar" size={12} color={colors.muted} />
                    <Text className="text-xs text-muted">{item.deadline}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Highlights */}
        {summaryData.highlights && summaryData.highlights.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <Text className="text-base font-bold text-foreground">
                {t('meetingSummary.highlights')}
              </Text>
            </View>
            {summaryData.highlights.map((highlight: string, index: number) => (
              <View key={index} className="flex-row items-start gap-2 mb-2">
                <Text className="text-sm text-primary">•</Text>
                <Text className="text-sm text-foreground flex-1">{highlight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Participant Stats */}
        {summaryData.participantStats && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
              <Text className="text-base font-bold text-foreground">
                {t('meetingSummary.participantStats')}
              </Text>
            </View>
            {Object.entries(summaryData.participantStats).map(
              ([username, stats]: [string, any], index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between mb-2"
                >
                  <Text className="text-sm text-foreground">{username}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm text-muted">
                      {stats.messageCount} mesaj
                    </Text>
                    <Text className="text-sm font-semibold text-primary">
                      %{stats.percentage}
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* Language Distribution */}
        {summaryData.languageDistribution && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="language" size={20} color={colors.primary} />
              <Text className="text-base font-bold text-foreground">
                {t('meetingSummary.languageDistribution')}
              </Text>
            </View>
            {Object.entries(summaryData.languageDistribution).map(
              ([lang, percentage]: [string, any], index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between mb-2"
                >
                  <Text className="text-sm text-foreground uppercase">{lang}</Text>
                  <Text className="text-sm font-semibold text-primary">
                    %{percentage}
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        {/* Conclusion */}
        {summaryData.conclusion && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="flag" size={20} color={colors.primary} />
              <Text className="text-base font-bold text-foreground">{t('meetingSummary.conclusion')}</Text>
            </View>
            <Text className="text-sm text-foreground leading-6">
              {summaryData.conclusion}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
