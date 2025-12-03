import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('DatabaseSelection');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Projeto Avaliativo Final</Text>
      <Text style={styles.subtitle}>CRUD com MongoDB e SQLite</Text>
      <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6200ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

