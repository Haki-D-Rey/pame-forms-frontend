import { useThemeColor } from '@/hooks/use-theme-color';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// OJO: los paths deben existir 1:1 en tu árbol:
// app/(admin)/dashboard/home.tsx
// app/(admin)/dashboard/formulario.tsx
// app/(admin)/dashboard/reportes.tsx
// app/(admin)/security/users.tsx
// app/(admin)/security/roles.tsx
// app/(admin)/security/permissions.tsx
const CARDS = [
  { title: 'Dashboard',   icon: 'view-dashboard-outline',     href: '/(admin)/dashboard/home' },
  { title: 'Formularios', icon: 'file-document-edit-outline', href: '/(admin)/dashboard/form' },
  { title: 'Reportes',    icon: 'chart-box-outline',          href: '/(admin)/dashboard/reporte' },
  { title: 'Users',       icon: 'account-multiple-outline',   href: '/(admin)/security/users' },
  { title: 'Roles',       icon: 'shield-account-outline',     href: '/(admin)/security/roles' },
  { title: 'Permissions', icon: 'key-outline',                href: '/(admin)/security/permissions' },
] as const; // ← mantiene los literales; NO se tipa como string

export default function AdminIndex() {
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: text }]}>Módulos</Text>
      <View style={styles.grid}>
        {CARDS.map((c) => (
          <Link key={c.title} href={c.href} asChild> {/* ← pasa el literal directo */}
            <Pressable style={[styles.card, { borderColor: '#00000012' }]}>
              <MaterialCommunityIcons name={c.icon as any} size={28} color={tint} />
              <Text style={[styles.cardTitle, { color: text }]}>{c.title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 8 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    minHeight: 96,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    justifyContent: 'center',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
});
