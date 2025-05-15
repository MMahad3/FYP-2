// ExploreScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

const ExploreScreen = () => {
  const [cameraIp, setCameraIp] = useState("");
  const router = useRouter();

  const handleViewStream = () => {
    if (!cameraIp) {
      Alert.alert("Error", "Please enter a valid camera IP address");
      return;
    }

    // Simple IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(cameraIp)) {
      Alert.alert("Error", "Please enter a valid IP address (e.g., 192.168.1.100)");
      return;
    }

    router.push({
      pathname: "/livestream",
      params: { cameraIp },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/images/logo.jpg")} style={styles.logo} />
        <Text style={styles.headerText}>Explore CCTV Access</Text>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.introText}>
          Enter the IP address of your CCTV system to view live streams.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Camera IP (e.g., 192.168.1.100)"
          placeholderTextColor="#aaa"
          value={cameraIp}
          onChangeText={setCameraIp}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleViewStream}>
          <Text style={styles.buttonText}>View Live Streams</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure CCTV access through IP connection.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#004d00",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerText: {
    marginLeft: 10,
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  mainContent: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 15,
    marginHorizontal: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#555",
  },
  introText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
  },
  button: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#00b300",
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#004d00",
    borderRadius: 15,
    marginHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
});

export default ExploreScreen;
