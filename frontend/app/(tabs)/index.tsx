import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../../src/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    return (
        <LinearGradient
            colors={["#FFF9E6", "#FFD76A"]}
            style={styles.container}
        >
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <MaterialCommunityIcons
                        name="needle"
                        size={34}
                        color="#8B4513"
                    />
                    <Text style={styles.appName}>eTailoring</Text>
                </View>

                {/* Welcome */}
                <Text style={styles.welcome}>{t('welcome_user')}</Text>
                <Text style={styles.subtitle}>{t('subtitle_home')}</Text>

                {/* Search Client Button */}
                <TouchableOpacity 
                    style={styles.searchButton} 
                    onPress={() => navigation.navigate('Explore')}
                >
                    <Ionicons name="search-outline" size={24} color={Colors.primary} />
                    <Text style={styles.searchButtonText}>{t('search_client')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>

                {/* New/Existing Selection Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {t('start_new_design')}
                    </Text>

                    <View style={styles.genderRow}>
                        {/* New Customer */}
                        <Pressable 
                            style={styles.genderCard} 
                            onPress={() => navigation.navigate('Gender', { customerType: 'new' })}
                        >
                            <Ionicons name="person-add" size={40} color={Colors.primary} />
                            <Text style={styles.genderText}>{t('new_customer')}</Text>
                        </Pressable>

                        {/* Existing Customer */}
                        <Pressable 
                            style={styles.genderCard} 
                            onPress={() => navigation.navigate('Gender', { customerType: 'existing' })}
                        >
                            <Ionicons name="people" size={40} color={Colors.secondary} />
                            <Text style={styles.genderText}>{t('existing_client')}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* How It Works */}

                <Text style={styles.sectionTitle}>{t('how_it_works')}</Text>

                <View style={styles.steps}>

                    <View style={styles.stepCard}>
                        <Ionicons name="person-circle" size={28} color="#333" />
                        <Text style={styles.stepText}>Create Profile</Text>
                    </View>

                    <View style={styles.stepCard}>
                        <MaterialCommunityIcons
                            name="tape-measure"
                            size={28}
                            color="#333"
                        />
                        <Text style={styles.stepText}>Get Measured</Text>
                    </View>

                    <View style={styles.stepCard}>
                        <Ionicons name="shirt-outline" size={28} color="#333" />
                        <Text style={styles.stepText}>Select Style</Text>
                    </View>

                    <View style={styles.stepCard}>
                        <Ionicons name="checkmark-circle" size={28} color="#333" />
                        <Text style={styles.stepText}>Get Tailored</Text>
                    </View>

                </View>

            </ScrollView>

            {/* Bottom Navigation */}

            <View style={styles.bottomNav}>

                <View style={styles.navItem}>
                    <Ionicons name="home" size={24} color="#333" />
                    <Text style={styles.navText}>Home</Text>
                </View>

                <View style={styles.navItem}>
                    <Ionicons name="search" size={24} color="#333" />
                    <Text style={styles.navText}>Explore</Text>
                </View>

                <View style={styles.navItem}>
                    <Ionicons name="calendar" size={24} color="#333" />
                    <Text style={styles.navText}>Bookings</Text>
                </View>

                <View style={styles.navItem}>
                    <Ionicons name="person" size={24} color="#333" />
                    <Text style={styles.navText}>Profile</Text>
                </View>

            </View>

        </LinearGradient>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20
    },

    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#EDF1E4',
        shadowColor: '#344E41',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    searchButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#344E41',
        marginLeft: 12,
    },

    header: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10
    },

    appName: {
        fontSize: 30,
        fontWeight: "700",
        marginLeft: 10,
        color: "#5A3E1B"
    },

    welcome: {
        textAlign: "center",
        fontSize: 22,
        fontWeight: "600",
        marginTop: 10
    },

    subtitle: {
        textAlign: "center",
        color: "#666",
        marginBottom: 25
    },

    card: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 22,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 30
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20
    },

    genderRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    genderCard: {
        width: "48%",
        backgroundColor: "#FFF5CC",
        padding: 20,
        borderRadius: 18,
        alignItems: "center"
    },

    genderText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "600"
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 15
    },

    steps: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    stepCard: {
        width: 75,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
        elevation: 4
    },

    stepText: {
        fontSize: 10,
        textAlign: "center",
        marginTop: 5
    },

    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#fff",
        paddingVertical: 12,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },

    navItem: {
        alignItems: "center"
    },

    navText: {
        fontSize: 12
    }

});