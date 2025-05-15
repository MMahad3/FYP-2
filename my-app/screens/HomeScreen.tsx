import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Update with your computer's IP address (Flask runs on port 5000 by default)
const API_URL = 'http://192.168.100.55:5000';

// Add classification result type
type ClassificationType = 'Abuse' | 'Arrest' | 'Arson' | 'Assault' | 'Burglary' |
                        'Explosion' | 'Fighting' | 'NormalVideos' | 'RoadAccident' |
                        'Robbery' | 'Shooting' | 'Shoplifting' | 'Stealing' | 'Vandalism';

interface FileType {
  uri: string;
  type: string;
  name: string;
}

export default function HomeScreen() {
  const [selectedFile, setSelectedFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [classificationResult, setClassificationResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      console.log('Backend status:', data.status);
      if (data.status !== 'OK') {
        throw new Error('Backend not ready');
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to the backend server. Please make sure it is running.'
      );
    }
  };

  const getResultColor = (result: string): string => {
    if (result === 'NormalVideos') {
      return '#4CAF50'; // Green for normal
    } else if (result === 'Error during classification') {
      return '#f44336'; // Red for error
    } else {
      return '#ff9800'; // Orange for anomalies
    }
  };

  const getResultMessage = (result: string): string => {
    if (result === 'NormalVideos') {
      return 'No anomalies detected';
    } else if (result === 'Error during classification') {
      return result;
    } else {
      return `Anomaly Detected: ${result}`;
    }
  };

  const pickFile = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        handleClassification(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file from library');
    }
  };

  const handleClassification = async (file: ImagePicker.ImagePickerAsset) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      const fileToUpload: FileType = {
        uri: file.uri,
        // Ensure correct mime type for videos
        type: file.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: file.fileName || 'upload.jpg'
      };
      formData.append('file', fileToUpload as any);

      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setClassificationResult(data.result);
      Alert.alert('Analysis Complete', getResultMessage(data.result));
    } catch (error) {
      console.error('Error during classification:', error);
      setClassificationResult('Error during classification');
      Alert.alert('Error', 'Failed to analyze the file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>GUARDIAN VISION: IMPROVING PUBLIC SAFETY</Text>
      </View>

      <View style={styles.mainContent}>
        <Video
          source={require('../assets/videos/ANOMALY DETECTION.mp4')}
          style={styles.video}
          shouldPlay
          isLooping
          isMuted
          resizeMode={ResizeMode.COVER}
        />

        <View style={styles.introSection}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.introText}>
            Welcome to our anomaly detection platform. Our system leverages advanced AI-driven technology
            for real-time human behavior anomaly detection. Upload a video or image to detect various
            types of anomalies including fighting, accidents, theft, and more.
          </Text>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={pickFile}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Analyzing...' : 'Test Video or Image'}
            </Text>
          </TouchableOpacity>

          {classificationResult && (
            <View style={styles.resultContainer}>
              <Text style={[
                styles.resultText,
                { color: getResultColor(classificationResult) }
              ]}>
                {getResultMessage(classificationResult)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.featureText}>
            • Real-Time Detection{'\n'}
            • Context-Aware Analysis{'\n'}
            • Human Behavior Recognition{'\n'}
            • Scalable & Adaptive{'\n'}
            • Efficient Alerts{'\n'}
            • User-Friendly Interface{'\n'}
            • Continuous Improvement{'\n'}
            • Data Security
          </Text>
        </View>

        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <View style={styles.teamMembers}>
            <View style={styles.teamMember}>
              <Image
                source={require('../assets/images/mahad.png')}
                style={styles.teamPhoto}
              />
              <Text style={styles.teamMemberName}>Mahad Munir (21k-3388)</Text>
            </View>
            <View style={styles.teamMember}>
              <Image
                source={require('../assets/images/taha.png')}
                style={styles.teamPhoto}
              />
              <Text style={styles.teamMemberName}>Taha Ahmad (21k-4833)</Text>
            </View>
            <View style={styles.teamMember}>
              <Image
                source={require('../assets/images/asad.png')}
                style={styles.teamPhoto}
              />
              <Text style={styles.teamMemberName}>Asad Noor (21k-4678)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#004d00',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    color: '#fff',
  },
  mainContent: {
    padding: 20,
  },
  video: {
    width: width - 40,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  introSection: {
    color: '#fff',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#004d00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    marginTop: 10,
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  featuresSection: {
    marginBottom: 30,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  teamSection: {
    marginBottom: 30,
  },
  teamMembers: {
    marginTop: 20,
  },
  teamMember: {
    alignItems: 'center',
    marginBottom: 20,
  },
  teamPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
}); 