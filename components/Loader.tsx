/* eslint-disable react-hooks/rules-of-hooks */
// components/Loader.tsx
import React from 'react';
import {
    AccessibilityInfo,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

type LoaderProps = {
  /** Mostrar/ocultar loader */
  visible?: boolean;
  /** inline = dentro del layout | overlay = por encima de todo */
  variant?: 'inline' | 'overlay';
  /** Mensaje opcional debajo del spinner */
  message?: string;
  /** Tamaño base del loader (alto aprox. en px) */
  size?: number; // ← cambiado a number para controlar geométrico; default 36
  /** Color de las barras */
  color?: string;
  /** Opacidad del backdrop en overlay (0 a 1) */
  backdropOpacity?: number;
  /** Si true, evita interacción debajo del overlay */
  blockTouch?: boolean;
  /** Callback si se toca el fondo (overlay) */
  onBackdropPress?: () => void;
  /** Estilo extra para el contenedor inline u overlay wrapper */
  style?: StyleProp<ViewStyle>;
};

export default function Loader({
  visible = false,
  variant = 'inline',
  message,
  size = 36,
  color,
  backdropOpacity = 0.35,
  blockTouch = true,
  onBackdropPress,
  style,
}: LoaderProps) {
  if (!visible) return null;

  const barColor = color ?? (variant === 'overlay' ? '#fff' : '#222');

  if (variant === 'inline') {
    return (
      <View style={[styles.inline, style]} accessible accessibilityRole="progressbar">
        <BarsLoader size={size} color={barColor} />
        {message ? <Text style={styles.inlineText}>{message}</Text> : null}
      </View>
    );
  }

  // overlay
  const Backdrop = blockTouch ? Pressable : View;
  return (
    <View
      style={[styles.overlayRoot, style]}
      pointerEvents="box-none"
      accessibilityViewIsModal
      accessible
      accessibilityRole="progressbar"
      onLayout={() => AccessibilityInfo.announceForAccessibility?.(message ?? 'Cargando')}
    >
      <Backdrop
        style={[styles.backdrop, { backgroundColor: `rgba(0,0,0,${backdropOpacity})` }]}
        onPress={onBackdropPress}
        pointerEvents={blockTouch ? 'auto' : 'none'}
      >
        <View />
      </Backdrop>

      <View style={styles.overlayContent} pointerEvents="none">
        <View style={styles.loaderCard} pointerEvents="none">
          <BarsLoader size={size * 1.2} color={barColor} />
          {message ? <Text style={styles.overlayText}>{message}</Text> : null}
        </View>
      </View>
    </View>
  );
}

/** ====== Loader de 4 barras con Reanimated ====== */
function BarsLoader({ size = 36, color = '#fff' }: { size?: number; color?: string }) {
  // size gobierna alto total del loader; barras = ~70% del alto
  const height = Math.max(24, size);
  const barMax = Math.round(height * 0.72); // altura máxima de cada barra al “subir”
  const barMin = Math.max(6, Math.round(barMax * 0.28)); // altura mínima
  const barWidth = Math.max(3, Math.round(height * 0.14));
  const gap = Math.max(4, Math.round(barWidth * 0.7));

  // Un solo “reloj” cíclico [0..1] que repite; cada barra aplica un desfase
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [t]);

  // devuelve estilo animado para cada barra (offset = desfase entre 0 y 1)
  const barStyle = (offset: number) =>
    useAnimatedStyle(() => {
      // fase por barra: suma offset y mantiene en [0..1]
      const phase = (t.value + offset) % 1;
      // curva up-down: 0→max, 0.5→min, 1→max (onda triangular)
      const h = interpolate(
        phase,
        [0, 0.25, 0.5, 0.75, 1],
        [barMin, barMax, barMin, barMax, barMin]
      );
      return { height: h };
    });

  const b0 = barStyle(0.0);
  const b1 = barStyle(0.2);
  const b2 = barStyle(0.4);
  const b3 = barStyle(0.6);

  return (
    <View style={[styles.barsWrap, { height }]}>
      <Animated.View style={[styles.bar, b0, { width: barWidth, backgroundColor: color }]} />
      <View style={{ width: gap }} />
      <Animated.View style={[styles.bar, b1, { width: barWidth, backgroundColor: color }]} />
      <View style={{ width: gap }} />
      <Animated.View style={[styles.bar, b2, { width: barWidth, backgroundColor: color }]} />
      <View style={{ width: gap }} />
      <Animated.View style={[styles.bar, b3, { width: barWidth, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Inline
  inline: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },

  // Overlay
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCard: {
    minWidth: 140,
    maxWidth: '80%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,28,30,0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  overlayText: {
    marginTop: 10,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },

  // Barras
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end', // barras “crecen” hacia arriba
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 6,
  },
});
