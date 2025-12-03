import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { saveDatabaseChoice, checkMongoConnection, initSQLiteDatabase } from '../services/databaseService';

export default function DatabaseSelectionScreen({ navigation }) {
  const [mongoAvailable, setMongoAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabases();
  }, []);

  const checkDatabases = async () => {
    setLoading(true);
    await initSQLiteDatabase();
    const mongoStatus = await checkMongoConnection();
    setMongoAvailable(mongoStatus);
    setLoading(false);
  };

  const handleDatabaseChoice = async (choice) => {
    await saveDatabaseChoice(choice);
    
    if (choice === 'mongodb' && !mongoAvailable) {
      Alert.alert(
        'Sem Conexão',
        'MongoDB não está disponível. Usando SQLite como backup.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await saveDatabaseChoice('sqlite');
              navigation.replace('Crud');
            }
          }
        ]
      );
    } else {
      navigation.replace('Crud');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Escolha o Banco de Dados</Text>
      <Text style={styles.subtitle}>Selecione qual banco deseja usar</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.mongoButton,
            !mongoAvailable && styles.buttonDisabled
          ]}
          onPress={() => handleDatabaseChoice('mongodb')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>MongoDB Atlas</Text>
          <Text style={styles.buttonSubtext}>
            {mongoAvailable ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.sqliteButton]}
          onPress={() => handleDatabaseChoice('sqlite')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>SQLite (Local)</Text>
          <Text style={styles.buttonSubtext}>Sempre Disponível</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.info}>
        Caso não tenha internet, o SQLite funciona como backup, mas os dados não serão sincronizados com o MongoDB.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mongoButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#6200ee',
  },
  sqliteButton: {
    borderLeftWidth: 5,
    borderLeftColor: '#00c853',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  info: {
    marginTop: 30,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

