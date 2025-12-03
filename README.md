# Mobile - Projeto Avaliativo Final

App React Native com Expo implementando CRUD com MongoDB Atlas e SQLite.

## Instalação

```bash
npm install
```

## Configuração

Configure o IP do backend no arquivo `src/services/databaseService.js`:

- Emulador Android: `http://10.0.2.2:3000/api` (já configurado)
- Dispositivo físico: `http://SEU_IP_LOCAL:3000/api`

## Executar

```bash
npm start
```

## Funcionalidades

### Telas
- Tela de Splash (2 segundos)
- Tela de escolha de banco de dados (MongoDB ou SQLite)
- Tela CRUD de Itens
- Tela CRUD de Endereços

### CRUD de Itens
- Criar, listar, editar e deletar itens
- Pull-to-refresh para atualizar lista
- Interface moderna e responsiva

### CRUD de Endereços
- Cadastro de endereços (CEP, Rua, Bairro, Número, Estado)
- Busca automática de CEP via API ViaCEP
- Preenchimento automático de rua, bairro e estado ao digitar CEP
- Criar, listar, editar e deletar endereços
- Interface com React Native Paper

### Banco de Dados
- Escolha entre MongoDB Atlas (online) ou SQLite (local)
- Sincronização bidirecional entre MongoDB e SQLite
- SQLite como backup offline
- Botão para trocar de banco de dados
- Botão voltar retorna para seleção de banco

### Sincronização
- Sincroniza itens entre MongoDB e SQLite
- Sincroniza endereços entre MongoDB e SQLite
- Evita duplicatas na sincronização
- Feedback visual durante sincronização

