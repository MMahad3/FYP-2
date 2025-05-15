import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { STREAM_SERVER_URL, CAMERAS } from '../config/streams';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.100.55:5000'; // Update with your Flask server IP

export default function CCTVScreen() {
  const [selectedCamera, setSelectedCamera] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<{
    result: string;
    confidence: number;
    timestamp: number;
  } | null>(null);
  const videoRef = useRef<Video>(null);

  const handleVideoError = (error: string) => {
    console.error('Video Error:', error);
    setError('Failed to load camera feed. Please try again.');
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback Error:', status.error);
        setError(`Playback error: ${status.error}`);
      }
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setError(null);
    }
  };

  // Fetch classification results periodically
  useEffect(() => {
    const fetchClassification = async () => {
      try {
        const response = await fetch(`${API_URL}/live-classification`);
        const data = await response.json();
        setClassification(data);
      } catch (err) {
        console.error('Error fetching classification:', err);
      }
    };

    // Fetch immediately and then every 2 seconds
    fetchClassification();
    const interval = setInterval(fetchClassification, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Attempt to load and play the video when the component mounts
    const loadVideo = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.loadAsync(
            { 
              uri: `${STREAM_SERVER_URL}/index.m3u8`,
              overrideFileExtensionAndroid: 'm3u8'
            },
            {},
            false
          );
          await videoRef.current.playAsync();
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video stream');
      }
    };

    loadVideo();

    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const getClassificationColor = (result: string): string => {
    if (result === 'NormalVideos') {
      return '#4CAF50'; // Green for normal
    }
    return '#ff4444'; // Red for anomalies
  };

  const switchCamera = (cameraId: number) => {
    const camera = CAMERAS.find(cam => cam.id === cameraId);
    if (!camera) return;

    if (!camera.active) {
      setError('This camera is currently inactive');
      return;
    }

    setSelectedCamera(cameraId);
    setIsLoading(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Live CCTV Footage</Text>
      
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004d00" />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={[styles.errorText, styles.errorDetails]}>
              Please ensure the camera server is running and accessible.
            </Text>
          </View>
        )}

        <Video
          ref={videoRef}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          useNativeControls
          onError={handleVideoError}
          onLoad={handleVideoLoad}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          progressUpdateIntervalMillis={1000}
        />

        {classification && (
          <View style={styles.classificationContainer}>
            <Text style={[
              styles.classificationText,
              { color: getClassificationColor(classification.result) }
            ]}>
              {classification.result}
            </Text>
            <Text style={styles.confidenceText}>
              Confidence: {(classification.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.controlsTitle}>Select Camera</Text>
        <View style={styles.buttonContainer}>
          {CAMERAS.map((camera) => (
            <TouchableOpacity
              key={camera.id}
              style={[
                styles.cameraButton,
                selectedCamera === camera.id && styles.selectedButton,
                !camera.active && styles.inactiveButton,
              ]}
              onPress={() => switchCamera(camera.id)}
              disabled={!camera.active}
            >
              <Text style={[
                styles.buttonText,
                !camera.active && styles.inactiveButtonText
              ]}>
                {camera.name}
                {!camera.active && ' (Inactive)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isLoading ? 'Connecting...' : error ? 'Disconnected' : 'Connected'}
        </Text>
        <View style={[
          styles.statusIndicator,
          isLoading ? styles.statusConnecting : error ? styles.statusError : styles.statusConnected
        ]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  videoContainer: {
    width: width - 40,
    height: 300,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    position: 'absolute',
    zIndex: 1,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
  },
  classificationContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  classificationText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confidenceText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  controlsContainer: {
    marginTop: 20,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  cameraButton: {
    backgroundColor: '#004d00',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 100,
  },
  selectedButton: {
    backgroundColor: '#008000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  statusText: {
    color: '#fff',
    marginRight: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusConnecting: {
    backgroundColor: '#ffd700',
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#ff4444',
  },
  errorDetails: {
    fontSize: 12,
    marginTop: 8,
    color: '#ff8888',
  },
  inactiveButton: {
    backgroundColor: '#333333',
    opacity: 0.7,
  },
  inactiveButtonText: {
    color: '#999999',
  },
}); 