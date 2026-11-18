import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function MoreItem({
  icon,
  title,
  description,
  accent,
  glove,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  accent: string;
  glove: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, glove && styles.itemGlove, pressed && styles.pressed]}
    >
      <View style={[styles.iconPlate, glove && styles.iconPlateGlove, { backgroundColor: `${accent}24` }]}>
        <Ionicons name={icon} size={glove ? 29 : 24} color={accent} />
      </View>
      <View style={styles.itemCopy}>
        <Text style={[styles.itemTitle, glove && styles.itemTitleGlove]}>{title}</Text>
        <Text style={[styles.itemDescription, glove && styles.itemDescriptionGlove]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={glove ? 27 : 22} color={COLORS.muted} />
    </Pressable>
  );
}

export function MoreScreen({
  glove,
  onOpenInfo,
  onOpenTrivia,
  onSubmitFeedback,
  onOpenPrivacyPolicy,
  onOpenSupport,
}: {
  glove: boolean;
  onOpenInfo: () => void;
  onOpenTrivia: () => void;
  onSubmitFeedback: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenSupport: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.eyebrow}>BIOGLOW</Text>
      <Text style={[styles.heading, glove && styles.headingGlove]}>More</Text>
      <Text style={[styles.sub, glove && styles.subGlove]}>
        Learn how the field notebook works, explore biodiversity, or tell us what would make it better.
      </Text>

      <View style={styles.card}>
        <MoreItem
          icon="information-circle-outline"
          title="Info & how to use"
          description="A quick guide to notes, media, export, privacy, and field controls."
          accent={COLORS.blue}
          glove={glove}
          onPress={onOpenInfo}
        />
        <View style={styles.divider} />
        <MoreItem
          icon="leaf-outline"
          title="Biodiversity trivia"
          description="Discover surprising connections in a five-question offline round."
          accent={COLORS.lime}
          glove={glove}
          onPress={onOpenTrivia}
        />
        <View style={styles.divider} />
        <MoreItem
          icon="chatbubble-ellipses-outline"
          title="Submit feedback"
          description="Share an idea, a problem, or something that worked well."
          accent={COLORS.teal}
          glove={glove}
          onPress={onSubmitFeedback}
        />
        <View style={styles.divider} />
        <MoreItem
          icon="shield-checkmark-outline"
          title="Privacy policy"
          description="Read how Eco Note keeps observations and media private by default."
          accent={COLORS.blue}
          glove={glove}
          onPress={onOpenPrivacyPolicy}
        />
        <View style={styles.divider} />
        <MoreItem
          icon="help-buoy-outline"
          title="Support"
          description="Get help or contact Mecha Masters about Eco Note."
          accent={COLORS.lime}
          glove={glove}
          onPress={onOpenSupport}
        />
      </View>

      <View style={styles.offlineNote}>
        <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.teal} />
        <Text style={[styles.offlineText, glove && styles.offlineTextGlove]}>
          Your field notes stay on this device unless you choose to export or share them.
        </Text>
      </View>
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16 },
  eyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  heading: { color: COLORS.text, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7, marginTop: 3 },
  headingGlove: { fontSize: 32, lineHeight: 38 },
  sub: { color: COLORS.muted, fontSize: 14, marginTop: 7, lineHeight: 20, maxWidth: 560 },
  subGlove: { fontSize: 17, lineHeight: 24 },
  card: { marginTop: 18, overflow: 'hidden', borderRadius: 20, backgroundColor: COLORS.cardStrong, borderWidth: 1, borderColor: COLORS.cardBorder },
  item: { minHeight: 86, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  itemGlove: { minHeight: 108, paddingVertical: 18 },
  iconPlate: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  iconPlateGlove: { width: 60, height: 60, borderRadius: 19 },
  itemCopy: { flex: 1, paddingRight: 8 },
  itemTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  itemTitleGlove: { fontSize: 20 },
  itemDescription: { color: COLORS.muted, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  itemDescriptionGlove: { fontSize: 15, lineHeight: 22 },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginLeft: 75 },
  pressed: { opacity: 0.72 },
  offlineNote: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 18, paddingHorizontal: 4 },
  offlineText: { flex: 1, color: COLORS.muted, fontSize: 12.5, lineHeight: 19, marginLeft: 10 },
  offlineTextGlove: { fontSize: 15, lineHeight: 22 },
  bottomSpace: { height: 28 },
});
