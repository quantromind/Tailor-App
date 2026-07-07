import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../constants/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * Consistent gradient header (rounded bottom corners, optional back button,
 * optional right-side accessory) used across nearly every screen in the app.
 * Centralizing this keeps spacing/typography identical everywhere.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, right }) => {
  return (
    <LinearGradient
      colors={Colors.gradientPrimary as [string, string]}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back-outline" size={22} color={Colors.textDark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtnSpacer} />
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={styles.iconBtnSpacer}>{right}</View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12, paddingTop: 18, paddingBottom: 22,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44, 66, 56, 0.06)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  iconBtnSpacer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontFamily: Typography.extraBold, color: Colors.textDark, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, fontFamily: Typography.bold, color: Colors.textLight, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
});

export default ScreenHeader;
