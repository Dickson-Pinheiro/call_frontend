# RandomCall - Frontend

Aplicação de chamadas de vídeo aleatórias estilo Omegle, desenvolvida com React, TypeScript, TanStack Router e WebRTC.

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **TanStack Router** - Roteamento com type-safety
- **TanStack Query** - Gerenciamento de estado do servidor
- **WebRTC** - Comunicação peer-to-peer de vídeo/áudio
- **WebSocket (STOMP)** - Sinalização em tempo real
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as URLs corretas:

```env
# URL base da API REST
VITE_API_BASE_URL=https://call-backend.fly.dev

# URL do WebSocket
VITE_WS_URL=https://call-backend.fly.dev/ws
```

**Para desenvolvimento local:**
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

### 2. Instalação

```bash
npm install
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### 4. Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`

## 🎮 Funcionalidades

- ✅ Sistema de autenticação (Login/Registro)
- ✅ Matchmaking aleatório via WebSocket
- ✅ Chamadas de vídeo P2P com WebRTC
- ✅ Chat em tempo real durante chamadas
- ✅ Controles de câmera e microfone
- ✅ Função "Skip" para próxima pessoa
- ✅ Histórico de chamadas
- ✅ Dashboard com estatísticas

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes React reutilizáveis
│   └── ui/           # Componentes de UI (Radix + Shadcn)
├── contexts/         # Contextos React (CallContext)
├── hooks/            # Custom hooks
├── routes/           # Páginas e rotas (TanStack Router)
│   ├── __root.tsx
│   ├── index.tsx     # Landing page
│   ├── login.tsx
│   ├── register.tsx
│   └── app/          # Rotas protegidas
│       ├── dashboard.tsx
│       ├── call.tsx
│       └── history.tsx
├── services/         # Serviços e API
│   ├── api.ts        # Cliente Axios
│   ├── authService.ts
│   ├── callService.ts
│   ├── websocketService.ts
│   ├── hooks/        # React Query hooks
│   └── types/        # TypeScript types
└── lib/              # Utilitários
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens):

1. Login/Registro retorna um token
2. Token é armazenado no `localStorage`
3. Todas as requisições incluem o token no header `Authorization: Bearer {token}`
4. WebSocket também usa o token para autenticação

## 🌐 WebRTC + WebSocket

### Fluxo de Chamada:

1. **Dashboard**: Usuário clica em "Iniciar chamada"
2. **WebSocket**: Conecta e entra na fila (`/app/join-queue`)
3. **Match**: Backend encontra par e envia `onMatchFound`
4. **WebRTC**: Inicia câmera/mic e estabelece PeerConnection
5. **Sinalização**: Offer/Answer/ICE candidates trocados via WebSocket
6. **Conectado**: Vídeos aparecem, chamada ativa

### Eventos WebSocket:

- `/user/queue/match-found` - Par encontrado
- `/user/queue/webrtc-signal` - Sinais WebRTC
- `/user/queue/chat` - Mensagens de chat
- `/user/queue/call-ended` - Chamada encerrada

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Lint com ESLint
```

## 📝 Documentação Adicional

- [WEBRTC_IMPLEMENTATION.md](./WEBRTC_IMPLEMENTATION.md) - Detalhes da implementação WebRTC
- [WEBSOCKET_MANUAL.md](./WEBSOCKET_MANUAL.md) - Manual do WebSocket
- [API_REST_MANUAL.md](./API_REST_MANUAL.md) - Documentação da API REST

## 🐛 Troubleshooting

### Erro: "getUserMedia is undefined"

- Certifique-se de acessar via `http://localhost` ou `https://`
- Verifique as permissões de câmera/microfone no navegador

### Erro 403 no WebSocket

- Verifique se o backend permite acesso ao `/ws/**`
- Confirme que o token JWT está válido

### Vídeo não aparece

- Verifique se outro aplicativo está usando a câmera
- Teste em outro navegador
- Verifique o console para erros WebRTC

## 📄 Licença

Este projeto é parte de um trabalho acadêmico.

---

React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
