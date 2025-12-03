import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  createItem,
  readItems,
  updateItem,
  deleteItem,
  getDatabaseChoice,
  clearDatabaseChoice,
  syncDatabases,
} from '../services/databaseService';

export default function CrudScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [databaseChoice, setDatabaseChoice] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadDatabaseChoice();
    loadItems();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleBackPress = async () => {
    await clearDatabaseChoice();
    navigation.replace('DatabaseSelection');
  };

  const loadDatabaseChoice = async () => {
    const choice = await getDatabaseChoice();
    setDatabaseChoice(choice);
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await readItems();
      setItems(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os itens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }

    try {
      if (editingItem) {
        await updateItem(editingItem._id, { nome, descricao });
        Alert.alert('Sucesso', 'Item atualizado com sucesso!');
      } else {
        await createItem({ nome, descricao });
        Alert.alert('Sucesso', 'Item criado com sucesso!');
      }
      setModalVisible(false);
      resetForm();
      loadItems();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNome(item.nome);
    setDescricao(item.descricao || '');
    setModalVisible(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir "${item.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item._id);
              Alert.alert('Sucesso', 'Item excluído com sucesso!');
              loadItems();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingItem(null);
    setNome('');
    setDescricao('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Trocar Banco de Dados',
      'Deseja voltar à tela de seleção de banco de dados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            await clearDatabaseChoice();
            navigation.replace('DatabaseSelection');
          },
        },
      ]
    );
  };

  const handleSync = () => {
    Alert.alert(
      'Sincronizar Bancos de Dados',
      'Isso irá sincronizar os dados entre MongoDB e SQLite. Itens que existem em um banco mas não no outro serão copiados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            setSyncing(true);
            try {
              const result = await syncDatabases();
              setSyncing(false);
              
              if (result.success) {
                Alert.alert('Sucesso', result.message, [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadItems();
                    }
                  }
                ]);
              } else {
                Alert.alert('Erro na Sincronização', result.error);
              }
            } catch (error) {
              setSyncing(false);
              Alert.alert('Erro', 'Erro ao sincronizar: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        {item.descricao && (
          <Text style={styles.itemDescricao}>{item.descricao}</Text>
        )}
        <Text style={styles.itemDate}>
          {new Date(item.dataCriacao).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>CRUD de Itens</Text>
            <View style={styles.databaseBadge}>
              <Text style={styles.databaseBadgeText}>
                {databaseChoice === 'mongodb' ? '☁️ MongoDB Atlas' : '📱 SQLite Local'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('Endereco')}
          >
            <Text style={styles.headerActionButtonText}>Endereços</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleSync}
            disabled={syncing}
          >
            <Text style={styles.headerActionButtonText}>
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadItems} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum item cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Toque no botão + para adicionar um novo item
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome *"
              value={nome}
              onChangeText={setNome}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 20,
  },
  headerTop: {
    marginBottom: 15,
  },
  headerTextContainer: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  databaseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  databaseBadgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 50,
  },
  headerActionButtonText: {
    color: '#6200ee',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  list: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    marginBottom: 10,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemDescricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

