import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TEMPLATES } from '../templates';
import type { TemplateDef } from '../types';
import { COLORS } from '../components/ui';

export function CaptureScreen({
  glove,
  onPickTemplate,
}: {
  glove: boolean;
  onPickTemplate: (template: TemplateDef) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>NEW FIELD NOTE</Text>
          <Text style={[styles.heading, glove && styles.headingGlove]}>What did you find?</Text>
        </View>
        <View style={styles.offlinePill}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      </View>
      <Text style={[styles.sub, glove && styles.subGlove]}>
        Choose a note type. Time, date, and on-device saving are handled automatically.
      </Text>

      <View style={styles.grid}>
        {TEMPLATES.map((template) => (
          <Pressable
            key={template.key}
            onPress={() => onPickTemplate(template)}
            style={({ pressed }) => [styles.tileOuter, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={template.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.tile, glove && styles.tileGlove]}
            >
              <View style={styles.gloss} />
              <View style={[styles.iconPlate, glove && styles.iconPlateGlove]}>
                <Text style={[styles.icon, glove && styles.iconGlove]}>{template.icon}</Text>
              </View>
              <Text style={[styles.title, glove && styles.titleGlove]}>{template.title}</Text>
              <Text style={[styles.tagline, glove && styles.taglineGlove]}>{template.tagline}</Text>
              <View style={styles.openCue}>
                <Text style={styles.openCueText}>Start</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </View>

      <View style={styles.contextCard}>
        <Text style={styles.contextIcon}>⌖</Text>
        <View style={styles.contextCopy}>
          <Text style={[styles.contextTitle, glove && styles.contextTitleGlove]}>Field context stays with the note</Text>
          <Text style={[styles.contextText, glove && styles.contextTextGlove]}>
            Add GPS, photos, and voice after choosing a template. Nothing leaves this phone unless you export it.
          </Text>
        </View>
      </View>
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heading: {
    color: COLORS.text,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 3,
  },
  headingGlove: { fontSize: 32, lineHeight: 38 },
  offlinePill: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
    marginRight: 7,
  },
  offlineText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  sub: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 12,
    maxWidth: 520,
  },
  subGlove: { fontSize: 17, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  tileOuter: { width: '50%', padding: 6 },
  tile: {
    minHeight: 192,
    borderRadius: 22,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  tileGlove: { minHeight: 226, padding: 16 },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  iconPlate: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    marginBottom: 12,
  },
  iconPlateGlove: { width: 60, height: 60, borderRadius: 18 },
  icon: { fontSize: 25 },
  iconGlove: { fontSize: 32 },
  title: { color: '#fff', fontSize: 16, lineHeight: 20, fontWeight: '900' },
  titleGlove: { fontSize: 19, lineHeight: 24 },
  tagline: { color: 'rgba(255,255,255,0.84)', fontSize: 12, lineHeight: 17, marginTop: 5 },
  taglineGlove: { fontSize: 14, lineHeight: 20 },
  openCue: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingTop: 12 },
  openCueText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  arrow: { color: '#fff', fontSize: 18, marginLeft: 6 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  contextCard: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  contextIcon: { color: COLORS.teal, fontSize: 25, marginRight: 12 },
  contextCopy: { flex: 1 },
  contextTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  contextTitleGlove: { fontSize: 17 },
  contextText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  contextTextGlove: { fontSize: 15, lineHeight: 22 },
  bottomSpace: { height: 24 },
});
