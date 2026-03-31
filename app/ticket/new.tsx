import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet, Modal, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../contexts/AuthContext';
import { addTicket } from '../../lib/firestore';
import { TEAM_LIST, STADIUMS, TEAMS } from '../../constants/teams';
import { TeamId } from '../../types';

type Result = 'win' | 'lose' | 'tie' | undefined;

const EXPENSE_CATEGORIES = [
  { key: 'ticket',    label: '🎟 票價' },
  { key: 'food',      label: '🍔 食飲料' },
  { key: 'transport', label: '🚗 交通／停車' },
  { key: 'hotel',     label: '🛏 住宿' },
  { key: 'other',     label: '⋯ 其他' },
];

interface ExpenseItem { category: string; label: string; amount: string; }

export default function NewTicketScreen() {
  const { user, favoriteTeam } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string; homeTeam?: string; awayTeam?: string;
    stadium?: string; homeScore?: string; awayScore?: string;
  }>();

  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [date, setDate] = useState(params.date ?? new Date().toISOString().slice(0, 10));
  const [homeTeam, setHomeTeam] = useState<TeamId | undefined>(params.homeTeam as TeamId | undefined);
  const [awayTeam, setAwayTeam] = useState<TeamId | undefined>(params.awayTeam as TeamId | undefined);
  const [stadium, setStadium] = useState(params.stadium ?? '');
  const [seatSection, setSeatSection] = useState('');
  const [homeScore, setHomeScore] = useState(params.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(params.awayScore ?? '');
  const [supportTeam, setSupportTeam] = useState<TeamId | undefined>(favoriteTeam ?? undefined);
  const [result, setResult] = useState<Result>();
  const [ticketPrice, setTicketPrice] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [notes, setNotes] = useState('');
  const [seatPhoto, setSeatPhoto] = useState<string | null>(null);

  // 下拉選單狀態
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null); // null = 新增

  const fromGame = !!(params.homeTeam && params.awayTeam);

  const pickSeatPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相片權限', '請在設定中允許存取相片庫');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled) setSeatPhoto(result.assets[0].uri);
  };

  const takeSeatPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相機權限', '請在設定中允許存取相機');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setSeatPhoto(result.assets[0].uri);
  };

  // 壓縮並轉 base64（存進 Firestore，不需要 Firebase Storage）
  const compressToBase64 = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return `data:image/jpeg;base64,${result.base64}`;
  };

  const showSeatPhotoOptions = () => {
    Alert.alert('座位視角照片', '', [
      { text: '📷 拍照', onPress: takeSeatPhoto },
      { text: '🖼 從相片庫選取', onPress: pickSeatPhoto },
      ...(seatPhoto ? [{ text: '🗑 刪除照片', style: 'destructive' as const, onPress: () => setSeatPhoto(null) }] : []),
      { text: '取消', style: 'cancel' },
    ]);
  };

  const openCategoryPicker = (idx: number | null) => {
    setEditingIdx(idx);
    setShowCategoryPicker(true);
  };

  const selectCategory = (cat: { key: string; label: string }) => {
    setShowCategoryPicker(false);
    if (editingIdx === null) {
      // 新增一筆
      setExpenses([...expenses, { category: cat.key, label: cat.label, amount: '' }]);
    } else {
      // 修改既有項目的類別
      const next = [...expenses];
      next[editingIdx].category = cat.key;
      next[editingIdx].label = cat.label;
      setExpenses(next);
    }
  };

  const handleSave = async () => {
    if (!homeTeam || !awayTeam || !stadium) {
      Alert.alert('請填寫必填欄位', '主客隊與球場為必填');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      // 處理照片：壓縮並轉 base64
      let photoUrl: string | undefined;
      if (seatPhoto) {
        setCompressing(true);
        try { photoUrl = await compressToBase64(seatPhoto); }
        catch { /* 照片處理失敗不影響儲存 */ }
        finally { setCompressing(false); }
      }

      // 計算支出明細總計
      const parsedExpenses = expenses
        .map(e => ({ category: e.category, label: e.label, amount: parseInt(e.amount) || 0 }))
        .filter(e => e.amount > 0);
      const otherTotal = parsedExpenses.reduce((sum, e) => sum + e.amount, 0);

      await addTicket({
        userId: user.uid,
        date,
        homeTeam,
        awayTeam,
        stadium,
        seatSection,
        homeScore: homeScore ? parseInt(homeScore) : undefined,
        awayScore: awayScore ? parseInt(awayScore) : undefined,
        supportTeam: supportTeam ?? (favoriteTeam ?? homeTeam),
        result,
        ticketPrice: ticketPrice ? parseInt(ticketPrice) : undefined,
        expenseItems: parsedExpenses.length > 0 ? parsedExpenses : undefined,
        otherExpenses: otherTotal > 0 ? otherTotal : undefined,
        notes: notes || undefined,
        photoUrl,
      });
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('儲存失敗', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* 頂部標題 */}
        <View style={s.header}>
          <Text style={s.headerTitle}>新增票根</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}>

          {/* 比賽摘要卡片（從賽程跳轉） */}
          {fromGame && homeTeam && awayTeam ? (
            <View style={s.gameCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 34 }}>{TEAMS[awayTeam]?.emoji}</Text>
                  <Text style={s.teamName}>{TEAMS[awayTeam]?.shortName}</Text>
                  <Text style={s.sublabel}>客隊 AWAY</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={s.vs}>VS</Text>
                  <Text style={s.gameDate}>{date}</Text>
                  <Text style={s.gameStadium}>{stadium}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 34 }}>{TEAMS[homeTeam]?.emoji}</Text>
                  <Text style={s.teamName}>{TEAMS[homeTeam]?.shortName}</Text>
                  <Text style={s.sublabel}>主隊 HOME</Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <Section title="比賽日期 *">
                <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD"
                  style={s.input} keyboardType="numeric" />
              </Section>
              <Section title="客隊 *">
                <TeamPicker selected={awayTeam} onSelect={setAwayTeam} exclude={homeTeam} />
              </Section>
              <Section title="主隊 *">
                <TeamPicker selected={homeTeam} onSelect={setHomeTeam} exclude={awayTeam} />
              </Section>
              <Section title="球場 *">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {STADIUMS.map((st) => (
                    <TouchableOpacity key={st} onPress={() => setStadium(st)}
                      style={[s.chip, stadium === st && s.chipActive]}>
                      <Text style={[s.chipText, stadium === st && s.chipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>
            </>
          )}

          {/* 比賽結果 */}
          <Section title="比賽結果（選填）">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['win', 'lose', 'tie'] as const).map((r) => {
                const labels = { win: '🎉 勝', lose: '😔 敗', tie: '🤝 平' };
                return (
                  <TouchableOpacity key={r} onPress={() => setResult(result === r ? undefined : r)}
                    style={[s.resultBtn, result === r && s.resultBtnActive]}>
                    <Text style={[s.resultText, result === r && { color: 'white' }]}>{labels[r]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          {/* 比分 */}
          <Section title="比分（選填）">
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.sublabel}>客隊得分</Text>
                <TextInput value={awayScore} onChangeText={setAwayScore} placeholder="0"
                  keyboardType="numeric" style={s.input} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sublabel}>主隊得分</Text>
                <TextInput value={homeScore} onChangeText={setHomeScore} placeholder="0"
                  keyboardType="numeric" style={s.input} />
              </View>
            </View>
          </Section>

          {/* 支出資訊 */}
          <Section title="支出資訊（選填）">
            <View style={s.card}>
              {/* 固定票價列 */}
              <View style={s.expenseRow}>
                <Text style={s.expenseRowLabel}>🎟 票價</Text>
                <TextInput value={ticketPrice} onChangeText={setTicketPrice}
                  placeholder="NT$ 0" keyboardType="numeric" style={s.expenseInput} />
              </View>

              {/* 動態新增項目 */}
              {expenses.map((item, idx) => (
                <View key={idx} style={s.expenseRow}>
                  {/* 類別選擇按鈕 */}
                  <TouchableOpacity style={s.categoryBtn} onPress={() => openCategoryPicker(idx)}>
                    <Text style={s.categoryBtnText}>{item.label}</Text>
                    <Text style={s.categoryChevron}>▾</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={item.amount}
                    placeholder="NT$ 0"
                    keyboardType="numeric"
                    onChangeText={(v) => {
                      const next = [...expenses];
                      next[idx].amount = v;
                      setExpenses(next);
                    }}
                    style={s.expenseInput}
                  />
                  <TouchableOpacity onPress={() => setExpenses(expenses.filter((_, i) => i !== idx))}
                    style={{ marginLeft: 8 }}>
                    <Text style={{ color: '#e74c3c', fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={s.addBtn} onPress={() => openCategoryPicker(null)}>
                <Text style={s.addBtnText}>＋ 新增項目</Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* 座位 */}
          <Section title="座位（選填）">
            <View style={[s.card, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }]}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>🪑</Text>
              <TextInput value={seatSection} onChangeText={setSeatSection}
                placeholder="例：一壘內野C區12排"
                style={{ flex: 1, color: '#1a3a5c', fontSize: 14, paddingVertical: 12 }} />
            </View>
          </Section>

          {/* 座位視角照片 */}
          <Section title="座位視角（選填）">
            <TouchableOpacity style={s.photoUpload} onPress={showSeatPhotoOptions} activeOpacity={0.8}>
              {seatPhoto ? (
                <>
                  <Image source={{ uri: seatPhoto }} style={s.photoPreview} />
                  <View style={s.photoEditBadge}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>更換</Text>
                  </View>
                </>
              ) : (
                <View style={s.photoPlaceholder}>
                  <Text style={{ fontSize: 32 }}>📸</Text>
                  <Text style={{ color: '#95a5a6', fontSize: 13, marginTop: 6 }}>上傳座位視角照片</Text>
                  <Text style={{ color: '#c8bfb0', fontSize: 11, marginTop: 2 }}>拍照或從相片庫選取</Text>
                </View>
              )}
            </TouchableOpacity>
          </Section>

          {/* 加油球隊（手動輸入時才顯示） */}
          {!fromGame && (
            <Section title="我支持的球隊 *">
              <TeamPicker selected={supportTeam} onSelect={setSupportTeam} />
            </Section>
          )}

          {/* 備注 */}
          <Section title="備注（選填）">
            <TextInput value={notes} onChangeText={setNotes}
              placeholder="寫下這場比賽的回憶..." multiline numberOfLines={4}
              style={[s.input, { minHeight: 96, textAlignVertical: 'top' }]} />
          </Section>

          {/* 底部按鈕 */}
          <View style={s.bottomBar}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} disabled={saving}>
              <Text style={s.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={s.saveBtnText}>{compressing ? '處理照片⋯' : '儲存中⋯'}</Text>
                </View>
              ) : (
                <Text style={s.saveBtnText}>儲存票根</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* 類別選單 Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}>
          <View style={s.menuCard}>
            <Text style={s.menuTitle}>選擇支出類別</Text>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.key} style={s.menuItem}
                onPress={() => selectCategory(cat)}>
                <Text style={s.menuItemText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#1a3a5c', fontWeight: '600', fontSize: 14 }}>{title}</Text>
      {children}
    </View>
  );
}

function TeamPicker({ selected, onSelect, exclude }: {
  selected: TeamId | undefined; onSelect: (id: TeamId) => void; exclude?: TeamId;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {TEAM_LIST.filter((t) => t.id !== exclude).map((team) => (
        <TouchableOpacity key={team.id} onPress={() => onSelect(team.id)}
          style={[s.chip, selected === team.id && { backgroundColor: team.color + '25', borderColor: '#1a3a5c' }]}>
          <Text style={{ fontSize: 13 }}>{team.emoji} {team.shortName}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fdf6e3' },
  header: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0ebe0' },
  headerTitle: { color: '#1a3a5c', fontWeight: '700', fontSize: 16 },
  bottomBar: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e8e0d0', alignItems: 'center', backgroundColor: 'white' },
  cancelBtnText: { color: '#7f8c8d', fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#1a3a5c' },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  gameCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0ebe0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  teamName: { color: '#1a3a5c', fontWeight: '700', fontSize: 13, marginTop: 4 },
  vs: { color: '#1a3a5c', fontWeight: 'bold', fontSize: 18 },
  gameDate: { color: '#7f8c8d', fontSize: 11, marginTop: 4 },
  gameStadium: { color: '#7f8c8d', fontSize: 11 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#1a3a5c', borderWidth: 1, borderColor: '#f0ebe0', fontSize: 14 },
  sublabel: { color: '#95a5a6', fontSize: 11, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e8e0d0', backgroundColor: 'white' },
  chipActive: { backgroundColor: '#1a3a5c', borderColor: '#1a3a5c' },
  chipText: { fontSize: 12, color: '#1a3a5c' },
  chipTextActive: { color: 'white' },
  resultBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e8e0d0', backgroundColor: 'white', alignItems: 'center' },
  resultBtnActive: { backgroundColor: '#1a3a5c', borderColor: '#1a3a5c' },
  resultText: { fontSize: 14, fontWeight: '500', color: '#1a3a5c' },
  card: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#f0ebe0', overflow: 'hidden' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f5ed' },
  expenseRowLabel: { color: '#7f8c8d', fontSize: 13, flex: 1 },
  expenseInput: { color: '#1a3a5c', fontSize: 13, textAlign: 'right', minWidth: 80 },
  categoryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryBtnText: { color: '#1a3a5c', fontSize: 13, fontWeight: '500' },
  categoryChevron: { color: '#95a5a6', fontSize: 11 },
  addBtn: { paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#c0392b', fontWeight: '600', fontSize: 13 },
  // 照片
  photoUpload: { borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#e8e0d0', borderStyle: 'dashed', backgroundColor: 'white' },
  photoPreview: { width: '100%', height: 180 },
  photoPlaceholder: { height: 140, alignItems: 'center', justifyContent: 'center' },
  photoEditBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuCard: { backgroundColor: 'white', borderRadius: 18, width: 260, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  menuTitle: { color: '#95a5a6', fontSize: 11, fontWeight: '600', textAlign: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0ebe0', letterSpacing: 0.5 },
  menuItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f9f5ed' },
  menuItemText: { color: '#1a3a5c', fontSize: 15, fontWeight: '500' },
});
