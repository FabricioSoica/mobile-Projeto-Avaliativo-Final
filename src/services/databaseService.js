import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000/api';
const DB_NAME = 'items.db';

const db = SQLite.openDatabase(DB_NAME);
export const initSQLiteDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          descricao TEXT,
          dataCriacao TEXT
        );`,
        [],
        () => {
          console.log('Tabela SQLite criada com sucesso');
          resolve();
        },
        (_, error) => {
          console.error('Erro ao criar tabela SQLite:', error);
          reject(error);
        }
      );
    });
  });
};

export const saveDatabaseChoice = async (choice) => {
  try {
    await AsyncStorage.setItem('databaseChoice', choice);
  } catch (error) {
    console.error('Erro ao salvar escolha do banco:', error);
  }
};

export const getDatabaseChoice = async () => {
  try {
    const choice = await AsyncStorage.getItem('databaseChoice');
    return choice || 'mongodb';
  } catch (error) {
    console.error('Erro ao obter escolha do banco:', error);
    return 'mongodb';
  }
};

export const clearDatabaseChoice = async () => {
  try {
    await AsyncStorage.removeItem('databaseChoice');
  } catch (error) {
    console.error('Erro ao limpar escolha do banco:', error);
  }
};

const mongoCreate = async (item) => {
  try {
    const response = await axios.post(`${API_URL}/items`, item);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao criar item no MongoDB: ' + error.message);
  }
};

const mongoRead = async () => {
  try {
    const response = await axios.get(`${API_URL}/items`);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao ler itens do MongoDB: ' + error.message);
  }
};

const mongoUpdate = async (id, item) => {
  try {
    const response = await axios.put(`${API_URL}/items/${id}`, item);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao atualizar item no MongoDB: ' + error.message);
  }
};

const mongoDelete = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/items/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao deletar item do MongoDB: ' + error.message);
  }
};

const sqliteCreate = (item) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO items (nome, descricao, dataCriacao) VALUES (?, ?, ?);',
        [item.nome, item.descricao || '', new Date().toISOString()],
        (_, result) => {
          resolve({ ...item, id: result.insertId.toString() });
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

const sqliteRead = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM items ORDER BY dataCriacao DESC;',
        [],
        (_, { rows }) => {
          const items = [];
          for (let i = 0; i < rows.length; i++) {
            items.push({
              _id: rows.item(i).id.toString(),
              nome: rows.item(i).nome,
              descricao: rows.item(i).descricao,
              dataCriacao: rows.item(i).dataCriacao
            });
          }
          resolve(items);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

const sqliteUpdate = (id, item) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE items SET nome = ?, descricao = ? WHERE id = ?;',
        [item.nome, item.descricao || '', id],
        (_, result) => {
          resolve({ ...item, _id: id });
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

const sqliteDelete = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM items WHERE id = ?;',
        [id],
        (_, result) => {
          resolve({ message: 'Item deletado com sucesso' });
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const createItem = async (item) => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoCreate(item);
  } else {
    return await sqliteCreate(item);
  }
};

export const readItems = async () => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoRead();
  } else {
    return await sqliteRead();
  }
};

export const updateItem = async (id, item) => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoUpdate(id, item);
  } else {
    return await sqliteUpdate(id, item);
  }
};

export const deleteItem = async (id) => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoDelete(id);
  } else {
    return await sqliteDelete(id);
  }
};

export const checkMongoConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/items`);
    return true;
  } catch (error) {
    return false;
  }
};

export const syncDatabases = async () => {
  try {
    const mongoAvailable = await checkMongoConnection();
    if (!mongoAvailable) {
      throw new Error('MongoDB não está disponível. Verifique sua conexão com a internet e o servidor backend.');
    }

    const sqliteItems = await sqliteRead();
    const mongoItems = await mongoRead();

    let addedToMongo = 0;
    let addedToSQLite = 0;

    const mongoMap = new Map();
    mongoItems.forEach(item => {
      const key = `${item.nome}_${item.descricao || ''}`.toLowerCase();
      mongoMap.set(key, item);
    });

    const sqliteMap = new Map();
    sqliteItems.forEach(item => {
      const key = `${item.nome}_${item.descricao || ''}`.toLowerCase();
      sqliteMap.set(key, item);
    });

    for (const sqliteItem of sqliteItems) {
      const key = `${sqliteItem.nome}_${sqliteItem.descricao || ''}`.toLowerCase();
      if (!mongoMap.has(key)) {
        try {
          await mongoCreate({
            nome: sqliteItem.nome,
            descricao: sqliteItem.descricao || ''
          });
          addedToMongo++;
        } catch (error) {
          console.error('Erro ao adicionar item no MongoDB:', error);
        }
      }
    }

    for (const mongoItem of mongoItems) {
      const key = `${mongoItem.nome}_${mongoItem.descricao || ''}`.toLowerCase();
      if (!sqliteMap.has(key)) {
        try {
          await sqliteCreate({
            nome: mongoItem.nome,
            descricao: mongoItem.descricao || ''
          });
          addedToSQLite++;
        } catch (error) {
          console.error('Erro ao adicionar item no SQLite:', error);
        }
      }
    }

    return {
      success: true,
      addedToMongo,
      addedToSQLite,
      message: `Sincronização concluída! ${addedToMongo} item(s) adicionado(s) ao MongoDB e ${addedToSQLite} item(s) adicionado(s) ao SQLite.`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

