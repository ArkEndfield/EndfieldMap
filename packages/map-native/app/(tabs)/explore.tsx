import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'es-MX', label: 'Español (México)' },
];

export default function LanguageScreen() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = React.useState(i18n.language);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code).then(() => setCurrent(code));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Language / 语言切换</Text>
      <Text style={styles.subtitle}>Current: {current}</Text>

      {LANGUAGES.map((lang) => (
        <Pressable
          key={lang.code}
          style={[styles.row, lang.code === current && styles.rowActive]}
          onPress={() => handleChange(lang.code)}
        >
          <Text style={[styles.rowText, lang.code === current && styles.rowTextActive]}>
            {lang.label}
          </Text>
          <Text style={styles.rowCode}>{lang.code}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  rowActive: { backgroundColor: '#007AFF' },
  rowText: { fontSize: 16, color: '#333' },
  rowTextActive: { color: '#fff', fontWeight: '600' },
  rowCode: { fontSize: 13, color: '#aaa' },
});
