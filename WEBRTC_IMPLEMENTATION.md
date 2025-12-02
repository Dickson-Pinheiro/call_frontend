# Implementação WebRTC + WebSocket

## 📋 Resumo

Implementação completa de chamadas de vídeo e áudio via WebRTC com pareamento através de WebSocket usando protocolo STOMP.

## 🏗️ Arquitetura

### CallContext (`/src/contexts/CallContext.tsx`)

Gerencia todo o estado e lógica das chamadas de vídeo:

**Estados:**
- `idle`: Sem chamada ativa
- `searching`: Procurando parceiro
- `connecting`: Estabelecendo conexão WebRTC
- `connected`: Chamada ativa
- `ended`: Chamada encerrada

**Funcionalidades:**
- ✅ Gerenciamento de MediaStream local e remoto
- ✅ Configuração PeerConnection com ICE servers STUN
- ✅ Envio e recebimento de sinais WebRTC (offer/answer/ice-candidate)
- ✅ Toggle de vídeo e áudio
- ✅ Navegação automática entre estados
- ✅ Limpeza de recursos ao encerrar chamada

### WebSocket Service (`/src/services/websocketService.ts`)

Singleton que gerencia a conexão WebSocket/STOMP:

**Eventos Configurados:**
- `onMatchFound`: Quando um parceiro é encontrado
- `onWebRTCSignal`: Sinais WebRTC recebidos (offer, answer, ice-candidate)
- `onCallEnded`: Quando a chamada é encerrada
- `onError`: Erros do WebSocket

**Métodos:**
- `joinQueue()`: Entrar na fila de matchmaking
- `leaveQueue()`: Sair da fila
- `sendWebRTCSignal()`: Enviar sinal WebRTC para o parceiro
- `nextPerson()`: Pular para próxima pessoa
- `endCall()`: Encerrar chamada atual

## 🔄 Fluxo de Funcionamento

### 1. Iniciar Busca (Dashboard)

```tsx
const { startSearching } = useCall();

// Usuário clica em "Iniciar chamada"
startSearching();
```

**O que acontece:**
1. Estado muda para `searching`
2. WebSocket conecta (se necessário)
3. Envia comando `joinQueue()` via WebSocket
4. Navega para `/app/call`
5. Tela mostra "Procurando alguém..."

### 2. Match Encontrado

Quando o backend encontra um par:

```typescript
onMatchFound: (data: MatchFound) => {
  // data.callId: ID da chamada
  // data.peerId: ID do parceiro
  // data.peerName: Nome do parceiro
  
  setCurrentCallId(data.callId);
  setPeerId(data.peerId);
  setPeerName(data.peerName);
  setCallState('connecting');
  
  // Inicializa WebRTC
  await initializeWebRTC(data.callId, data.peerId);
}
```

### 3. Estabelecimento WebRTC

**Sequência de Sinais:**

1. **Usuário A cria Offer:**
   ```typescript
   const offer = await pc.createOffer();
   await pc.setLocalDescription(offer);
   
   sendWebRTCSignal({
     type: 'offer',
     callId,
     targetUserId: peerId,
     data: offer
   });
   ```

2. **Usuário B recebe Offer e cria Answer:**
   ```typescript
   await pc.setRemoteDescription(offer);
   const answer = await pc.createAnswer();
   await pc.setLocalDescription(answer);
   
   sendWebRTCSignal({
     type: 'answer',
     callId,
     targetUserId: peerId,
     data: answer
   });
   ```

3. **ICE Candidates trocados:**
   ```typescript
   pc.onicecandidate = (event) => {
     if (event.candidate) {
       sendWebRTCSignal({
         type: 'ice-candidate',
         callId,
         targetUserId: peerId,
         data: event.candidate.toJSON()
       });
     }
   };
   ```

4. **Conexão estabelecida:**
   ```typescript
   pc.ontrack = (event) => {
     setRemoteStream(event.streams[0]);
     setCallState('connected');
   };
   ```

### 4. Chamada Ativa

**Funcionalidades disponíveis:**
- Toggle vídeo: `toggleVideo()`
- Toggle áudio: `toggleAudio()`
- Próxima pessoa: `nextPerson()`
- Encerrar: `endCall()`

**Renderização de vídeos:**
```tsx
// Vídeo remoto (tela principal)
<video
  ref={remoteVideoRef}
  autoPlay
  playsInline
  className="w-full h-full object-cover"
/>

// Vídeo local (pequeno, canto)
<video
  ref={localVideoRef}
  autoPlay
  playsInline
  muted
  className="w-full h-full object-cover"
/>
```

### 5. Encerramento

Quando a chamada termina:

```typescript
const cleanupCall = () => {
  // Parar tracks de mídia
  localStream?.getTracks().forEach(track => track.stop());
  
  // Fechar peer connection
  peerConnection?.close();
  
  // Limpar estados
  setLocalStream(null);
  setRemoteStream(null);
  setCallState('idle');
  
  // Navegar para dashboard
  navigate({ to: '/app/dashboard' });
};
```

## 🎨 Interface do Usuário

### Estados Visuais

**Searching:**
- Spinner animado azul
- Mensagem "Procurando alguém..."
- Botão "Cancelar"

**Connecting:**
- Spinner animado verde
- Mensagem "Conectando com {nome}..."

**Connected:**
- Vídeo remoto em tela cheia
- Vídeo local pequeno no canto
- Barra de controles:
  - Chat
  - Microfone (on/off)
  - Câmera (on/off)
  - Próxima pessoa
  - Encerrar chamada

## 🔧 Configuração WebRTC

```typescript
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
```

**STUN Servers:**
- Permitem descoberta de IP público
- Necessários para NAT traversal
- Gratuitos do Google

## 📡 Endpoints WebSocket

**STOMP Subscriptions:**
- `/user/queue/status` - Status da conexão
- `/user/queue/match-found` - Match encontrado
- `/user/queue/webrtc-signal` - Sinais WebRTC
- `/user/queue/chat` - Mensagens de chat
- `/user/queue/typing` - Indicador de digitação
- `/user/queue/call-ended` - Chamada encerrada
- `/user/queue/errors` - Erros

**STOMP Publish:**
- `/app/joinQueue` - Entrar na fila
- `/app/leaveQueue` - Sair da fila
- `/app/webrtc-signal` - Enviar sinal WebRTC
- `/app/next-person` - Próxima pessoa
- `/app/end-call` - Encerrar chamada
- `/app/chat` - Enviar mensagem
- `/app/typing` - Indicador de digitação

## 🛡️ Tratamento de Erros

### Permissões de Mídia

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
} catch (error) {
  alert('Erro ao acessar câmera/microfone. Verifique as permissões.');
  cleanupCall();
}
```

### Desconexões

```typescript
pc.oniceconnectionstatechange = () => {
  if (pc.iceConnectionState === 'disconnected' || 
      pc.iceConnectionState === 'failed') {
    console.warn('Conexão perdida');
    // Pode implementar reconexão automática aqui
  }
};
```

### WebSocket Errors

```typescript
onError: (error) => {
  console.error('Erro WebSocket:', error);
  alert(error.error);
}
```

## 📝 Próximos Passos

### Funcionalidades Pendentes:

1. **Chat em Tempo Real:**
   - Integrar `sendChatMessage()` e `onChatMessage`
   - Implementar indicador de digitação
   - Salvar histórico de mensagens

2. **Estatísticas:**
   - Integrar com `useCalls()` para mostrar chamadas reais
   - Atualizar stats do dashboard com dados da API

3. **Qualidade de Vídeo:**
   - Implementar seleção de qualidade (720p, 1080p)
   - Adaptação automática de bitrate

4. **Reconexão:**
   - Reconexão automática em caso de falha de rede
   - Salvar estado da chamada

5. **Melhorias de UX:**
   - Feedback de qualidade de conexão
   - Preview de câmera antes de entrar na fila
   - Sons de notificação

## 🐛 Debug

**Logs importantes habilitados:**
- `✅ WebSocket conectado`
- `🎯 Match encontrado`
- `📤 Enviando offer/answer`
- `📥 Processando offer/answer`
- `🧊 ICE candidate`
- `📹 Remote track recebido`
- `🧹 Limpando recursos`

**Console do navegador:**
- Verificar `ICE Connection State`
- Monitorar tracks de mídia
- Acompanhar sinais WebRTC

## 🔐 Segurança

- JWT incluído no handshake WebSocket (header `Authorization`)
- STOMP garante que apenas destinatários corretos recebem sinais
- CallId usado para validar todas as operações
- Limpeza completa de recursos ao encerrar
