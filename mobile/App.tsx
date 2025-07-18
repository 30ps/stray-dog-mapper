
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Cloud Run backend URL
const API_URL = 'https://stray-dog-mapper-266065529222.europe-west1.run.app';


interface Dog {
  id: number;
  breed: string;
  age: string;
  size: string;
  location: {
    latitude: number;
    longitude: number;
  };
  image_url: string;
  timestamp: string;
}


export default function App() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [region, setRegion] = useState({
    latitude: 39.3626,
    longitude: 22.9465,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDogs();
    getLocation();
  }, []);

  const fetchDogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/dogs`);
      setDogs(res.data);
    } catch (error) {
      setErrorMsg('Failed to fetch dogs');
      console.error(error);
    }
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    } catch (error) {
      setErrorMsg('Error getting location');
      console.error(error);
    }
  };

  const openCameraAndSubmit = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission not granted');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        await submitDog(photo);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to take or submit photo.');
      console.error(e);
    }
  };

  const submitDog = async (photo: any) => {
    try {
      if (!location) {
        Alert.alert('Error', 'Location not available. Please try again.');
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: 'dog.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('location', JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
      formData.append('timestamp', new Date().toISOString());
      await axios.post(`${API_URL}/dogs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploading(false);
      fetchDogs();
      Alert.alert('Success', 'Dog sighting submitted!');
    } catch (e) {
      setUploading(false);
      Alert.alert('Error', 'Failed to submit dog sighting.');
      console.error(e);
    }
  };

  const handleMarkerPress = (dog: Dog) => {
    setSelectedDog(dog);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Title at the top */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Stray Dog Mapper</Text>
        <TouchableOpacity style={styles.photoButton} onPress={openCameraAndSubmit} disabled={uploading}>
          <Ionicons name="camera" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          zoomEnabled={true}
          minZoomLevel={12}
          maxZoomLevel={20}
        >
          {dogs
            .filter(dog => dog.location && typeof dog.location.latitude === 'number' && typeof dog.location.longitude === 'number')
            .map((dog) => (
              <Marker
                key={dog.id}
                coordinate={{
                  latitude: dog.location.latitude,
                  longitude: dog.location.longitude,
                }}
                onPress={() => handleMarkerPress(dog)}
              />
          ))}
        </MapView>
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ color: '#fff', marginTop: 8 }}>Uploading...</Text>
          </View>
        )}
        {errorMsg && <Text style={{ color: 'red', alignSelf: 'center', margin: 8 }}>{errorMsg}</Text>}
      </View>
      {/* Dog Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDog && (
              <>
                <Text style={styles.modalTitle}>{selectedDog.breed || 'Unknown Breed'}</Text>
                <Image source={{ uri: selectedDog.image_url }} style={styles.dogImage} />
                <Text>Age: {selectedDog.age || 'Unknown'}</Text>
                <Text>Size: {selectedDog.size || 'Unknown'}</Text>
                <Text>Timestamp: {selectedDog.timestamp ? new Date(selectedDog.timestamp).toLocaleString() : 'Unknown'}</Text>
                <Text>Lat: {selectedDog.location.latitude.toFixed(5)}, Lon: {selectedDog.location.longitude.toFixed(5)}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  photoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', width: 300 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  dogImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: '#eee' },
  closeButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
});