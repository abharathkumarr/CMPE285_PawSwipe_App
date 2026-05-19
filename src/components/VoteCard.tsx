import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { Item } from '../lib/types';
import { colors, layout } from '../constants/theme';

interface Props {
  item: Item;
}

export function VoteCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={item.id}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.label} numberOfLines={2}>
          {item.label}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: layout.cardRadius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  imageWrap: {
    flex: 1,
    minHeight: 320,
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 18,
    gap: 6,
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    color: '#475569',
  },
});
