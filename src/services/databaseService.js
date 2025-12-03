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
        },
        (_, error) => {
          console.error('Erro ao criar tabela SQLite:', error);
        }
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS enderecos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cep TEXT NOT NULL,
          rua TEXT NOT NULL,
          bairro TEXT NOT NULL,
          numero TEXT NOT NULL,
          estado TEXT,
          dataCriacao TEXT
        );`,
        [],
        () => {
          console.log('Tabela enderecos SQLite criada com sucesso');
          resolve();
        },
        (_, error) => {
          console.error('Erro ao criar tabela enderecos SQLite:', error);
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

    const sqliteEnderecos = await sqliteReadEnderecos();
    const mongoEnderecos = await mongoReadEnderecos();

    let addedEnderecosToMongo = 0;
    let addedEnderecosToSQLite = 0;

    const mongoEnderecoMap = new Map();
    mongoEnderecos.forEach(endereco => {
      const key = `${endereco.cep}_${endereco.rua}_${endereco.numero}`.toLowerCase();
      mongoEnderecoMap.set(key, endereco);
    });

    const sqliteEnderecoMap = new Map();
    sqliteEnderecos.forEach(endereco => {
      const key = `${endereco.cep}_${endereco.rua}_${endereco.numero}`.toLowerCase();
      sqliteEnderecoMap.set(key, endereco);
    });

    for (const sqliteEndereco of sqliteEnderecos) {
      const key = `${sqliteEndereco.cep}_${sqliteEndereco.rua}_${sqliteEndereco.numero}`.toLowerCase();
      if (!mongoEnderecoMap.has(key)) {
        try {
          await mongoCreateEndereco({
            cep: sqliteEndereco.cep,
            rua: sqliteEndereco.rua,
            bairro: sqliteEndereco.bairro,
            numero: sqliteEndereco.numero,
            estado: sqliteEndereco.estado || ''
          });
          addedEnderecosToMongo++;
        } catch (error) {
          console.error('Erro ao adicionar endereço no MongoDB:', error);
        }
      }
    }

    for (const mongoEndereco of mongoEnderecos) {
      const key = `${mongoEndereco.cep}_${mongoEndereco.rua}_${mongoEndereco.numero}`.toLowerCase();
      if (!sqliteEnderecoMap.has(key)) {
        try {
          await sqliteCreateEndereco({
            cep: mongoEndereco.cep,
            rua: mongoEndereco.rua,
            bairro: mongoEndereco.bairro,
            numero: mongoEndereco.numero,
            estado: mongoEndereco.estado || ''
          });
          addedEnderecosToSQLite++;
        } catch (error) {
          console.error('Erro ao adicionar endereço no SQLite:', error);
        }
      }
    }

    return {
      success: true,
      addedToMongo,
      addedToSQLite,
      addedEnderecosToMongo,
      addedEnderecosToSQLite,
      message: `Sincronização concluída! ${addedToMongo} item(s) e ${addedEnderecosToMongo} endereço(s) adicionado(s) ao MongoDB. ${addedToSQLite} item(s) e ${addedEnderecosToSQLite} endereço(s) adicionado(s) ao SQLite.`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const mongoCreateEndereco = async (endereco) => {
  try {
    const response = await axios.post(`${API_URL}/enderecos`, endereco);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao criar endereço no MongoDB: ' + error.message);
  }
};

const mongoReadEnderecos = async () => {
  try {
    const response = await axios.get(`${API_URL}/enderecos`);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao ler endereços do MongoDB: ' + error.message);
  }
};

const mongoUpdateEndereco = async (id, endereco) => {
  try {
    const response = await axios.put(`${API_URL}/enderecos/${id}`, endereco);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao atualizar endereço no MongoDB: ' + error.message);
  }
};

const mongoDeleteEndereco = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/enderecos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Erro ao deletar endereço do MongoDB: ' + error.message);
  }
};

const sqliteCreateEndereco = (endereco) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO enderecos (cep, rua, bairro, numero, estado, dataCriacao) VALUES (?, ?, ?, ?, ?, ?);',
        [endereco.cep, endereco.rua, endereco.bairro, endereco.numero, endereco.estado || '', new Date().toISOString()],
        (_, result) => {
          resolve({ ...endereco, id: result.insertId.toString() });
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

const sqliteReadEnderecos = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM enderecos ORDER BY dataCriacao DESC;',
        [],
        (_, { rows }) => {
          const enderecos = [];
          for (let i = 0; i < rows.length; i++) {
            enderecos.push({
              _id: rows.item(i).id.toString(),
              cep: rows.item(i).cep,
              rua: rows.item(i).rua,
              bairro: rows.item(i).bairro,
              numero: rows.item(i).numero,
              estado: rows.item(i).estado,
              dataCriacao: rows.item(i).dataCriacao
            });
          }
          resolve(enderecos);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

const sqliteUpdateEndereco = (id, endereco) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE enderecos SET cep = ?, rua = ?, bairro = ?, numero = ?, estado = ? WHERE id = ?;',
        [endereco.cep, endereco.rua, endereco.bairro, endereco.numero, endereco.estado || '', id],
        (_, result) => {
          resolve({ ...endereco, _id: id });
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

const sqliteDeleteEndereco = (id) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM enderecos WHERE id = ?;',
        [id],
        (_, result) => {
          resolve({ message: 'Endereço deletado com sucesso' });
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const createEndereco = async (endereco) => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoCreateEndereco(endereco);
  } else {
    return await sqliteCreateEndereco(endereco);
  }
};

export const readEnderecos = async () => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoReadEnderecos();
  } else {
    return await sqliteReadEnderecos();
  }
};

export const updateEndereco = async (id, endereco) => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoUpdateEndereco(id, endereco);
  } else {
    return await sqliteUpdateEndereco(id, endereco);
  }
};

export const deleteEndereco = async (id) => {
  const choice = await getDatabaseChoice();
  if (choice === 'mongodb') {
    return await mongoDeleteEndereco(id);
  } else {
    return await sqliteDeleteEndereco(id);
  }
};

