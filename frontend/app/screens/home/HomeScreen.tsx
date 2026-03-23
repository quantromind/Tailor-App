import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientCard } from '../../../src/components/ClientCard';
import { Colors, Typography } from '../../../src/constants/colors';

export default function HomeScreen({ navigation }: any) {
  const dummyClients = [
    { id: '1', name: 'Rahul Sharma', item: 'Slim Fit Shirt', price: 300, deliveryDate: '18 March', status: 'Pending' },
    { id: '2', name: 'Amit Kumar', item: 'Pleated Pant', price: 350, deliveryDate: '20 March', status: 'Pending' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Obsidian header with Glassmorphism Logo */}
        <LinearGradient
          colors={Colors.gradientPrimary as [string, string]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Atelier Design</Text>
              <Text style={styles.subtitle}>Be a smart Darji</Text>
            </View>
            <View style={styles.logoSmall}>
              <LottieView
                source={require('../../../assets/animations/tailor_quiz.json')}
                autoPlay
                loop
                style={{ width: 77, height: 77 }}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainActionRow}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Gender', { customerType: 'new' })} 
            activeOpacity={0.85} 
            style={styles.actionBtnHalf}
          >
            <LinearGradient
              colors={Colors.gradientSecondary as [string, string]}
              style={styles.mainActionContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
              <Text style={styles.mainActionText}>New Customer</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Gender', { customerType: 'existing' })} 
            activeOpacity={0.85} 
            style={styles.actionBtnHalf}
          >
            <LinearGradient
              colors={['#3A66DB', '#2A4EB3'] as [string, string]}
              style={styles.mainActionContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people-outline" size={24} color="#FFFFFF" />
              <Text style={styles.mainActionText}>Existing Client</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* My Designs Section */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>My Designs</Text>
          <View style={[styles.featureRow, { padding: 0, overflow: 'hidden' }]}>
            <TouchableOpacity 
              style={[styles.featureItem, { padding: 20, borderRightWidth: 1, borderRightColor: Colors.border }]}
              onPress={() => navigation.navigate('MyDesigns')}
            >
              <Ionicons name="albums-outline" size={24} color={Colors.secondary} />
              <Text style={styles.featureText}>View Designs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureItem, { padding: 20 }]}
              onPress={() => navigation.navigate('AddDesign')}
            >
              <Ionicons name="add-circle-outline" size={24} color={Colors.secondary} />
              <Text style={styles.featureText}>+ New Design</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Search')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(163, 177, 138, 0.15)' }]}>
                <Ionicons name="search-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Search Client</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('History')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(163, 177, 138, 0.15)' }]}>
                <Ionicons name="time-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Section */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {dummyClients.map((client) => (
            <ClientCard
              key={client.id}
              name={client.name}
              item={client.item}
              price={client.price}
              deliveryDate={client.deliveryDate}
              onPress={() => navigation.navigate('ClientDetail', { client })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 40 },
  headerGradient: {
    padding: 24, paddingBottom: 32,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    marginBottom: 24,
    borderBottomWidth: 1, borderBottomColor: 'rgba(52, 78, 65, 0.05)'
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 30, fontFamily: Typography.fashionBold, color: Colors.textDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textLight, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  logoSmall: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(163, 177, 138, 0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(163, 177, 138, 0.3)'
  },
  mainActionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 32 },
  actionBtnHalf: { flex: 1, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  mainActionContent: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 },
  mainActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },
  featuresContainer: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fashionBold, color: Colors.textDark, marginBottom: 16, letterSpacing: 0.5 },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  featureItem: { alignItems: 'center', gap: 10, flex: 1 },
  featureText: { fontSize: 12, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  quickActionsContainer: { paddingHorizontal: 20, marginBottom: 32 },
  actionRow: { flexDirection: 'row', gap: 16 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  recentSection: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { color: Colors.secondary, fontSize: 14, fontWeight: '800' },
});
