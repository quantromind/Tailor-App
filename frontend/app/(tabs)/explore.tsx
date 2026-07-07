import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const HomeScreen: React.FC = () => {

  const handleGenderSelect = (gender: string) => {
    console.log("Selected:", gender);
  };

  return (
    <LinearGradient
      colors={["#FFF8D6", "#FFD76A"]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* App Title */}
        <Text style={styles.title}>eTailoring</Text>

        {/* Welcome Text */}
        <Text style={styles.welcome}>Welcome, User!</Text>
        <Text style={styles.subtitle}>
          Let's find your perfect fit.
        </Text>

        {/* Gender Selection Card */}
        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Who are you registering for?
          </Text>

          <Text style={styles.cardSubtitle}>
            Select to begin your personalized tailoring experience.
          </Text>

          <View style={styles.genderContainer}>

            <Pressable
              style={styles.genderButton}
              onPress={() => handleGenderSelect("Male")}
            >
              <Ionicons name="man" size={40} color="#3B6FD6" />
              <Text style={styles.genderText}>Male</Text>
            </Pressable>

            <Pressable
              style={styles.genderButton}
              onPress={() => handleGenderSelect("Female")}
            >
              <Ionicons name="woman" size={40} color="#E45A84" />
              <Text style={styles.genderText}>Female</Text>
            </Pressable>

          </View>

        </View>

        {/* How It Works Section */}

        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={styles.stepsContainer}>

          <View style={styles.stepCard}>
            <Ionicons name="person-circle" size={28} color="#444" />
            <Text style={styles.stepText}>Create Profile</Text>
          </View>

          <View style={styles.stepCard}>
            <MaterialCommunityIcons
              name="tape-measure"
              size={28}
              color="#444"
            />
            <Text style={styles.stepText}>Get Measured</Text>
          </View>

          <View style={styles.stepCard}>
            <Ionicons name="shirt-outline" size={28} color="#444" />
            <Text style={styles.stepText}>Select Style</Text>
          </View>

          <View style={styles.stepCard}>
            <Ionicons name="checkmark-circle" size={28} color="#444" />
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
};

export default HomeScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#333"
  },

  welcome: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10
  },

  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 25
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 5
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center"
  },

  cardSubtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 5
  },

  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20
  },

  genderButton: {
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    width: 120
  },

  genderText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500"
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10
  },

  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },

  stepCard: {
    width: 80,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3
  },

  stepText: {
    fontSize: 11,
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
    fontSize: 12,
    marginTop: 3
  }

});