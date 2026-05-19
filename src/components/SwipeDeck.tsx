import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { Item, VoteChoice } from '../lib/types';
import { VoteCard } from './VoteCard';
import { colors } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const SWIPE_OUT = SCREEN_W * 1.2;

interface Props {
  item: Item;
  onVote: (choice: VoteChoice, decisionMs: number) => void;
  onSwipeDown?: () => void;
  disabled?: boolean;
}

export function SwipeDeck({ item, onVote, onSwipeDown, disabled }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardShownAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    cardShownAt.current = Date.now();
    translateX.value = 0;
    translateY.value = 0;
  }, [item.id, translateX, translateY]);

  const finishVote = useCallback(
    (choice: VoteChoice) => {
      if (busy || disabled) return;
      setBusy(true);
      const decisionMs = Date.now() - cardShownAt.current;
      onVote(choice, decisionMs);
      setTimeout(() => setBusy(false), 280);
    },
    [busy, disabled, onVote]
  );

  const pan = Gesture.Pan()
    .enabled(!disabled && !busy)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = Math.max(0, e.translationY * 0.35);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SWIPE_OUT, { duration: 220 }, () => {
          runOnJS(finishVote)('yes');
          translateX.value = 0;
          translateY.value = 0;
        });
        return;
      }
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SWIPE_OUT, { duration: 220 }, () => {
          runOnJS(finishVote)('no');
          translateX.value = 0;
          translateY.value = 0;
        });
        return;
      }
      if (e.translationY > 80 && onSwipeDown) {
        runOnJS(onSwipeDown)();
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_W, 0, SCREEN_W],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const yesOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 0.85], Extrapolation.CLAMP),
  }));

  const noOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [0.85, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.deck, animatedStyle]}>
          <VoteCard item={item} />
          <Animated.View
            pointerEvents="none"
            style={[styles.tint, styles.yesTint, yesOverlayStyle]}
          />
          <Animated.View pointerEvents="none" style={[styles.tint, styles.noTint, noOverlayStyle]} />
        </Animated.View>
      </GestureDetector>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.noBtn]}
          onPress={() => finishVote('no')}
          disabled={disabled || busy}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.yesBtn]}
          onPress={() => finishVote('yes')}
          disabled={disabled || busy}
        >
          <Text style={styles.actionIcon}>♥</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  deck: {
    flex: 1,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  yesTint: {
    backgroundColor: colors.yesSoft,
  },
  noTint: {
    backgroundColor: colors.noSoft,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingBottom: 8,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  noBtn: {
    borderColor: colors.no,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  yesBtn: {
    borderColor: colors.yes,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  actionIcon: {
    fontSize: 28,
    color: colors.text,
  },
});
