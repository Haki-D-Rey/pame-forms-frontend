// src/components/GlobalAlert.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AlertType = 'success' | 'error';
export type ShowAlertParams = {
  type?: AlertType;
  title?: string;
  message: string;
  duration?: number;       // ms; si se omite, no autocierra
  logo?: ImageSourcePropType;
};

type Ctx = {
  show: (p: ShowAlertParams) => void;
  success: (msg: string, opts?: Omit<ShowAlertParams, 'message' | 'type'>) => void;
  error: (msg: string, opts?: Omit<ShowAlertParams, 'message' | 'type'>) => void;
  hide: () => void;
};

const AlertCtx = createContext<Ctx | null>(null);
export const useGlobalAlert = () => {
  const ctx = useContext(AlertCtx);
  if (!ctx) throw new Error('useGlobalAlert debe usarse dentro de <GlobalAlertProvider />');
  return ctx;
};

export function GlobalAlertProvider({
  children,
  logoDefault,
}: {
  children: React.ReactNode;
  logoDefault?: ImageSourcePropType;
}) {
  const insets = useSafeAreaInsets();

  // contenido
  const [type, setType] = useState<AlertType>('success');
  const [title, setTitle] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const [logo, setLogo] = useState<ImageSourcePropType | undefined>(logoDefault);

  // visibilidad / interacción
  const [interactive, setInteractive] = useState(false); // pointer events
  const [gone, setGone] = useState(true);                // display: none cuando está oculto

  // animación
  const open = useSharedValue(0);    // 0 oculto, 1 visible
  const progress = useSharedValue(0);

  const timerRef = useRef<NodeJS.Timeout | null | any>(null);
  const closingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // helpers para runOnJS (funciones estables)
  const markNotClosing = useCallback(() => { closingRef.current = false; }, []);
  const markGone = useCallback(() => { setGone(true); }, []);

  const hide = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    clearTimer();
    setInteractive(false); // desactiva clicks durante el cierre

    // Animamos a 0 y al terminar: ocultamos del layout y limpiamos flag
    open.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(markGone)();       // display: none → no queda sombra
        runOnJS(markNotClosing)(); // listo para siguientes shows
      }
    });

    // barra a 0
    progress.value = 0;
  }, [markGone, markNotClosing, open, progress]);

  const show = useCallback((p: ShowAlertParams) => {
    clearTimer();
    closingRef.current = false;

    setType(p.type ?? 'success');
    setTitle(p.title);
    setMessage(p.message);
    setLogo(p.logo ?? logoDefault);

    // vuelve a incluir en layout y permite interacción
    setGone(false);
    setInteractive(true);

    // abre
    open.value = withTiming(1, { duration: 200 });

    // progreso si hay duración
    if (p.duration && p.duration > 0) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: p.duration });
      timerRef.current = setTimeout(() => hide(), p.duration);
    } else {
      progress.value = 0;
    }
  }, [hide, logoDefault, open, progress]);

  const success = useCallback((msg: string, opts?: Omit<ShowAlertParams, 'message' | 'type'>) => {
    show({ type: 'success', message: msg, ...opts });
  }, [show]);

  const error = useCallback((msg: string, opts?: Omit<ShowAlertParams, 'message' | 'type'>) => {
    show({ type: 'error', message: msg, ...opts });
  }, [show]);

  // limpiar si desmonta el provider
  React.useEffect(() => () => clearTimer(), []);

  const ctxValue = useMemo<Ctx>(() => ({ show, success, error, hide }), [show, success, error, hide]);

  const theme = type === 'success'
    ? { bg: '#EAF6EE', border: '#A7F3D0', icon: '#16A34A', progress: '#22C55E', title: '#065F46', text: '#0F172A' }
    : { bg: '#FEECEC', border: '#FCA5A5', icon: '#DC2626', progress: '#EF4444', title: '#7F1D1D', text: '#0F172A' };

  // contenedor: opacidad + desplazamiento
  const containerAStyle = useAnimatedStyle(() => ({
    opacity: open.value,
    transform: [{ translateY: withTiming(open.value ? 0 : -12, { duration: 180 }) }],
  }));

  // tarjeta: quita sombra/elevation al estar oculta (evita borde fantasma)
  const cardAStyle = useAnimatedStyle(() => {
    const on = open.value > 0.01;
    return {
      // elevation / shadow dinámicos
      ...(Platform.OS === 'android' ? { elevation: on ? 6 : 0 } : { shadowOpacity: on ? 0.12 : 0 }),
    };
  });

  const progressAStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <AlertCtx.Provider value={ctxValue}>
      {children}

      {/* Siempre montado, pero cuando gone=true no ocupa layout ni dibuja sombra */}
      <Animated.View
        style={[
          styles.wrap,
          containerAStyle,
          { paddingTop: insets.top + 8, display: gone ? 'none' as const : 'flex' as const },
        ]}
        pointerEvents={interactive ? 'box-none' : 'none'}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.bg, borderColor: theme.border },
            cardAStyle,
          ]}
        >
          <View style={styles.leading}>
            {logo
              ? <Image source={logo} style={styles.logo} resizeMode="contain" />
              : <MaterialCommunityIcons name={type === 'success' ? 'check-circle-outline' : 'close-circle-outline'} size={24} color={theme.icon} />
            }
          </View>

          <View style={{ flex: 1 }}>
            {title ? <Text style={[styles.title, { color: theme.title }]} numberOfLines={1}>{title}</Text> : null}
            <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>{message}</Text>
          </View>

          <Pressable onPress={hide} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Cerrar alerta">
            <MaterialCommunityIcons name="close" size={18} color="#475569" />
          </Pressable>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { backgroundColor: theme.progress }, progressAStyle]} />
          </View>
        </Animated.View>
      </Animated.View>
    </AlertCtx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: '94%',
    maxWidth: 640,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    // ¡OJO! no ponemos sombra fija aquí; la animamos en cardAStyle
    ...(Platform.OS === 'web' ? { boxShadow: '0 10px 22px rgba(0,0,0,0.10)' as any } : null),
  },
  leading: { width: 28, height: 28, marginRight: 6, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 24, height: 24, borderRadius: 6 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  message: { fontSize: 13 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  progressTrack: {
    position: 'absolute',
    left: 10, right: 10, bottom: 8,
    height: 3, borderRadius: 999, overflow: 'hidden',
    backgroundColor: '#00000012',
  },
  progressFill: { flex: 1, transform: [{ scaleX: 0 }], transformOrigin: 'left' as any },
});
