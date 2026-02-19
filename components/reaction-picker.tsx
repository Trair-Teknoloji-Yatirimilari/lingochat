import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onReactionSelect: (emoji: string) => void;
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function ReactionPicker({
  visible,
  onClose,
  onReactionSelect,
}: ReactionPickerProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          entering={SlideInDown.springify()}
          style={{
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 16,
            flexDirection: "row",
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                onReactionSelect(emoji);
                onClose();
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
