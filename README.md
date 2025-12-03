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

- Tela de Splash
- Escolha de banco de dados (MongoDB ou SQLite)
- CRUD completo
- Sincronização entre bancos
- SQLite como backup offline

