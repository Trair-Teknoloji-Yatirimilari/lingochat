import { View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

export function TypingIndicator() {
  const colors = useColors();
  
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Dot 1 animation
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );

    // Dot 2 animation (delayed)
    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );

    // Dot 3 animation (more delayed)
    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ scale: 0.8 + dot1.value * 0.4 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ scale: 0.8 + dot2.value * 0.4 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ scale: 0.8 + dot3.value * 0.4 }],
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 6,
        alignSelf: "flex-start",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.muted,
          },
          dot1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.muted,
          },
          dot2Style,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.muted,
          },
          dot3Style,
        ]}
      />
    </View>
  );
}
