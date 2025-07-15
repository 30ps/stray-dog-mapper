import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Dimensions, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';

// Use tunnel URL for development when running in Expo Go
const API_URL = __DEV__ ? 'http://192.168.1.5:8000' : 'http://192.168.1.5:8000';

interface Dog {
  id: number;
  breed: string;
  age: string;
  size: string;
  latitude: number;
  longitude: number;
}

export default function App() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [form, setForm] = useState({ breed: '', age: '', size: '' });
  const [region, setRegion] = useState({
    latitude: 39.3626,
    longitude: 22.9465,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDogs();
    getLocation();
  }, []);

  const fetchDogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/get_dogs`);
      setDogs(res.data);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to fetch dogs:', error.message);
      } else {
        console.error('An unknown error occurred while fetching dogs');
      }
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

  const submitDog = async () => {
    try {
      if (!location) {
        Alert.alert('Error', 'Location not available. Please try again.');
        return;
      }
      
      await axios.post(`${API_URL}/add_dog`, {
        ...form,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setForm({ breed: '', age: '', size: '' });
      fetchDogs();
    } catch (e) {
      console.error(e);
    }
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
        {dogs.map((dog, idx) => (
          <Marker
            key={dog.id || idx}
            coordinate={{ latitude: dog.latitude, longitude: dog.longitude }}
            title={dog.breed || 'Unknown'}
            description={`Age: ${dog.age || 'Unknown'}, Size: ${dog.size || 'Unknown'}`}
          />
        ))}
      </MapView>
      <View style={styles.formContainer}>
        <Text style={styles.header}>Stray Dog Mapper</Text>
        <TextInput style={styles.input} placeholder="Breed" value={form.breed} onChangeText={t => setForm(f => ({ ...f, breed: t }))} />
        <TextInput style={styles.input} placeholder="Age" value={form.age} onChangeText={t => setForm(f => ({ ...f, age: t }))} />
        <TextInput style={styles.input} placeholder="Size" value={form.size} onChangeText={t => setForm(f => ({ ...f, size: t }))} />
        {errorMsg && <Text style={{ color: 'red' }}>{errorMsg}</Text>}
        <Button title="Submit" onPress={submitDog} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  formContainer: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 },
  map: { width: '100%', height: 400, marginTop: 16 },
});
