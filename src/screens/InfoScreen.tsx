import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, GlossyCard } from '../components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const GUIDE: { icon: IconName; title: string; body: string; accent: string }[] = [
  {
    icon: 'add-circle-outline',
    title: 'Record an observation',
    body: 'Open New note, choose the closest template, then add what you saw. Time and date are saved automatically.',
    accent: COLORS.lime,
  },
  {
    icon: 'camera-outline',
    title: 'Add field evidence',
    body: 'Attach a photo, GPS location, or voice note when useful. BioGlow asks for each device permission only when that feature needs it.',
    accent: COLORS.blue,
  },
  {
    icon: 'time-outline',
    title: 'Review recent work',
    body: 'History holds notes that have not been exported yet. Open any note to inspect, edit, star, or delete it.',
    accent: COLORS.amber,
  },
  {
    icon: 'archive-outline',
    title: 'Export and archive',
    body: 'Create a research ZIP containing readable CSV files and attached media. After a successful export, you can move those notes from History to Archive.',
    accent: COLORS.violet,
  },
  {
    icon: 'rainy-outline',
    title: 'Use Rain / Glove Mode',
    body: 'Turn it on from History when conditions are wet or gloves make precise taps difficult. Controls and text become larger throughout the app.',
    accent: COLORS.teal,
  },
];

export function InfoScreen({ glove }: { glove: boolean }) {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.eyebrow}>FIELD GUIDE</Text>
      <Text style={[styles.heading, glove && styles.headingGlove]}>How to use BioGlow</Text>
      <Text style={[styles.sub, glove && styles.subGlove]}>
        A private, offline-first notebook for capturing ecological observations in the field.
      </Text>

      {GUIDE.map((item, index) => (
        <GlossyCard key={item.title} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={[styles.iconPlate, glove && styles.iconPlateGlove, { backgroundColor: `${item.accent}24` }]}>
              <Ionicons name={item.icon} size={glove ? 28 : 23} color={item.accent} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={[styles.title, glove && styles.titleGlove]}>{item.title}</Text>
              <Text style={[styles.body, glove && styles.bodyGlove]}>{item.body}</Text>
            </View>
          </View>
        </GlossyCard>
      ))}

      <GlossyCard gradient={['#124232', '#176858']} style={styles.privacyCard}>
        <View style={styles.privacyHeader}>
          <Ionicons name="shield-checkmark" size={25} color="#d6ff8a" />
          <Text style={[styles.privacyTitle, glove && styles.titleGlove]}>Private by default</Text>
        </View>
        <Text style={[styles.privacyBody, glove && styles.bodyGlove]}>
          Core capture, browsing, trivia, and export work without an account. Observations remain on this device until you explicitly export or share them.
        </Text>
      </GlossyCard>
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  eyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  heading: { color: COLORS.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7, marginTop: 3 },
  headingGlove: { fontSize: 32, lineHeight: 38 },
  sub: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 8 },
  subGlove: { fontSize: 17, lineHeight: 24 },
  card: { marginTop: 12 },
  stepRow: { flexDirection: 'row' },
  iconPlate: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  iconPlateGlove: { width: 58, height: 58, borderRadius: 18 },
  copy: { flex: 1 },
  stepNumber: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  titleGlove: { fontSize: 20 },
  body: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  bodyGlove: { fontSize: 16, lineHeight: 23 },
  privacyCard: { marginTop: 16 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center' },
  privacyTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginLeft: 9 },
  privacyBody: { color: 'rgba(255,255,255,0.9)', fontSize: 13.5, lineHeight: 20, marginTop: 9 },
  bottomSpace: { height: 24 },
});
