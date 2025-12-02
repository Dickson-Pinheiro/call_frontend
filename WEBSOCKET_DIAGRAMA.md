# 🎯 Diagrama de Eventos WebSocket - Sistema Omegle

## 📊 Mapa Visual de Eventos

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTOS WEBSOCKET                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📤 ENVIAR (Cliente → Servidor)                                 │
│  ────────────────────────────────────────────────────────────   │
│  /app/join-queue        → Entrar na fila de pareamento          │
│  /app/leave-queue       → Sair da fila                          │
│  /app/next-person       → Skip (próxima pessoa)                 │
│  /app/end-call          → Encerrar chamada atual                │
│  /app/webrtc-signal     → Sinais WebRTC (offer/answer/ICE)      │
│  /app/chat-message      → Enviar mensagem no chat               │
│  /app/typing            → Indicador "está digitando"            │
│                                                                  │
│  📥 RECEBER (Servidor → Cliente)                                │
│  ────────────────────────────────────────────────────────────   │
│  /user/queue/status        → Status na fila                     │
│  /user/queue/match-found   → Pareamento encontrado              │
│  /user/queue/webrtc-signal → Sinais WebRTC do peer              │
│  /user/queue/chat          → Mensagens de chat                  │
│  /user/queue/typing        → Peer está digitando                │
│  /user/queue/call-ended    → Chamada encerrada                  │
│  /user/queue/error         → Erros                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Detalhado - Pareamento Omegle

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Cliente A│                    │ Servidor │                    │ Cliente B│
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. Conectar WebSocket         │                               │
     │   Authorization: Bearer {JWT} │                               │
     ├──────────────────────────────►│                               │
     │                               │                               │
     │                               │ Valida JWT                    │
     │                               │ Registra sessão               │
     │                               │                               │
     │ 2. /app/join-queue            │                               │
     ├──────────────────────────────►│                               │
     │                               │                               │
     │                               │ Adiciona na fila              │
     │                               │ waitingQueue.add(userA)       │
     │                               │                               │
     │ /user/queue/status            │                               │
     │◄──────────────────────────────┤                               │
     │ {status: "waiting"}           │                               │
     │                               │                               │
     │                               │         3. /app/join-queue    │
     │                               │◄──────────────────────────────┤
     │                               │                               │
     │                               │ waitingQueue.add(userB)       │
     │                               │ tryMatch() detecta 2 users    │
     │                               │                               │
     │                               │ Cria Call no banco            │
     │                               │ callTree.addCall(call)        │
     │                               │                               │
     │ /user/queue/match-found       │   /user/queue/match-found     │
     │◄──────────────────────────────┼──────────────────────────────►│
     │ {callId: 1,                   │   {callId: 1,                 │
     │  peerId: B,                   │    peerId: A,                 │
     │  peerName: "Bob"}             │    peerName: "Alice"}         │
     │                               │                               │
     │ 4. Criar RTCPeerConnection    │    Criar RTCPeerConnection    │
     │    getUserMedia()             │    getUserMedia()             │
     │                               │                               │
     │ 5. Criar Offer                │                               │
     │    pc.createOffer()           │                               │
     │                               │                               │
     │ /app/webrtc-signal            │                               │
     │ {type: "offer",               │                               │
     │  targetUserId: B,             │                               │
     │  data: {sdp...}}              │                               │
     ├──────────────────────────────►│                               │
     │                               │   /user/queue/webrtc-signal   │
     │                               ├──────────────────────────────►│
     │                               │   {type: "offer",             │
     │                               │    senderId: A,               │
     │                               │    data: {sdp...}}            │
     │                               │                               │
     │                               │    6. pc.setRemoteDescription()│
     │                               │       pc.createAnswer()       │
     │                               │                               │
     │                               │   /app/webrtc-signal          │
     │                               │   {type: "answer",            │
     │                               │    targetUserId: A,           │
     │                               │    data: {sdp...}}            │
     │                               │◄──────────────────────────────┤
     │ /user/queue/webrtc-signal     │                               │
     │◄──────────────────────────────┤                               │
     │ {type: "answer",              │                               │
     │  senderId: B,                 │                               │
     │  data: {sdp...}}              │                               │
     │                               │                               │
     │ 7. pc.setRemoteDescription()  │                               │
     │                               │                               │
     │ 8. ICE Candidates Exchange    │   ICE Candidates Exchange     │
     │◄─────────────────────────────►│◄─────────────────────────────►│
     │                               │                               │
     │ 9. ════════ Conexão P2P Estabelecida ════════                 │
     │                  Vídeo/Áudio direto                           │
     │═══════════════════════════════════════════════════════════════│
     │                               │                               │
     │ 10. /app/chat-message         │                               │
     │ {callId: 1,                   │                               │
     │  message: "Oi!"}              │                               │
     ├──────────────────────────────►│                               │
     │                               │ Salva no banco                │
     │                               │ chatMessageService.create()   │
     │                               │                               │
     │ /user/queue/chat              │   /user/queue/chat            │
     │◄──────────────────────────────┼──────────────────────────────►│
     │ {senderName: "Alice",         │   {senderName: "Alice",       │
     │  message: "Oi!",              │    message: "Oi!",            │
     │  sentAt: "..."}               │    sentAt: "..."}             │
     │                               │                               │
     │ 11. /app/next-person (Skip)   │                               │
     ├──────────────────────────────►│                               │
     │                               │ Encerra chamada               │
     │                               │ call.status = COMPLETED       │
     │                               │                               │
     │ /user/queue/call-ended        │   /user/queue/call-ended      │
     │◄──────────────────────────────┼──────────────────────────────►│
     │ {callId: 1}                   │   {callId: 1}                 │
     │                               │                               │
     │ pc.close()                    │   pc.close()                  │
     │ Fechar conexão                │   Fechar conexão              │
     │                               │                               │
     │                               │ joinQueue(userA)              │
     │                               │ Adiciona A na fila novamente  │
     │                               │                               │
     │ /user/queue/status            │                               │
     │◄──────────────────────────────┤                               │
     │ {status: "waiting"}           │                               │
     │                               │                               │
     │ ... aguardando novo match ... │                               │
     │                               │                               │
```

---

## 💬 Fluxo de Chat

```
Cliente A                  Servidor                  Cliente B
   │                          │                          │
   │  /app/chat-message       │                          │
   │  {callId: 1,             │                          │
   │   message: "Olá"}        │                          │
   ├─────────────────────────►│                          │
   │                          │                          │
   │                          │ 1. Valida callId         │
   │                          │ 2. Busca Call            │
   │                          │ 3. Cria ChatMessage      │
   │                          │ 4. Salva no banco        │
   │                          │ 5. Insere na árvore      │
   │                          │                          │
   │  /user/queue/chat        │  /user/queue/chat        │
   │◄─────────────────────────┼─────────────────────────►│
   │  {id: 123,               │  {id: 123,               │
   │   senderName: "Alice",   │   senderName: "Alice",   │
   │   message: "Olá",        │   message: "Olá",        │
   │   sentAt: "..."}         │   sentAt: "..."}         │
   │                          │                          │
```

---

## ⏭️ Fluxo de Skip (Next Person)

```
Cliente A                  Servidor                  Cliente B
   │                          │                          │
   │  Em chamada com B        │                          │
   │═══════════════════════════════════════════════════►│
   │                          │                          │
   │  /app/next-person        │                          │
   ├─────────────────────────►│                          │
   │                          │                          │
   │                          │ 1. getUserCallId(A)      │
   │                          │ 2. endCall(callId)       │
   │                          │    - call.status = DONE  │
   │                          │    - Remove de userInCall│
   │                          │                          │
   │  /user/queue/call-ended  │  /user/queue/call-ended  │
   │◄─────────────────────────┼─────────────────────────►│
   │                          │                          │
   │  pc.close()              │  pc.close()              │
   │                          │                          │
   │                          │ 3. joinQueue(A)          │
   │                          │    Adiciona A na fila    │
   │                          │                          │
   │  /user/queue/status      │                          │
   │◄─────────────────────────┤                          │
   │  {status: "waiting"}     │                          │
   │                          │                          │
   │  Aguardando novo match...│                          │
   │                          │                          │
```

---

## 🔌 Fluxo de Desconexão

```
Cliente A                  Servidor
   │                          │
   │  Fecha navegador/tab     │
   │  ou perde conexão        │
   │                          │
   │  DISCONNECT event        │
   ├─────────────────────────►│
   │                          │
   │                          │ WebSocketEventListener
   │                          │ detecta desconexão
   │                          │
   │                          │ 1. leaveQueue(A)
   │                          │ 2. isInCall(A)?
   │                          │    SIM: endCall(callId)
   │                          │ 3. unregisterSession(A)
   │                          │
   │                          │ Se estava em call com B:
   │                          │    /user/queue/call-ended
   │                          │    ────────────────────►│ B
   │                          │
```

---

## 🎮 Estados do Usuário

```
┌─────────────┐
│ CONECTADO   │ ──► Acabou de conectar ao WebSocket
└──────┬──────┘
       │
       │ /app/join-queue
       ▼
┌─────────────┐
│ NA FILA     │ ──► Aguardando pareamento
└──────┬──────┘
       │
       │ Match encontrado
       ▼
┌─────────────┐
│ EM CHAMADA  │ ──► Conectado com outro usuário
└──────┬──────┘
       │
       │ /app/next-person ou /app/end-call
       ▼
┌─────────────┐
│ NA FILA     │ ──► Aguardando novo match
└─────────────┘
       │
       │ /app/leave-queue ou DISCONNECT
       ▼
┌─────────────┐
│ DESCONECTADO│
└─────────────┘
```

---

## 📊 Estruturas de Dados em Memória

```
MatchmakingService
├── waitingQueue: Queue<Long>
│   └── [userId1, userId2, userId3, ...]
│
├── userInCall: Map<Long, Long>
│   └── userId → callId
│   └── 1 → 100
│   └── 2 → 100
│   └── 3 → 101
│
└── userSessions: Map<Long, String>
    └── userId → sessionId
    └── 1 → "abc123"
    └── 2 → "def456"
```

---

## 🎯 Exemplo de Uso Completo

```javascript
// ===== 1. SETUP =====
const token = await login("user@email.com", "senha123");
const socket = new SockJS('http://localhost:8080/ws');
const stomp = Stomp.over(socket);

// ===== 2. CONECTAR =====
stomp.connect({ 'Authorization': `Bearer ${token}` }, () => {
  
  // ===== 3. SUBSCREVER =====
  stomp.subscribe('/user/queue/match-found', handleMatch);
  stomp.subscribe('/user/queue/webrtc-signal', handleSignal);
  stomp.subscribe('/user/queue/chat', handleChat);
  stomp.subscribe('/user/queue/call-ended', handleCallEnded);
  
  // ===== 4. ENTRAR NA FILA =====
  stomp.send('/app/join-queue', {}, {});
});

// ===== 5. MATCH ENCONTRADO =====
function handleMatch(message) {
  const { callId, peerId, peerName } = JSON.parse(message.body);
  currentCallId = callId;
  currentPeerId = peerId;
  
  showUI(`Conectado com ${peerName}`);
  startWebRTC(peerId);
}

// ===== 6. WEBRTC =====
async function startWebRTC(peerId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true, audio: true
  });
  
  pc = new RTCPeerConnection(config);
  stream.getTracks().forEach(t => pc.addTrack(t, stream));
  
  pc.onicecandidate = e => {
    if (e.candidate) {
      stomp.send('/app/webrtc-signal', {}, JSON.stringify({
        type: 'ice-candidate',
        targetUserId: peerId,
        data: e.candidate
      }));
    }
  };
  
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  
  stomp.send('/app/webrtc-signal', {}, JSON.stringify({
    type: 'offer',
    targetUserId: peerId,
    data: offer
  }));
}

// ===== 7. CHAT =====
function sendMessage(text) {
  stomp.send('/app/chat-message', {}, JSON.stringify({
    callId: currentCallId,
    message: text
  }));
}

// ===== 8. SKIP =====
function skipToNext() {
  stomp.send('/app/next-person', {}, {});
  pc.close();
}

// ===== 9. DESCONECTAR =====
function disconnect() {
  stomp.disconnect();
  pc.close();
}
```

---

**Sistema completo de WebSocket estilo Omegle implementado!** 🎉
