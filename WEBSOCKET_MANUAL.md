# 🌐 Manual de Uso do WebSocket - Sistema de Chamadas Omegle

## 📋 Visão Geral

Este sistema implementa chamadas de vídeo aleatórias estilo **Omegle** com WebRTC e WebSocket (STOMP).

### **Características:**
- ✅ Pareamento aleatório 1-to-1
- ✅ Chat em tempo real durante a chamada
- ✅ WebRTC para vídeo/áudio P2P
- ✅ Função "Skip" para trocar de pessoa
- ✅ Autenticação JWT obrigatória
- ✅ Cada chamada tem seu próprio chat

---

## 🔌 Conexão WebSocket

### **Endpoint:**
```
ws://localhost:8080/ws
```

### **Bibliotecas Necessárias (JavaScript):**
```bash
npm install sockjs-client stompjs
```

### **Código de Conexão:**

```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// 1. Obter token JWT do login
const token = localStorage.getItem('jwt_token');

// 2. Criar conexão SockJS
const socket = new SockJS('http://localhost:8080/ws');

// 3. Criar cliente STOMP
const stompClient = Stomp.over(socket);

// 4. Conectar com autenticação JWT
stompClient.connect(
  {
    'Authorization': `Bearer ${token}`
  },
  (frame) => {
    console.log('Conectado:', frame);
    
    // 5. Subscrever aos tópicos
    subscribeToTopics();
  },
  (error) => {
    console.error('Erro de conexão:', error);
  }
);
```

---

## 📡 Eventos e Tópicos

### **1. Entrar na Fila de Pareamento**

**Enviar:**
```javascript
stompClient.send('/app/join-queue', {}, {});
```

**Receber confirmação:**
```javascript
stompClient.subscribe('/user/queue/status', (message) => {
  const data = JSON.parse(message.body);
  console.log(data.message); // "Procurando alguém para conversar..."
});
```

---

### **2. Pareamento Encontrado**

**Receber:**
```javascript
stompClient.subscribe('/user/queue/match-found', (message) => {
  const match = JSON.parse(message.body);
  
  console.log('Pareamento encontrado!');
  console.log('Call ID:', match.callId);
  console.log('Peer ID:', match.peerId);
  console.log('Peer Name:', match.peerName);
  
  // Iniciar WebRTC
  startWebRTCConnection(match.callId, match.peerId);
});
```

---

### **3. Sinais WebRTC (Offer, Answer, ICE)**

#### **Enviar Offer:**
```javascript
async function sendOffer(callId, peerId, offer) {
  stompClient.send('/app/webrtc-signal', {}, JSON.stringify({
    type: 'offer',
    callId: callId,
    targetUserId: peerId,
    data: offer
  }));
}
```

#### **Enviar Answer:**
```javascript
async function sendAnswer(callId, peerId, answer) {
  stompClient.send('/app/webrtc-signal', {}, JSON.stringify({
    type: 'answer',
    callId: callId,
    targetUserId: peerId,
    data: answer
  }));
}
```

#### **Enviar ICE Candidate:**
```javascript
function sendIceCandidate(callId, peerId, candidate) {
  stompClient.send('/app/webrtc-signal', {}, JSON.stringify({
    type: 'ice-candidate',
    callId: callId,
    targetUserId: peerId,
    data: candidate
  }));
}
```

#### **Receber Sinais:**
```javascript
stompClient.subscribe('/user/queue/webrtc-signal', (message) => {
  const signal = JSON.parse(message.body);
  
  if (signal.type === 'offer') {
    handleOffer(signal.data, signal.senderId);
  } else if (signal.type === 'answer') {
    handleAnswer(signal.data);
  } else if (signal.type === 'ice-candidate') {
    handleIceCandidate(signal.data);
  }
});
```

---

### **4. Chat em Tempo Real**

#### **Enviar Mensagem:**
```javascript
function sendChatMessage(callId, message) {
  stompClient.send('/app/chat-message', {}, JSON.stringify({
    callId: callId,
    message: message
  }));
}
```

#### **Receber Mensagens:**
```javascript
stompClient.subscribe('/user/queue/chat', (message) => {
  const chatMsg = JSON.parse(message.body);
  
  displayMessage({
    id: chatMsg.id,
    sender: chatMsg.senderName,
    text: chatMsg.message,
    time: chatMsg.sentAt
  });
});
```

#### **Indicador de Digitação:**
```javascript
// Enviar "está digitando"
function sendTypingIndicator(callId) {
  stompClient.send('/app/typing', {}, JSON.stringify({
    callId: callId
  }));
}

// Receber "está digitando"
stompClient.subscribe('/user/queue/typing', (message) => {
  const data = JSON.parse(message.body);
  showTypingIndicator(data.isTyping);
});
```

---

### **5. Trocar de Pessoa (Skip)**

**Enviar:**
```javascript
function nextPerson() {
  stompClient.send('/app/next-person', {}, {});
  
  // Vai automaticamente:
  // 1. Encerrar chamada atual
  // 2. Voltar para a fila
  // 3. Parear com nova pessoa
}
```

---

### **6. Encerrar Chamada**

**Enviar:**
```javascript
function endCall(callId) {
  stompClient.send('/app/end-call', {}, JSON.stringify({
    callId: callId
  }));
}
```

**Receber notificação:**
```javascript
stompClient.subscribe('/user/queue/call-ended', (message) => {
  const data = JSON.parse(message.body);
  console.log('Chamada encerrada:', data.callId);
  
  // Limpar WebRTC
  closePeerConnection();
  
  // Voltar para tela inicial
  resetUI();
});
```

---

### **7. Sair da Fila**

**Enviar:**
```javascript
function leaveQueue() {
  stompClient.send('/app/leave-queue', {}, {});
}
```

---

### **8. Erros**

**Receber:**
```javascript
stompClient.subscribe('/user/queue/error', (message) => {
  const error = JSON.parse(message.body);
  console.error('Erro:', error.error);
  alert(error.error);
});
```

---

## 🎥 Exemplo Completo de WebRTC

```javascript
let peerConnection;
let localStream;
let currentCallId;
let currentPeerId;

// Configuração ICE (STUN servers)
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Iniciar WebRTC
async function startWebRTCConnection(callId, peerId) {
  currentCallId = callId;
  currentPeerId = peerId;
  
  // Obter mídia local
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  
  document.getElementById('localVideo').srcObject = localStream;
  
  // Criar peer connection
  peerConnection = new RTCPeerConnection(rtcConfig);
  
  // Adicionar tracks locais
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
  
  // Receber track remoto
  peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };
  
  // ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendIceCandidate(callId, peerId, event.candidate);
    }
  };
  
  // Criar e enviar offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  sendOffer(callId, peerId, offer);
}

// Receber offer
async function handleOffer(offer, senderId) {
  if (!peerConnection) {
    await startWebRTCConnection(currentCallId, senderId);
  }
  
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  sendAnswer(currentCallId, senderId, answer);
}

// Receber answer
async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Receber ICE candidate
async function handleIceCandidate(candidate) {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Fechar conexão
function closePeerConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
}
```

---

## 🔄 Fluxo Completo (Omegle)

```
┌─────────────┐                                    ┌─────────────┐
│  Usuário A  │                                    │  Usuário B  │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │ 1. Login (REST)                                 │
       ├──────────────────────────────────────────────►  │
       │    JWT Token                                    │
       │                                                  │
       │ 2. Conectar WebSocket                           │
       │    (com token JWT)                              │
       ├─────────────────────┐   ┌──────────────────────┤
       │                     │   │                      │
       │ 3. /app/join-queue  │   │  3. /app/join-queue  │
       ├─────────────────────┘   └──────────────────────┤
       │                                                  │
       │◄─────────────────────────────────────────────────┤
       │         /user/queue/match-found                 │
       │         { callId, peerId, peerName }            │
       │                                                  │
       │ 4. WebRTC Signaling                             │
       │────────────────────────────────────────────────►│
       │         Offer, Answer, ICE Candidates           │
       │◄────────────────────────────────────────────────┤
       │                                                  │
       │ 5. Conexão P2P estabelecida                     │
       │═════════════════════════════════════════════════│
       │         Vídeo/Áudio direto entre peers          │
       │                                                  │
       │ 6. Chat                                          │
       │────────────────────────────────────────────────►│
       │         /app/chat-message                       │
       │◄────────────────────────────────────────────────┤
       │         /user/queue/chat                        │
       │                                                  │
       │ 7. Skip (/app/next-person)                      │
       ├─────────────────────┐                           │
       │                     │                           │
       │◄────────────────────┘                           │
       │    /user/queue/call-ended                       │
       │────────────────────────────────────────────────►│
       │                                                  │
       │ 8. Novo pareamento                              │
       └──────────────────────────────────────────────────┘
```

---

## 🚨 Tratamento de Erros

### **Possíveis Erros:**

1. **"Token JWT inválido"** - Token expirado ou malformado
2. **"Usuário já está em uma chamada"** - Tentar entrar na fila estando em call
3. **"Chamada não encontrada"** - CallId inválido
4. **"Usuário não encontrado"** - UserId inválido

### **Exemplo de Tratamento:**
```javascript
stompClient.subscribe('/user/queue/error', (message) => {
  const error = JSON.parse(message.body);
  
  switch(error.error) {
    case 'Token JWT inválido':
      // Redirecionar para login
      window.location.href = '/login';
      break;
    case 'Usuário já está em uma chamada':
      alert('Você já está em uma chamada');
      break;
    default:
      console.error(error.error);
  }
});
```

---

## 📝 Checklist de Implementação

- [ ] Implementar autenticação JWT
- [ ] Conectar WebSocket com token
- [ ] Subscrever aos tópicos necessários
- [ ] Implementar WebRTC (offer/answer/ICE)
- [ ] Implementar chat em tempo real
- [ ] Implementar botão "Skip"
- [ ] Implementar botão "Encerrar chamada"
- [ ] Tratar desconexões
- [ ] Adicionar indicador de digitação
- [ ] Testar fluxo completo

---

## 🎯 Endpoints REST Relacionados

### **Autenticação:**
```bash
# Login
POST /api/auth/login
{
  "email": "usuario@email.com",
  "password": "senha123"
}

# Resposta:
{
  "token": "eyJhbGc...",
  "type": "Bearer",
  "userId": 1,
  "name": "João",
  "email": "usuario@email.com"
}
```

### **Histórico de Chamadas:**
```bash
GET /api/calls
Authorization: Bearer {token}
```

### **Mensagens de uma Chamada:**
```bash
GET /api/messages/call/{callId}
Authorization: Bearer {token}
```

---

## 🔧 Configuração CORS

O backend já está configurado para aceitar conexões de qualquer origem durante desenvolvimento:

```java
registry.addEndpoint("/ws")
    .setAllowedOriginPatterns("*")
    .withSockJS();
```

Para produção, configure origens específicas.

---

## 📚 Recursos Adicionais

- [STOMP Protocol](https://stomp.github.io/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [SockJS](https://github.com/sockjs/sockjs-client)

---

**Desenvolvido com Spring Boot + WebSocket + WebRTC** 🚀
