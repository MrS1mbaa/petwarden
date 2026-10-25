import { EmptyPet } from '../../components/EmptyPet';
import { useLanguage } from '../../lib/language';
import { memo, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { PillButton } from '../../components/PillButton';
import { PressScale } from '../../components/PressScale';
import { SoftSurface } from '../../components/SoftSurface';
import { Skeleton } from '../../components/Skeleton';
import { tokens } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeProvider';
import { copy } from '../../lib/copy';
import { displayDate } from '../../lib/dates';
import type { PetDocument } from '../../db/repositories/documents';
import { useDocuments } from './useDocuments';
import { DocumentEditor } from './DocumentEditor';
import { documentKind, matchesQuery } from './model';

type Item = { kind: 'document'; record: PetDocument } | { kind: 'add' };
export function DocumentsScreen() {
  const documents = useDocuments(), { colors, fontsReady } = useTheme(), insets = useSafeAreaInsets();
  useLanguage(state => state.language);
  const blurTarget = useRef<View | null>(null);
  const [editor, setEditor] = useState<{ record: PetDocument | null } | null>(null);
  const [query, setQuery] = useState('');
  if (!documents.pet) return null;
  const add = () => setEditor({ record: null });
  const records = (documents.records ?? []).filter(record => matchesQuery(record.title, query));
  const searching = query.trim().length > 0;
  const items: Item[] = documents.records?.length ? [...records.map(record => ({ kind: 'document' as const, record })), ...(searching ? [] : [{ kind: 'add' as const }])] : [];
  const header = <View style={styles.header}>
    <View style={styles.row}><IconButton name="chevronLeft" label={copy.onboarding.back} onPress={() => router.replace('/health')} /><AppText variant="title" bold accessibilityRole="header" style={styles.grow}>{copy.documents.title}</AppText><IconButton name="plus" label={copy.documents.add} onPress={add} /></View>
    <AppText muted>{documents.pet.name} · {copy.documents.hint}</AppText>
    {!!documents.records?.length && <SoftSurface raised radius={tokens.radius.icon} style={styles.searchCard}><View style={styles.search}><Icon name="search" color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder={copy.documents.search} placeholderTextColor={colors.textSecondary} accessibilityLabel={copy.documents.search} returnKeyType="search" style={[styles.searchInput, { color: colors.textPrimary, fontFamily: fontsReady ? tokens.font.medium : undefined }]} /></View></SoftSurface>}
    {documents.error && <><AppText accessibilityRole="alert" style={{ color: colors.error }}>{documents.error}</AppText><PillButton label={copy.retry} onPress={() => void documents.refresh()} /></>}
    {searching && records.length === 0 && <AppText muted accessibilityLiveRegion="polite">{copy.documents.noMatch}</AppText>}
  </View>;
  const empty = documents.error ? null : !documents.records ? <Skeleton /> : <SoftSurface raised style={styles.empty}><EmptyPet /><AppText bold style={styles.center}>{copy.documents.empty}</AppText><AppText muted style={styles.center}>{copy.documents.addHint}</AppText></SoftSurface>;
  return <View style={[styles.root, { backgroundColor: colors.bg }]}><BlurTargetView ref={blurTarget} style={styles.root} accessibilityElementsHidden={editor !== null} importantForAccessibility={editor ? 'no-hide-descendants' : 'auto'} aria-hidden={editor !== null}>
    <FlatList data={items} numColumns={2} keyExtractor={item => item.kind === 'add' ? 'add' : String(item.record.id)} keyboardShouldPersistTaps="handled" columnWrapperStyle={styles.columns} contentContainerStyle={[styles.page, { paddingTop: insets.top + tokens.space.xl, paddingBottom: insets.bottom + tokens.size.inputHeight + tokens.space.hero }]} ListHeaderComponent={header} ItemSeparatorComponent={Gap} ListEmptyComponent={empty}
      renderItem={({ item }) => <View style={styles.cell}>{item.kind === 'add' ? <AddCard onPress={add} /> : <DocumentCard record={item.record} onEdit={setEditor} />}</View>} />
  </BlurTargetView>
    <View style={[styles.footer, { paddingBottom: insets.bottom + tokens.space.lg, backgroundColor: colors.bg }]}><View style={styles.cta}><PillButton primary label={copy.documents.add} onPress={add} /></View></View>
    {editor && <DocumentEditor record={editor.record} busy={documents.busy} blurTarget={blurTarget} onClose={() => setEditor(null)} chooseFile={documents.chooseFile} choosePhoto={documents.choosePhoto} onSave={(title, file) => documents.save(editor.record, title, file)} onOpen={() => { if (editor.record) void documents.open(editor.record); }} onDelete={() => editor.record ? documents.remove(editor.record) : Promise.resolve(false)} />}
  </View>;
}
const DocumentCard = memo(function DocumentCard({ record, onEdit }: { record: PetDocument; onEdit: (editor: { record: PetDocument }) => void }) {
  const { colors } = useTheme();
  const kind = documentKind(record.uri);
  const tone = kind === 'pdf' ? { soft: colors.skySoft, deep: colors.skyDeep } : { soft: colors.corgiSoft, deep: colors.corgiDeep };
  return <SoftSurface raised><PressScale accessibilityRole="button" accessibilityLabel={`${copy.documents.open}: ${record.title}`} onPress={() => onEdit({ record })} style={styles.card}>
    <View style={[styles.preview, { backgroundColor: tone.soft }]}>
      {kind === 'image' ? <Image source={{ uri: record.uri }} contentFit="cover" accessible={false} style={styles.fill} /> : <Icon name="note" size={tokens.size.touch} color={tone.deep} />}
      <View style={[styles.badge, { backgroundColor: colors.surfaceRaised }]}><AppText variant="label" bold style={{ color: tone.deep }}>{copy.documents[kind]}</AppText></View>
    </View>
    <AppText bold numberOfLines={2}>{record.title}</AppText>
    <AppText variant="label" muted>{displayDate(record.createdAt.slice(0, 10))}</AppText>
  </PressScale></SoftSurface>;
});
function AddCard({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return <PressScale accessibilityRole="button" accessibilityLabel={copy.documents.add} onPress={onPress} style={[styles.add, { borderColor: colors.textMuted }]}>
    <View style={[styles.addTile, { backgroundColor: colors.skySoft }]}><Icon name="download" color={colors.skyDeep} /></View>
    <AppText bold style={styles.center}>{copy.documents.add}</AppText>
    <AppText variant="label" muted style={styles.center}>{copy.documents.addHint}</AppText>
  </PressScale>;
}
function Gap() { return <View style={styles.gap} />; }
const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 }, fill: { width: '100%', height: '100%' }, center: { textAlign: 'center' },
  page: { width: '100%', maxWidth: tokens.size.pageMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.space.xl },
  header: { gap: tokens.space.md, marginBottom: tokens.space.xl, alignItems: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  searchCard: { marginTop: tokens.space.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, paddingHorizontal: tokens.space.lg },
  searchInput: { flex: 1, minHeight: tokens.size.inputHeight, ...tokens.type.body },
  columns: { gap: tokens.space.md },
  // A lone last card keeps half width instead of stretching across the row.
  cell: { flex: 1, maxWidth: '48.5%' },
  card: { padding: tokens.space.md, gap: tokens.space.xs, alignItems: 'stretch', justifyContent: 'flex-start' },
  preview: { height: tokens.planner.dayHeight + tokens.space.hero, borderRadius: tokens.radius.icon, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: tokens.space.sm },
  badge: { position: 'absolute', top: tokens.space.sm, right: tokens.space.sm, borderRadius: tokens.radius.pill, paddingHorizontal: tokens.space.sm, paddingVertical: 2 },
  add: { flex: 1, minHeight: tokens.planner.dayHeight + tokens.space.hero * 2, borderRadius: tokens.radius.card, borderWidth: 2, borderStyle: 'dashed', padding: tokens.space.lg, gap: tokens.space.sm },
  addTile: { width: tokens.size.touch, height: tokens.size.touch, borderRadius: tokens.home.careTileRadius, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: tokens.space.xl, gap: tokens.space.md, alignItems: 'center' },
  gap: { height: tokens.space.md },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: tokens.space.md, paddingHorizontal: tokens.space.xl, alignItems: 'center' },
  cta: { width: '100%', maxWidth: tokens.size.pageMaxWidth },
});
