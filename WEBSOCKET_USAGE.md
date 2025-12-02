# 🌐 WebSocket - Guia de Uso

## 📚 Configuração Inicial

A configuração do WebSocket está completa e pronta para uso!

### Arquivos Criados:

1. **`/src/services/websocketService.ts`** - Serviço singleton WebSocket
2. **`/src/services/hooks/useWebSocket.ts`** - Hook React para WebSocket
3. **`/src/services/types/websocket.types.ts`** - Tipos TypeScript

---

## 🚀 Como Usar

### Exemplo 1: Conectar e Entrar na Fila

```tsx
import { useWebSocket } from '@/services';
import { useEffect } from 'react';

function MatchmakingComponent() {
  const {
    connect,
    disconnect,
    joinQueue,
    leaveQueue,
    isConnected,
    updateHandlers,
  } = useWebSocket({
    autoConnect: true,
    autoDisconnect: true,
  });

  useEffect(() => {
    // Configurar event handlers
    updateHandlers({
      onConnect: () => {
        console.log('Conectado ao WebSocket!');
      },
      onMatchFound: (data) => {
        console.log('Pareamento encontrado:', data);
        // data.callId, data.peerId, data.peerName
        // Iniciar chamada WebRTC aqui
      },
      onStatus: (data) => {
        console.log('Status:', data.message);
      },
      onError: (error) => {
        console.error('Erro:', error.error);
      },
    });
  }, [updateHandlers]);

  const handleStartSearch = () => {
    if (!isConnected()) {
      connect().then(() => joinQueue());
    } else {
      joinQueue();
    }
  };

  return (
    <div>
      <button onClick={handleStartSearch}>
        Procurar alguém para conversar
      </button>
      <button onClick={leaveQueue}>
        Sair da fila
      </button>
    </div>
  );
}
```

---

### Exemplo 2: Chat em Tempo Real

```tsx
import { useWebSocket } from '@/services';
import { useState, useEffect } from 'react';

function ChatComponent({ callId }: { callId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  const { sendChatMessage, sendTyping, updateHandlers } = useWebSocket();

  useEffect(() => {
    updateHandlers({
      onChatMessage: (data) => {
        setMessages((prev) => [...prev, {
          id: data.id,
          text: data.message,
          sender: data.senderName,
          isOwn: false,
          time: new Date(data.sentAt).toLocaleTimeString(),
        }]);
      },
      onTyping: (data) => {
        console.log('Peer está digitando:', data.isTyping);
      },
    });
  }, [updateHandlers]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    sendChatMessage(callId, inputText);
    
    // Adicionar mensagem própria
    setMessages((prev) => [...prev, {
      id: Date.now(),
      text: inputText,
      sender: 'Você',
      isOwn: true,
      time: new Date().toLocaleTimeString(),
    }]);

    setInputText('');
  };

  const handleTyping = () => {
    sendTyping(callId);
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.isOwn ? 'own' : 'peer'}>
            <strong>{msg.sender}:</strong> {msg.text}
            <span>{msg.time}</span>
          </div>
        ))}
      </div>

      <input
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          handleTyping();
        }}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Enviar</button>
    </div>
  );
}
```

---

### Exemplo 3: WebRTC com Sinais

```tsx
import { useWebSocket, type WebRTCSignal } from '@/services';
import { useEffect, useRef } from 'react';

function VideoCallComponent({ callId, peerId }: { callId: number; peerId: number }) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { sendWebRTCSignal, updateHandlers } = useWebSocket();

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    updateHandlers({
      onWebRTCSignal: async (signal) => {
        if (!peerConnectionRef.current) return;

        if (signal.type === 'offer') {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
          );
          
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          sendWebRTCSignal({
            type: 'answer',
            callId,
            targetUserId: peerId,
            data: answer,
          });
        } else if (signal.type === 'answer') {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
          );
        } else if (signal.type === 'ice-candidate') {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(signal.data as RTCIceCandidateInit)
          );
        }
      },
    });
  }, [callId, peerId, sendWebRTCSignal, updateHandlers]);

  const startCall = async () => {
    // Obter mídia local
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Criar peer connection
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Adicionar tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Receber remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Enviar ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebRTCSignal({
          type: 'ice-candidate',
          callId,
          targetUserId: peerId,
          data: event.candidate.toJSON(),
        });
      }
    };

    // Criar offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendWebRTCSignal({
      type: 'offer',
      callId,
      targetUserId: peerId,
      data: offer,
    });
  };

  useEffect(() => {
    startCall();
    
    return () => {
      peerConnectionRef.current?.close();
    };
  }, []);

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
    </div>
  );
}
```

---

### Exemplo 4: Skip/Next Person

```tsx
import { useWebSocket } from '@/services';

function CallControls() {
  const { nextPerson, endCall } = useWebSocket();

  return (
    <div>
      <button onClick={nextPerson}>
        ⏭️ Próxima Pessoa
      </button>
      <button onClick={() => endCall(currentCallId)}>
        📞 Encerrar Chamada
      </button>
    </div>
  );
}
```

---

## 📡 Eventos Disponíveis

### Event Handlers:

```typescript
{
  onStatus?: (data: StatusMessage) => void;
  onMatchFound?: (data: MatchFound) => void;
  onWebRTCSignal?: (data: WebRTCSignal) => void;
  onChatMessage?: (data: ChatMessage) => void;
  onTyping?: (data: TypingIndicator) => void;
  onCallEnded?: (data: CallEnded) => void;
  onError?: (data: WebSocketError) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}
```

### Métodos Disponíveis:

- `connect()` - Conectar ao WebSocket
- `disconnect()` - Desconectar
- `isConnected()` - Verificar conexão
- `joinQueue()` - Entrar na fila de pareamento
- `leaveQueue()` - Sair da fila
- `nextPerson()` - Skip/próxima pessoa
- `endCall(callId)` - Encerrar chamada
- `sendWebRTCSignal(signal)` - Enviar sinais WebRTC
- `sendChatMessage(callId, message)` - Enviar mensagem
- `sendTyping(callId)` - Indicar digitação
- `updateHandlers(handlers)` - Atualizar event handlers

---

## 🔐 Segurança

- ✅ JWT obrigatório na conexão
- ✅ Token extraído do localStorage
- ✅ Validação automática no backend
- ✅ Sessão associada ao userId

---

## 🎯 Próximos Passos

1. Integrar WebRTC na página de chamada
2. Implementar indicador de "procurando..."
3. Adicionar notificações de eventos
4. Criar sistema de status (online/offline)
5. Implementar reconexão automática
