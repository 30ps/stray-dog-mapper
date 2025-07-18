
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Modal, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
// Removed Camera import, using ImagePicker for camera
import * as ImagePicker from 'expo-image-picker';

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
  // Removed form state (breed, age, size)
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
  const [photo, setPhoto] = useState<any>(null);

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

  const openCamera = async () => {
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
      setPhoto(result.assets[0]);
    }
  };

  // Removed takePhoto and cameraRef

  const submitDog = async () => {
    try {
      if (!location) {
        Alert.alert('Error', 'Location not available. Please try again.');
        return;
      }
      if (!photo) {
        Alert.alert('Error', 'Please take a photo of the dog.');
        return;
      }
      setUploading(true);
      // Upload photo to backend (no breed, age, size)
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

      const res = await axios.post(`${API_URL}/dogs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhoto(null);
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
              // ...other props...
            />
        ))}
      </MapView>
      <ScrollView style={styles.formContainer}>
        <Text style={styles.header}>Stray Dog Mapper</Text>
        {/* Removed breed, age, size text inputs */}
        {photo && (
          <Image source={{ uri: photo.uri }} style={{ width: 120, height: 120, alignSelf: 'center', margin: 8, borderRadius: 8 }} />
        )}
        {errorMsg && <Text style={{ color: 'red' }}>{errorMsg}</Text>}
        <Button title={photo ? 'Retake Photo' : 'Take Photo'} onPress={openCamera} />
        <View style={{ height: 8 }} />
        {uploading ? <ActivityIndicator size="large" color="#007AFF" /> : <Button title="Submit Sighting" onPress={submitDog} />}
      </ScrollView>

      {/* Camera Modal removed; using ImagePicker for camera */}
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
                <Button title="Close" onPress={() => setModalVisible(false)} />
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
  formContainer: { padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, alignSelf: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 },
  map: { width: '100%', height: 400, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', width: 300 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  dogImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: '#eee' },
});
