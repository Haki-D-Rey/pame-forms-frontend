import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, Math.round(screenWidth * 0.8));

type MenuDrawerProps = {
    visible: boolean;
    onClose: () => void;
    modules?: string[];
};

export default function MenuDrawer({ visible, onClose, modules = [] }: MenuDrawerProps) {
    // Keep a stable Animated.Value instance across renders
    const translateX = React.useRef(new Animated.Value(visible ? 0 : DRAWER_WIDTH)).current;

    React.useEffect(() => {
        Animated.timing(translateX, {
            toValue: visible ? 0 : DRAWER_WIDTH,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [visible, translateX]);

    return (
        <View pointerEvents={visible ? 'auto' : 'none'} style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={onClose} />

            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.headerRow}>
                        <ThemedText style={styles.header}>Módulos</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={Colors.light.icon} />
                        </Pressable>
                    </View>

                    <FlatList
                        data={modules}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <Pressable style={styles.moduleRow} onPress={() => {
                                // For now just close when selecting
                                onClose();
                            }}>
                                <ThemedText style={styles.moduleText}>{item}</ThemedText>
                            </Pressable>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </SafeAreaView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.32)',
    },
    drawer: {
        width: DRAWER_WIDTH,
        backgroundColor: Colors.light.background,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 10,
    },
    safe: {
        flex: 1,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    header: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 6,
        borderRadius: 8,
    },
    moduleRow: {
        paddingVertical: 12,
    },
    moduleText: {
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.light.background,
        marginVertical: 6,
    },
});