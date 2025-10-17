import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, usePathname, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { children: React.ReactNode };

const NAV = [
    {
        section: 'Dashboard',
        items: [
            { label: 'Home', icon: 'home-outline', href: '/(admin)/dashboard/home' },
            { label: 'Formulario', icon: 'file-document-edit-outline', href: '/(admin)/dashboard/form' },
            { label: 'Reportes', icon: 'chart-box-outline', href: '/(admin)/dashboard/reporte' },
        ],
    },
    {
        section: 'Security',
        items: [
            { label: 'Users', icon: 'account-multiple-outline', href: '/(admin)/security/users' },
            { label: 'Roles', icon: 'shield-account-outline', href: '/(admin)/security/roles' },
            { label: 'Permissions', icon: 'key-outline', href: '/(admin)/security/permissions' },
        ],
    },
] as const;

const RAIL_W = 272;      // ancho persistente en md/desktop
const DRAWER_W = 300;    // ancho del drawer en mobile
const HEADER_H = 56;

export default function AdminShell({ children }: Props) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMd = width >= 768;

    const router = useRouter();
    const pathname = usePathname();
    const { signOut, user } = useAuth();

    const bg = useThemeColor({}, 'background');
    const text = useThemeColor({}, 'text');
    const tint = useThemeColor({}, 'tint');

    const [open, setOpen] = useState(false);

    // Animadores para mobile drawer
    const animX = useRef(new Animated.Value(-DRAWER_W)).current;
    const backdrop = animX.interpolate({
        inputRange: [-DRAWER_W, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const topOffset = HEADER_H + insets.top;

    const springTo = (toValue: number) =>
        Animated.spring(animX, {
            toValue,
            useNativeDriver: true,
            damping: 18,
            stiffness: 200,
            mass: 0.9,
        });

    const showSidebar = () => {
        setOpen(true);
        springTo(0).start();
    };

    const hideSidebar = () => {
        springTo(-DRAWER_W).start(({ finished }) => {
            if (finished) setOpen(false);
        });
    };

    const toggleSidebar = () => (open ? hideSidebar() : showSidebar());

    const avatarLetter = useMemo(
        () => (user?.email ? user.email[0].toUpperCase() : 'U'),
        [user?.email]
    );

    const isActive = (href: string) => pathname?.startsWith(href);

    // margen del contenido cuando el rail es persistente
    const contentMarginLeft = isMd ? RAIL_W : 0;

    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header superior simétrico */}
            <View
                style={[
                    styles.header,
                    {
                        height: HEADER_H + insets.top,
                        paddingTop: insets.top,
                        borderColor: '#00000012',
                        backgroundColor: bg,
                    },
                ]}
            >
                <Pressable onPress={isMd ? undefined : toggleSidebar} style={[styles.iconBtn, {padding: 2}]} accessibilityRole="button">
                    {!isMd && <MaterialCommunityIcons name="menu" size={28} color={text} />}
                </Pressable>

                <View style={styles.brandWrap}>
                    <Image
                        source={require('@/assets/images/pame-logo-t.png')}
                        style={{ width: 22, height: 22, marginRight: 8 }}
                        resizeMode="contain"
                    />
                    <Text style={[styles.brand, { color: text }]}>Pame Admin</Text>
                </View>

                {/* Acciones a la derecha (placeholders) */}
                <View style={styles.actionsRight}>
                    <Pressable style={styles.actionPill} accessibilityRole="button">
                        <MaterialCommunityIcons name="bell-outline" size={18} color={text} />
                    </Pressable>
                    <Pressable style={[styles.actionPill, { marginLeft: 6 }]} accessibilityRole="button">
                        <MaterialCommunityIcons name="account-circle-outline" size={20} color={text} />
                    </Pressable>
                </View>
            </View>

            {/* Contenido principal */}
            <View style={[styles.main, { marginTop: topOffset, marginLeft: contentMarginLeft }]}>
                {children}
            </View>

            {/* Rail persistente en md/desktop (sin backdrop) */}
            {isMd && (
                <View
                    style={[
                        styles.rail,
                        {
                            top: topOffset,
                            width: RAIL_W,
                            backgroundColor: Platform.select({
                                ios: 'rgba(250,250,250,1)',
                                android: 'rgba(250,250,250,1)',
                                default: 'rgba(250,250,250,0.98)',
                            }),
                        },
                    ]}
                >
                    <SidebarContent
                        text={text}
                        tint={tint}
                        isActive={isActive}
                        onItemPress={() => { }}
                        userEmail={user?.email}
                        onSignOut={async () => {
                            await signOut();
                            router.replace('/auth/login' as const);
                        }}
                    />
                </View>
            )}

            {/* Drawer mobile (con backdrop y borde redondeado) */}
            {!isMd && (
                <>
                    {open && (
                        <Animated.View
                            pointerEvents={open ? 'auto' : 'none'}
                            style={[styles.backdrop, { top: topOffset, opacity: backdrop }]}
                        >
                            <Pressable
                                onPress={hideSidebar}
                                style={StyleSheet.absoluteFill}
                                {...(Platform.OS === 'android'
                                    ? { android_ripple: { color: '#00000033' } }
                                    : {})}
                            />
                        </Animated.View>
                    )}

                    <Animated.View
                        style={[
                            styles.drawer,
                            {
                                top: topOffset,
                                width: DRAWER_W,
                                transform: [{ translateX: animX }],
                                backgroundColor: Platform.select({
                                    ios: 'rgba(250,250,250,1)',
                                    android: 'rgba(250,250,250,1)',
                                    default: 'rgba(255,255,255,0.98)',
                                }),
                            },
                        ]}
                    >
                        {/* Header del drawer */}
                        <View style={styles.drawerHeader}>
                            <View style={styles.logoRow}>
                                <Image
                                    source={require('@/assets/images/pame-logo-t.png')}
                                    style={{ width: 22, height: 22, marginRight: 8 }}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.sidebarTitle, { color: text }]}>Pame Admin</Text>
                            </View>
                            <Pressable onPress={hideSidebar} style={styles.iconBtn} accessibilityRole="button">
                                <MaterialCommunityIcons name="close" size={20} color={text} />
                            </Pressable>
                        </View>

                        <SidebarContent
                            text={text}
                            tint={tint}
                            isActive={isActive}
                            onItemPress={hideSidebar}
                            userEmail={user?.email}
                            onSignOut={async () => {
                                await signOut();
                                router.replace('/auth/login' as const);
                            }}
                        />
                    </Animated.View>
                </>
            )}
        </View>
    );
}

/** Contenido común del sidebar (rail/drawer) */
function SidebarContent({
    text,
    tint,
    isActive,
    onItemPress,
    userEmail,
    onSignOut,
}: {
    text: string;
    tint: string;
    isActive: (href: string) => boolean;
    onItemPress: () => void;
    userEmail?: string | null;
    onSignOut: () => Promise<void>;
}) {
    const avatarLetter = useMemo(() => (userEmail ? userEmail[0].toUpperCase() : 'U'), [userEmail]);
    return (
        <>
            <View style={{ paddingHorizontal: 10, paddingTop: 6 }}>
                {NAV.map((sec) => (
                    <View key={sec.section} style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9aa0a6', marginBottom: 6 }}>
                            {sec.section}
                        </Text>
                        {sec.items.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link key={item.href} href={item.href} asChild>
                                    <Pressable
                                        onPress={onItemPress}
                                        style={[
                                            styles.navItem,
                                            active && { backgroundColor: `${tint}14`, borderColor: `${tint}55` },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={item.icon as any}
                                            size={18}
                                            color={active ? tint : text}
                                            style={{ width: 22 }}
                                        />
                                        <Text
                                            style={[styles.navLabel, { color: active ? tint : text }]}
                                            numberOfLines={1}
                                        >
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                </Link>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={[styles.sidebarFooter, { borderTopColor: '#00000010' }]}>
                <View style={styles.avatar}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{avatarLetter}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: text }} numberOfLines={1}>
                        {userEmail ?? 'user@example.com'}
                    </Text>
                    <Pressable onPress={onSignOut}>
                        <Text style={{ color: '#ef4444', fontWeight: '600' }}>Cerrar sesión</Text>
                    </Pressable>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
    },
    brandWrap: { flexDirection: 'row', alignItems: 'center' },
    brand: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

    actionsRight: { flexDirection: 'row', alignItems: 'center' },
    actionPill: {
        height: 34, width: 34, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },

    main: { flex: 1, minHeight: 0, padding: 12 },

    // Rail persistente
    rail: {
        position: 'absolute',
        left: 0, bottom: 0,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: '#00000012',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
            android: { elevation: 6 },
            default: { boxShadow: '0 10px 30px rgba(0,0,0,0.12)' as any },
        }),
    },

    // Drawer mobile
    drawer: {
        position: 'absolute',
        left: 0, bottom: 0,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: '#00000012',
        borderTopRightRadius: 16, // look moderno
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
            android: { elevation: 12 },
            default: { boxShadow: '0 24px 48px rgba(0,0,0,0.18)' as any },
        }),
    },

    drawerHeader: {
        height: 52,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#00000010',
    },

    backdrop: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        backgroundColor: '#0f172a99',
    },

    logoRow: { flexDirection: 'row', alignItems: 'center' },
    sidebarTitle: { fontSize: 15, fontWeight: '800' },

    navItem: {
        height: 42,
        borderRadius: 10,
        paddingHorizontal: 10,
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'transparent',
    },
    navLabel: { fontSize: 14, fontWeight: '600', marginLeft: 8 },

    sidebarFooter: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32, height: 32, borderRadius: 999, backgroundColor: '#475569',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
    },
    iconBtn: {
      
    }
});
