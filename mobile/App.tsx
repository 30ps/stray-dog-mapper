
import React, { useState, useEffect } from 'react';
// Magnesia region bounding box (approximate)
const MAGNESIA_BOUNDS = {
  minLat: 39.0,
  maxLat: 39.7,
  minLon: 22.6,
  maxLon: 23.3,
};

function isInMagnesia(lat: number, lon: number) {
  return (
    lat >= MAGNESIA_BOUNDS.minLat &&
    lat <= MAGNESIA_BOUNDS.maxLat &&
    lon >= MAGNESIA_BOUNDS.minLon &&
    lon <= MAGNESIA_BOUNDS.maxLon
  );
}
// Helper to prettify attribute names
const prettifyKey = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Recursive attribute renderer
const renderAttributes = (attributes: any, indent: number = 0) => {
  if (!attributes) return null;
  return Object.entries(attributes).map(([key, value]) => {
    if (key === 'is_dog') return null;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Remove bold for color_markings and facial_features, fix indentation
      const isSpecial = key === 'color_markings' || key === 'facial_features';
      return (
        <View key={key} style={{ marginLeft: indent, marginBottom: 2 }}>
          <Text style={{ textAlign: 'left', marginLeft: 0 }}>{prettifyKey(key)}:</Text>
          {renderAttributes(value, indent + 16)}
        </View>
      );
    }
    return (
      <Text key={key} style={{ textAlign: 'left', marginLeft: indent }}>{prettifyKey(key)}: {String(value)}</Text>
    );
  });
};
import { StyleSheet, Text, View, Modal, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Cloud Run backend URL
const API_URL = 'https://stray-dog-mapper-266065529222.europe-west1.run.app';


interface Dog {
  id: string | number;
  location: {
    latitude: number;
    longitude: number;
  };
  image_url: string;
  timestamp: string;
  attributes?: { [key: string]: any };
  [key: string]: any; // allow extra fields
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
  // New state for up to 3 photos
  const [photos, setPhotos] = useState<any[]>([]);
  // Restriction state
  const [regionSupported, setRegionSupported] = useState<boolean | null>(null);

  useEffect(() => {
    getLocation();
  }, []);

  // Add a photo (up to 3)
  const addPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Limit reached', 'You can only add up to 3 photos.');
      return;
    }
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
      setPhotos([...photos, result.assets[0]]);
    }
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Upload all photos
  const uploadPhotos = async () => {
    try {
      if (!location) {
        Alert.alert('Error', 'Location not available. Please try again.');
        return;
      }
      if (photos.length === 0) {
        Alert.alert('Error', 'Please add at least one photo.');
        return;
      }
      setUploading(true);
      const formData = new FormData();
      photos.forEach((photo, idx) => {
        formData.append(`file${idx + 1}`, {
          uri: photo.uri,
          name: `dog${idx + 1}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
      formData.append('location', JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
      formData.append('timestamp', new Date().toISOString());
      await axios.post(`${API_URL}/dogs_sightings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploading(false);
      setPhotos([]);
      fetchDogs();
      Alert.alert('Success', 'Dog sighting submitted!');
    } catch (e) {
      setUploading(false);
      Alert.alert('Error', 'Failed to submit dog sighting.');
      console.error(e);
    }
  };

  const fetchDogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/dogs_sightings`);
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
        setRegionSupported(false);
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
      // Check if in Magnesia
      const inMagnesia = isInMagnesia(location.coords.latitude, location.coords.longitude);
      setRegionSupported(inMagnesia);
      if (inMagnesia) {
        fetchDogs();
      } else {
        setErrorMsg('Unfortunately, Stray Dog Mapper is not supported in this region');
        // Optionally: send location to backend here (see next step)
      }
    } catch (error) {
      setErrorMsg('Error getting location');
      setRegionSupported(false);
      console.error(error);
    }
  };


  const handleMarkerPress = (dog: Dog) => {
    setSelectedDog(dog);
    setModalVisible(true);
  };

  // If regionSupported is false, show error and block app UI
  if (regionSupported === false) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: 'red', fontSize: 18, textAlign: 'center', margin: 24 }}>
          Unfortunately, Stray Dog Mapper is not supported in this region
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title at the top */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Stray Dog Mapper</Text>
        <TouchableOpacity style={styles.photoButton} onPress={addPhoto} disabled={uploading || photos.length >= 3}>
          <Ionicons name="camera" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {/* Show selected photos and upload button */}
      <View style={styles.photosContainer}>
        {photos.map((photo, idx) => (
          <View key={idx} style={styles.photoThumbWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
            <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(idx)}>
              <Ionicons name="close-circle" size={24} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length > 0 && (
          <TouchableOpacity style={styles.uploadBtn} onPress={uploadPhotos} disabled={uploading}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Upload</Text>
          </TouchableOpacity>
        )}
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
                <Text style={styles.modalTitle}>{selectedDog.attributes?.breed || selectedDog.breed || 'Unknown Breed'}</Text>
                <Image source={{ uri: selectedDog.image_url }} style={styles.dogImage} />
                {/* Render all attributes if present, prettified and nested */}
                {selectedDog.attributes && Object.keys(selectedDog.attributes).length > 0 && (
                  <View style={{ marginBottom: 8, width: '100%' }}>
                    {renderAttributes(selectedDog.attributes)}
                  </View>
                )}
                {/* Fallback for common fields if not in attributes */}
                {!selectedDog.attributes?.size && (
                  <Text>Size: {selectedDog.size || 'Unknown'}</Text>
                )}
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
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    minHeight: 60,
  },
  photoThumbWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  uploadBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
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