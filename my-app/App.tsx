import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import CCTVScreen from './screens/CCTVScreen';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

interface FileType {
  uri: string;
  type: string;
  name: string;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [classificationResult, setClassificationResult] = useState<string>('');
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1.5);
    const splashTimeout = setTimeout(() => setShowSplash(false), 8000);
    return () => clearTimeout(splashTimeout);
  }, []);

  const pickFile = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
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
      alert('Error picking file');
    }
  };

  const handleClassification = async (file: ImagePicker.ImagePickerAsset) => {
    try {
      const formData = new FormData();
      const fileToUpload: FileType = {
        uri: file.uri,
        type: 'image/jpeg',
        name: 'upload.jpg'
      };
      formData.append('file', fileToUpload as any);

      const response = await fetch('http://127.0.0.1:5000/classify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error in classification');
      }

      const data = await response.json();
      setClassificationResult(data.result || 'No result received');
      alert(`Detected activity: ${data.result}`);
    } catch (error) {
      console.error('Error during classification:', error);
      setClassificationResult('Error during classification');
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.Image
          source={require('./assets/images/logo.jpg')}
          style={[styles.splashLogo, animatedStyle]}
        />
        <Animated.Text style={styles.splashText}>
          Your Gateway Towards Safety
        </Animated.Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'CCTV') {
              iconName = focused ? 'videocam' : 'videocam-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#004d00',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopColor: '#333',
          },
          headerStyle: {
            backgroundColor: '#004d00',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Tab.Screen 
          name="CCTV" 
          component={CCTVScreen}
          options={{
            title: 'Live CCTV',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  splashLogo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  splashText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#004d00',
  },
});
