import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

// Use tunnel URL for development when running in Expo Go
const API_URL = __DEV__ ? 'https://YOUR_TUNNEL_URL.ngrok-free.app' : 'http://192.168.1.255:8000';

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
  const [form, setForm] = useState({ breed: '', age: '', size: '', latitude: '', longitude: '' });
  const [region, setRegion] = useState({
    latitude: 39.3626,
    longitude: 22.9465,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  useEffect(() => {
    fetchDogs();
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

  const submitDog = async () => {
    try {
      await axios.post(`${API_URL}/add_dog`, {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setForm({ breed: '', age: '', size: '', latitude: '', longitude: '' });
      fetchDogs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Stray Dog Mapper</Text>
      <TextInput style={styles.input} placeholder="Breed" value={form.breed} onChangeText={t => setForm(f => ({ ...f, breed: t }))} />
      <TextInput style={styles.input} placeholder="Age" value={form.age} onChangeText={t => setForm(f => ({ ...f, age: t }))} />
      <TextInput style={styles.input} placeholder="Size" value={form.size} onChangeText={t => setForm(f => ({ ...f, size: t }))} />
      <TextInput style={styles.input} placeholder="Latitude" value={form.latitude} onChangeText={t => setForm(f => ({ ...f, latitude: t }))} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Longitude" value={form.longitude} onChangeText={t => setForm(f => ({ ...f, longitude: t }))} keyboardType="numeric" />
      <Button title="Submit" onPress={submitDog} />
      <MapView style={styles.map} region={region} onRegionChange={setRegion}>
        {dogs.map((dog, idx) => (
          <Marker
            key={dog.id || idx}
            coordinate={{ latitude: dog.latitude, longitude: dog.longitude }}
            title={dog.breed || 'Unknown'}
            description={`Age: ${dog.age || 'Unknown'}, Size: ${dog.size || 'Unknown'}`}
          />
        ))}
      </MapView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 },
  map: { width: '100%', height: 300, marginTop: 16 },
});
