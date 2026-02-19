import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useI18n } from '@/hooks/use-i18n';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'language' as const,
    titleKey: 'onboarding.slide1.title',
    descriptionKey: 'onboarding.slide1.description',
    color: '#0a7ea4',
  },
  {
    id: '2',
    icon: 'people' as const,
    titleKey: 'onboarding.slide2.title',
    descriptionKey: 'onboarding.slide2.description',
    color: '#10b981',
  },
  {
    id: '3',
    icon: 'shield-checkmark' as const,
    titleKey: 'onboarding.slide3.title',
    descriptionKey: 'onboarding.slide3.description',
    color: '#8b5cf6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/otp-login');
  };

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1, 0.8],
        Extrapolation.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <View
        style={{
          width,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
        }}
      >
        <Animated.View style={[{ alignItems: 'center' }, animatedStyle]}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: item.color + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <Ionicons name={item.icon} size={60} color={item.color} />
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            {t(item.titleKey)}
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: colors.muted,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            {t(item.descriptionKey)}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.surface]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, paddingTop: 60 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.primary,
            }}
          >
            LingoChat
          </Text>

          {currentIndex < slides.length - 1 && (
            <TouchableOpacity onPress={handleSkip}>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.muted,
                }}
              >
                {t('onboarding.skip')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            scrollX.value = event.nativeEvent.contentOffset.x;
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
        />

        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 40,
          }}
        >
          {slides.map((_, index) => {
            const animatedDotStyle = useAnimatedStyle(() => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = interpolate(
                scrollX.value,
                inputRange,
                [8, 24, 8],
                Extrapolation.CLAMP
              );

              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
                Extrapolation.CLAMP
              );

              return {
                width: dotWidth,
                opacity,
              };
            });

            return (
              <Animated.View
                key={index}
                style={[
                  {
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    marginHorizontal: 4,
                  },
                  animatedDotStyle,
                ]}
              />
            );
          })}
        </View>

        {/* Next/Get Started Button */}
        <View style={{ paddingHorizontal: 40, paddingBottom: 40 }}>
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 18,
                fontWeight: '600',
              }}
            >
              {currentIndex === slides.length - 1
                ? t('onboarding.getStarted')
                : t('common.next')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
