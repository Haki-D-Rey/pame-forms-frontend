import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, Text, View } from 'react-native';

export default function UsersScreen() {
  const text = useThemeColor({}, 'text');
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: text }]}>Security / Users</Text>
      <Text style={{ color: text, opacity: 0.8 }}>Gestión de usuarios.</Text>
    </View>
  );
}
const styles = StyleSheet.create({ wrap: { flex: 1 }, title: { fontSize: 18, fontWeight: '800', marginBottom: 6 } });
