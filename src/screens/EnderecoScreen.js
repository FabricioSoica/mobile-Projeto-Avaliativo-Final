import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput, Button, Card, Title, Paragraph, FAB } from 'react-native-paper';
import axios from 'axios';
import {
  createEndereco,
  readEnderecos,
  updateEndereco,
  deleteEndereco,
} from '../services/databaseService';

export default function EnderecoScreen({ navigation }) {
  const [enderecos, setEnderecos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState(null);
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [numero, setNumero] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    loadEnderecos();
  }, []);

  const loadEnderecos = async () => {
    setLoading(true);
    try {
      const data = await readEnderecos();
      setEnderecos(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os endereços: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = async (cepValue) => {
    const cepLimpo = cepValue.replace(/\D/g, '');
    if (cepLimpo.length === 8 && !loadingCep) {
      setLoadingCep(true);
      const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.erro) {
          Alert.alert('Erro', 'CEP não encontrado');
        } else {
          setRua(data.logradouro || '');
          setBairro(data.bairro || '');
          setEstado(data.uf || '');
        }
      } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('Network request failed')) {
          Alert.alert(
            'Aviso', 
            'Não foi possível buscar o CEP automaticamente. Você pode preencher os campos manualmente.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Erro', 'Erro ao buscar CEP. Verifique sua conexão com a internet.');
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleCepChange = (text) => {
    const cepLimpo = text.replace(/\D/g, '');
    
    if (cepLimpo.length < 8) {
      setRua('');
      setBairro('');
      setEstado('');
    }
    
    setCep(cepLimpo);
    
    if (cepLimpo.length === 8 && !loadingCep) {
      buscarCep(cepLimpo);
    }
  };

  const handleSave = async () => {
    if (!cep || !rua || !bairro || !numero) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingEndereco) {
        await updateEndereco(editingEndereco._id, { cep, rua, bairro, numero, estado });
        Alert.alert('Sucesso', 'Endereço atualizado com sucesso!');
      } else {
        await createEndereco({ cep, rua, bairro, numero, estado });
        Alert.alert('Sucesso', 'Endereço criado com sucesso!');
      }
      resetForm();
      setModalVisible(false);
      loadEnderecos();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  const handleEdit = (endereco) => {
    setEditingEndereco(endereco);
    setCep(endereco.cep);
    setRua(endereco.rua);
    setBairro(endereco.bairro);
    setNumero(endereco.numero);
    setEstado(endereco.estado || '');
    setModalVisible(true);
  };

  const handleDelete = (endereco) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o endereço de ${endereco.rua}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEndereco(endereco._id);
              Alert.alert('Sucesso', 'Endereço excluído com sucesso!');
              loadEnderecos();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingEndereco(null);
    setCep('');
    setRua('');
    setBairro('');
    setNumero('');
    setEstado('');
    setLoadingCep(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const closeModal = () => {
    resetForm();
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
        <StatusBar style="auto" />
        
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Endereços</Title>
        </View>

        <ScrollView style={styles.list}>
          {enderecos.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>Nenhum endereço cadastrado</Paragraph>
              </Card.Content>
            </Card>
          ) : (
            enderecos.map((endereco) => (
              <Card key={endereco._id} style={styles.card} onPress={() => handleEdit(endereco)}>
                <Card.Content>
                  <Title>{endereco.rua}, {endereco.numero}</Title>
                  <Paragraph>CEP: {endereco.cep}</Paragraph>
                  <Paragraph>Bairro: {endereco.bairro}</Paragraph>
                  {endereco.estado && <Paragraph>Estado: {endereco.estado}</Paragraph>}
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => handleEdit(endereco)}>Editar</Button>
                  <Button onPress={() => handleDelete(endereco)} textColor="white">Excluir</Button>
                </Card.Actions>
              </Card>
            ))
          )}
        </ScrollView>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={openCreateModal}
        />

        {modalVisible && (
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <Card style={styles.modalCard}>
              <Card.Content>
                <Title>{editingEndereco ? 'Editar Endereço' : 'Novo Endereço'}</Title>
                
                <View>
                  <TextInput
                    label="CEP *"
                    value={cep}
                    onChangeText={handleCepChange}
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={8}
                    style={styles.input}
                    disabled={loadingCep}
                  />
                  {loadingCep && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#6200ee" />
                      <Paragraph style={styles.loadingText}>Buscando endereço...</Paragraph>
                    </View>
                  )}
                </View>

                <TextInput
                  label="Rua *"
                  value={rua}
                  onChangeText={setRua}
                  mode="outlined"
                  style={styles.input}
                  editable={true}
                />

                <TextInput
                  label="Bairro *"
                  value={bairro}
                  onChangeText={setBairro}
                  mode="outlined"
                  style={styles.input}
                  editable={true}
                />

                <TextInput
                  label="Número *"
                  value={numero}
                  onChangeText={setNumero}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  editable={true}
                />

                <TextInput
                  label="Estado"
                  value={estado}
                  onChangeText={setEstado}
                  mode="outlined"
                  style={styles.input}
                  editable={true}
                />

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      resetForm();
                      setModalVisible(false);
                    }}
                    style={styles.button}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.button}
                  >
                    Salvar
                  </Button>
                </View>
              </Card.Content>
                </Card>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
  },
  list: {
    flex: 1,
    padding: 15,
  },
  card: {
    marginBottom: 15,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#6200ee',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  button: {
    marginLeft: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 5,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6200ee',
  },
});

