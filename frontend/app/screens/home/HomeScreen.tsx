import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../../src/constants/colors';
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import { getRecentOrders } from '../../../api';

const STATUS_COLORS: Record<string, string> = {
    pending: '#FF6B6B',
    'in-progress': '#FF9800',
    completed: '#4CAF50',
    delivered: '#2196F3',
    cancelled: '#9E9E9E',
};

export default function HomeScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadUserName();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRecentOrders();
        }, [])
    );

    const loadUserName = async () => {
        try {
            const profileData = await AsyncStorage.getItem('@tailor_profile');
            if (profileData) {
                const profile = JSON.parse(profileData);
                setUserName(profile.name || '');
            }
        } catch (e) {
            console.error('Failed to load profile:', e);
        }
    };

    const loadRecentOrders = async () => {
        try {
            setLoadingOrders(true);
            const data = await getRecentOrders();
            // Backend already filters out completed/delivered
            setRecentOrders(data.slice(0, 5));
        } catch (e) {
            console.error('Failed to load recent orders:', e);
        } finally {
            setLoadingOrders(false);
        }
    };

    return (
        <View
            style={styles.container}
        >
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.appName}>eTailoring</Text>
                        <Text style={styles.welcome}>{t('welcome_user', { name: userName || 'Tailor' })}</Text>
                        <Text style={styles.subtitle}>{t('subtitle_home')}</Text>
                    </View>
                    <LottieView
                        source={require('../../../assets/animations/Sewing tools.json')}
                        autoPlay
                        loop
                        style={styles.headerAnimation}
                    />
                </View>

                {/* Search Client Button */}
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('ExistingCust')}
                >
                    <Ionicons name="search-outline" size={24} color={Colors.primary} />
                    <Text style={styles.searchButtonText}>{t('search_client')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>

                {/* New/Existing Selection Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('start_new_design')}</Text>
                    <View style={styles.genderRow}>
                        <Pressable
                            style={styles.genderCard}
                            onPress={() => navigation.navigate('AddClient')}
                        >
                            <Ionicons name="person-add" size={40} color={Colors.primary} />
                            <Text style={styles.genderText}>{t('new_customer')}</Text>
                        </Pressable>
                        <Pressable
                            style={styles.genderCard}
                            onPress={() => navigation.navigate('ExistingCust', {})}
                        >
                            <Ionicons name="people" size={40} color={Colors.secondary} />
                            <Text style={styles.genderText}>{t('existing_client')}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* My Designs Button */}
                <TouchableOpacity
                    style={styles.designsButton}
                    onPress={() => navigation.navigate('ViewDesigns')}
                >
                    <LinearGradient
                        colors={['#344E41', '#588157']}
                        style={styles.designsGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="color-palette-outline" size={28} color="#FFF" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.designsTitle}>{t('my_designs')}</Text>
                            <Text style={styles.designsSub}>{t('view_designs_sub')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Recent Orders (excludes completed/delivered) */}
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>{t('recent_orders')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('History')}>
                        <Text style={styles.viewAll}>{t('view_all')}</Text>
                    </TouchableOpacity>
                </View>

                {loadingOrders ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
                ) : recentOrders.length === 0 ? (
                    <View style={styles.emptyOrders}>
                        <Ionicons name="receipt-outline" size={36} color={Colors.border} />
                        <Text style={styles.emptyOrdersText}>{t('no_recent_orders')}</Text>
                    </View>
                ) : (
                    recentOrders.map((order) => {
                        const statusColor = STATUS_COLORS[order.status] || '#999';
                        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
                        return (
                            <TouchableOpacity
                                key={order._id}
                                style={styles.recentOrderCard}
                                onPress={() => navigation.navigate('ClientDetail', { client: order.customer, customerId: order.customer?._id })}
                            >
                                <View style={styles.recentOrderLeft}>
                                    <Text style={styles.recentClientName}>{order.customer?.name || t('no_client')}</Text>
                                    <Text style={styles.recentDesignName}>{order.design?.name || '—'}</Text>
                                    <Text style={styles.recentDate}>{date}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                                    <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* Powered by Quantromind */}
                <View style={styles.poweredBy}>
                    <Text style={styles.poweredByText}>{t('powered_by')}</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: -20, paddingHorizontal: 20, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -40 },
    appName: { fontSize: 28, fontWeight: '900', color: Colors.textDark, marginBottom: 4 },
    headerAnimation: { width: 200, height: 200, marginRight: -20 },
    welcome: { fontSize: 16, fontWeight: '600', color: Colors.textDark, marginBottom: 4 },
    subtitle: { fontSize: 13, color: Colors.textLight },
    searchButton: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: Colors.surface, padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(52, 78, 65, 0.15)',
        marginBottom: 20, shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    searchButtonText: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.primary },
    card: {
        backgroundColor: Colors.surface, borderRadius: 20, padding: 20,
        marginBottom: 16, borderWidth: 1, borderColor: 'rgba(52, 78, 65, 0.1)',
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.textLight, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    genderRow: { flexDirection: 'row', gap: 12 },
    genderCard: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 20,
        alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(52, 78, 65, 0.1)', elevation: 1,
    },
    genderText: { fontSize: 13, fontWeight: '700', color: '#344E41', textAlign: 'center' },
    designsButton: { marginBottom: 20, borderRadius: 20, overflow: 'hidden', elevation: 4 },
    designsGradient: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
    designsTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    designsSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
    viewAll: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    recentOrderCard: {
        backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
        marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(52, 78, 65, 0.08)', elevation: 1,
    },
    recentOrderLeft: { flex: 1 },
    recentClientName: { fontSize: 15, fontWeight: '700', color: '#344E41' },
    recentDesignName: { fontSize: 13, color: '#6B705C', marginTop: 2 },
    recentDate: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
    statusBadge: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
    },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    emptyOrders: { alignItems: 'center', paddingVertical: 30, gap: 10 },
    emptyOrdersText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
    poweredBy: { alignItems: 'center', paddingVertical: 20, marginTop: 10 },
    poweredByText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 1 },
});
