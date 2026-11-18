import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MapView, {
  Circle,
  Marker,
  type MapStyleElement,
  type Region,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../components/ui';
import { mappedObservations, type MappedObservation } from '../observationMap';
import { templateByKey } from '../templates';
import type { FieldEntry } from '../types';

const DEFAULT_REGION: Region = {
  latitude: 9.154,
  longitude: -79.735,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const DARK_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#173b2d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d7ebdc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#092219' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#587567' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#123426' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1b4634' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#16412d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#526056' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#283f34' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#d7dfd9' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#365246' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#153f53' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8ed9ee' }] },
];

function initialRegion(observations: MappedObservation[]): Region {
  if (observations.length === 0) return DEFAULT_REGION;
  if (observations.length === 1) {
    const only = observations[0].coordinate;
    return { ...only, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }

  const latitudes = observations.map((observation) => observation.coordinate.latitude);
  const longitudes = observations.map((observation) => observation.coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.5, 0.01),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.5, 0.01),
  };
}

function formatEntryTime(value: string): string {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function accuracyLabel(entry: FieldEntry): string | null {
  if (
    entry.horizontalAccuracy === null ||
    !Number.isFinite(entry.horizontalAccuracy) ||
    entry.horizontalAccuracy < 0
  ) {
    return null;
  }
  return `±${Math.round(entry.horizontalAccuracy)} m`;
}

function ObservationListRow({
  observation,
  glove,
  selected,
  onPress,
}: {
  observation: MappedObservation;
  glove: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const template = templateByKey(observation.entry.templateKey);
  const accuracy = accuracyLabel(observation.entry);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${observation.entry.title}, ${observation.entry.locationLabel || 'location label not added'}${accuracy ? `, accuracy ${accuracy}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        glove && styles.listRowGlove,
        selected && styles.listRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.listIcon, glove && styles.listIconGlove, { borderColor: template.gradient[1] }]}>
        <Text style={[styles.listIconText, glove && styles.listIconTextGlove]}>{template.icon}</Text>
      </View>
      <View style={styles.listCopy}>
        <Text numberOfLines={2} style={[styles.listTitle, glove && styles.listTitleGlove]}>
          {observation.entry.title}
        </Text>
        <Text numberOfLines={2} style={[styles.listMeta, glove && styles.listMetaGlove]}>
          {observation.entry.locationLabel || 'Location label not added'} · {template.title}
        </Text>
      </View>
      {accuracy ? <Text style={[styles.listAccuracy, glove && styles.listAccuracyGlove]}>{accuracy}</Text> : null}
    </Pressable>
  );
}

export function ObservationMapScreen({
  entries,
  glove,
  onOpen,
}: {
  entries: FieldEntry[];
  glove: boolean;
  onOpen: (entry: FieldEntry) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const observations = useMemo(() => mappedObservations(entries), [entries]);
  const [selectedId, setSelectedId] = useState<string | null>(observations[0]?.entry.id ?? null);
  const [listVisible, setListVisible] = useState(false);
  const missingCount = entries.length - observations.length;
  const selected = observations.find((observation) => observation.entry.id === selectedId) ?? observations[0] ?? null;

  useEffect(() => {
    if (observations.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!observations.some((observation) => observation.entry.id === selectedId)) {
      setSelectedId(observations[0].entry.id);
    }
  }, [observations, selectedId]);

  const fitAll = useCallback((animated = true) => {
    if (observations.length === 0) return;
    if (observations.length === 1) {
      mapRef.current?.animateToRegion(
        { ...observations[0].coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        animated ? 350 : 0,
      );
      return;
    }
    mapRef.current?.fitToCoordinates(
      observations.map((observation) => observation.coordinate),
      {
        edgePadding: { top: 64, right: 42, bottom: 64, left: 42 },
        animated,
      },
    );
  }, [observations]);

  const selectFromList = useCallback((observation: MappedObservation) => {
    setSelectedId(observation.entry.id);
    setListVisible(false);
    mapRef.current?.animateToRegion(
      { ...observation.coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      350,
    );
  }, []);

  if (observations.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyIcon, glove && styles.emptyIconGlove]}>
          <Ionicons name="map-outline" size={glove ? 46 : 38} color={COLORS.lime} />
        </View>
        <Text style={[styles.emptyTitle, glove && styles.emptyTitleGlove]}>
          {entries.length === 0 ? 'No observations yet' : 'No mapped observations yet'}
        </Text>
        <Text style={[styles.emptyText, glove && styles.emptyTextGlove]}>
          {entries.length === 0
            ? 'Save a field note with GPS coordinates, then return here to see it on the map.'
            : `${entries.length} saved ${entries.length === 1 ? 'note does' : 'notes do'} not have usable GPS coordinates. They remain available in History and Archive.`}
        </Text>
      </View>
    );
  }

  const selectedTemplate = selected ? templateByKey(selected.entry.templateKey) : null;
  const selectedAccuracy = selected ? accuracyLabel(selected.entry) : null;
  const selectedAccuracyRadius = selected?.entry.horizontalAccuracy;

  return (
    <View style={styles.root}>
      <View style={[styles.summary, glove && styles.summaryGlove]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, glove && styles.summaryValueGlove]}>{observations.length}</Text>
          <Text style={[styles.summaryLabel, glove && styles.summaryLabelGlove]}>mapped</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, glove && styles.summaryValueGlove]}>{missingCount}</Text>
          <Text style={[styles.summaryLabel, glove && styles.summaryLabelGlove]}>without GPS</Text>
        </View>
        <Text style={[styles.localLabel, glove && styles.localLabelGlove]}>saved on this phone</Text>
      </View>

      <View style={[styles.mapWrap, glove && styles.mapWrapGlove]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion(observations)}
          customMapStyle={DARK_MAP_STYLE}
          userInterfaceStyle="dark"
          loadingEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass
          showsMyLocationButton={false}
          showsUserLocation={false}
          toolbarEnabled={false}
          onMapReady={() => fitAll(false)}
        >
          {selected && typeof selectedAccuracyRadius === 'number' && Number.isFinite(selectedAccuracyRadius) && selectedAccuracyRadius >= 0 ? (
            <Circle
              center={selected.coordinate}
              radius={Math.max(1, selectedAccuracyRadius)}
              fillColor="rgba(182,239,104,0.18)"
              strokeColor="rgba(182,239,104,0.78)"
              strokeWidth={2}
            />
          ) : null}
          {observations.map((observation) => {
            const template = templateByKey(observation.entry.templateKey);
            const isSelected = observation.entry.id === selected?.entry.id;
            return (
              <Marker
                key={`${observation.entry.id}:${isSelected ? 'selected' : 'idle'}:${glove ? 'glove' : 'normal'}`}
                coordinate={observation.coordinate}
                accessibilityLabel={`${observation.entry.title}, ${template.title}`}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={isSelected ? 2 : 1}
                tracksViewChanges={false}
                onPress={() => setSelectedId(observation.entry.id)}
              >
                <View
                  collapsable={false}
                  style={[
                    styles.marker,
                    glove && styles.markerGlove,
                    isSelected && styles.markerSelected,
                    { backgroundColor: template.gradient[1] },
                  ]}
                >
                  <Text style={[styles.markerText, glove && styles.markerTextGlove]}>{template.icon}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fit all observations on the map"
          onPress={() => fitAll(true)}
          style={({ pressed }) => [
            styles.fitButton,
            glove && styles.fitButtonGlove,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="scan-outline" size={glove ? 24 : 19} color={COLORS.text} />
          <Text style={[styles.fitText, glove && styles.fitTextGlove]}>Fit all</Text>
        </Pressable>
      </View>

      {selected && selectedTemplate ? (
        <View style={[styles.selectedCard, glove && styles.selectedCardGlove]}>
          <View style={styles.selectedHeader}>
            <View style={[styles.selectedIcon, glove && styles.selectedIconGlove, { borderColor: selectedTemplate.gradient[1] }]}>
              <Text style={[styles.selectedIconText, glove && styles.selectedIconTextGlove]}>{selectedTemplate.icon}</Text>
            </View>
            <View style={styles.selectedCopy}>
              <Text style={[styles.selectedType, glove && styles.selectedTypeGlove]}>{selectedTemplate.title}</Text>
              <Text numberOfLines={2} style={[styles.selectedTitle, glove && styles.selectedTitleGlove]}>
                {selected.entry.title}
              </Text>
              <Text numberOfLines={2} style={[styles.selectedMeta, glove && styles.selectedMetaGlove]}>
                {selected.entry.locationLabel || 'Location label not added'} · {formatEntryTime(selected.entry.createdAt)}
              </Text>
            </View>
            {selectedAccuracy ? (
              <Text style={[styles.accuracyChip, glove && styles.accuracyChipGlove]}>{selectedAccuracy}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(selected.entry)}
            style={({ pressed }) => [styles.openButton, glove && styles.openButtonGlove, pressed && styles.pressed]}
          >
            <Text style={[styles.openButtonText, glove && styles.openButtonTextGlove]}>Open note</Text>
            <Ionicons name="chevron-forward" size={glove ? 23 : 19} color="#1a2e05" />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setListVisible(true)}
        style={({ pressed }) => [styles.listButton, glove && styles.listButtonGlove, pressed && styles.pressed]}
      >
        <View style={styles.listButtonLabel}>
          <Ionicons name="list-outline" size={glove ? 25 : 20} color={COLORS.text} />
          <Text style={[styles.listButtonText, glove && styles.listButtonTextGlove]}>All mapped observations</Text>
        </View>
        <Text style={[styles.listButtonCount, glove && styles.listButtonCountGlove]}>{observations.length}</Text>
      </Pressable>

      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={listVisible}
        onRequestClose={() => setListVisible(false)}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={[styles.sheetHeader, glove && styles.sheetHeaderGlove]}>
            <View>
              <Text style={[styles.sheetTitle, glove && styles.sheetTitleGlove]}>Mapped observations</Text>
              <Text style={[styles.sheetSub, glove && styles.sheetSubGlove]}>
                History and Archive · saved on this phone
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close observation list"
              onPress={() => setListVisible(false)}
              style={({ pressed }) => [styles.closeButton, glove && styles.closeButtonGlove, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={glove ? 30 : 25} color={COLORS.text} />
            </Pressable>
          </View>
          <FlatList
            data={observations}
            keyExtractor={(observation) => observation.entry.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ObservationListRow
                observation={item}
                glove={glove}
                selected={item.entry.id === selected?.entry.id}
                onPress={() => selectFromList(item)}
              />
            )}
            ListFooterComponent={missingCount > 0 ? (
              <Text style={[styles.missingNote, glove && styles.missingNoteGlove]}>
                {missingCount} {missingCount === 1 ? 'note is' : 'notes are'} not shown because usable GPS coordinates are not available. {missingCount === 1 ? 'It remains' : 'They remain'} safe in History or Archive.
              </Text>
            ) : undefined}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },
  summary: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  summaryGlove: { minHeight: 68, gap: 13 },
  summaryItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  summaryValue: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  summaryValueGlove: { fontSize: 21 },
  summaryLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  summaryLabelGlove: { fontSize: 15 },
  summaryDivider: { width: 1, height: 18, backgroundColor: COLORS.cardBorder },
  localLabel: { flex: 1, color: COLORS.muted, fontSize: 11, textAlign: 'right' },
  localLabelGlove: { fontSize: 13 },
  mapWrap: { flex: 1, minHeight: 210, position: 'relative', backgroundColor: COLORS.bgSoft },
  mapWrapGlove: { minHeight: 170 },
  map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  marker: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.text,
    shadowColor: '#000',
    shadowOpacity: 0.36,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  markerGlove: { width: 52, height: 52, borderRadius: 26 },
  markerSelected: { borderWidth: 4, borderColor: COLORS.lime },
  markerText: { fontSize: 20 },
  markerTextGlove: { fontSize: 25 },
  fitButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(2,19,13,0.92)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  fitButtonGlove: { minHeight: 60, paddingHorizontal: 17, borderRadius: 19 },
  fitText: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  fitTextGlove: { fontSize: 17 },
  selectedCard: {
    margin: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.27,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  selectedCardGlove: { margin: 14, marginBottom: 9, padding: 17, borderRadius: 23 },
  selectedHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  selectedIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.bgSoft,
    borderWidth: 2,
  },
  selectedIconGlove: { width: 58, height: 58, borderRadius: 18 },
  selectedIconText: { fontSize: 23 },
  selectedIconTextGlove: { fontSize: 29 },
  selectedCopy: { flex: 1 },
  selectedType: { color: COLORS.teal, fontSize: 10.5, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  selectedTypeGlove: { fontSize: 13 },
  selectedTitle: { color: COLORS.text, fontSize: 17, lineHeight: 21, fontWeight: '900', marginTop: 2 },
  selectedTitleGlove: { fontSize: 21, lineHeight: 26 },
  selectedMeta: { color: COLORS.muted, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
  selectedMetaGlove: { fontSize: 14, lineHeight: 20 },
  accuracyChip: { color: COLORS.text, fontSize: 10.5, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: COLORS.card },
  accuracyChipGlove: { fontSize: 13, paddingHorizontal: 10, paddingVertical: 7 },
  openButton: {
    minHeight: 47,
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
    backgroundColor: COLORS.lime,
  },
  openButtonGlove: { minHeight: 61, marginTop: 15, borderRadius: 18 },
  openButtonText: { color: '#1a2e05', fontSize: 15, fontWeight: '900' },
  openButtonTextGlove: { fontSize: 19 },
  listButton: {
    minHeight: 52,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  listButtonGlove: { minHeight: 66, marginHorizontal: 14, marginBottom: 14, paddingHorizontal: 18, borderRadius: 20 },
  listButtonLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  listButtonTextGlove: { fontSize: 18 },
  listButtonCount: { color: COLORS.lime, fontSize: 14, fontWeight: '900' },
  listButtonCountGlove: { fontSize: 18 },
  sheet: { flex: 1, backgroundColor: COLORS.bgDeep },
  sheetHeader: {
    minHeight: 76,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sheetHeaderGlove: { minHeight: 94, paddingHorizontal: 18 },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  sheetTitleGlove: { fontSize: 27 },
  sheetSub: { color: COLORS.muted, fontSize: 11.5, marginTop: 3 },
  sheetSubGlove: { fontSize: 14 },
  closeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  closeButtonGlove: { width: 62, height: 62, borderRadius: 19 },
  listContent: { padding: 12, gap: 9 },
  listRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 18,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  listRowGlove: { minHeight: 100, gap: 13, padding: 13, borderRadius: 21 },
  listRowSelected: { backgroundColor: 'rgba(182,239,104,0.13)', borderColor: 'rgba(182,239,104,0.62)' },
  listIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.bgSoft, borderWidth: 2 },
  listIconGlove: { width: 58, height: 58, borderRadius: 18 },
  listIconText: { fontSize: 22 },
  listIconTextGlove: { fontSize: 28 },
  listCopy: { flex: 1 },
  listTitle: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  listTitleGlove: { fontSize: 18, lineHeight: 23 },
  listMeta: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: 4 },
  listMetaGlove: { fontSize: 14, lineHeight: 19 },
  listAccuracy: { color: COLORS.lime, fontSize: 11, fontWeight: '800' },
  listAccuracyGlove: { fontSize: 14 },
  missingNote: { color: COLORS.muted, fontSize: 12, lineHeight: 18, padding: 12, textAlign: 'center' },
  missingNoteGlove: { fontSize: 15, lineHeight: 22, padding: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: COLORS.bgDeep },
  emptyIcon: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: COLORS.cardStrong, borderWidth: 1, borderColor: COLORS.cardBorder },
  emptyIconGlove: { width: 94, height: 94, borderRadius: 28 },
  emptyTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  emptyTitleGlove: { fontSize: 28 },
  emptyText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, maxWidth: 420 },
  emptyTextGlove: { fontSize: 18, lineHeight: 26 },
  pressed: { opacity: 0.78 },
});
