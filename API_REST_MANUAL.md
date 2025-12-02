# 📚 Manual Completo da API REST - Sistema de Chamadas

## 🌐 Base URL
```
http://localhost:8080
```

---

## 🔐 Autenticação

### **Todas as rotas requerem autenticação JWT**, exceto:
- ✅ `POST /api/auth/signup`
- ✅ `POST /api/auth/login`
- ✅ `/h2-console/**`

### **Header de Autenticação:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiw...
```

---

## 📋 Índice de Endpoints

### **1. Autenticação**
- [POST /api/auth/signup](#1-signup---cadastro-de-usuário)
- [POST /api/auth/login](#2-login)
- [POST /api/auth/logout](#3-logout)

### **2. Usuários**
- [GET /api/users/me](#1-obter-perfil-do-usuário-autenticado)
- [GET /api/users/{id}](#2-obter-usuário-por-id)
- [GET /api/users](#3-listar-todos-os-usuários)
- [PUT /api/users/{id}](#4-atualizar-usuário)
- [PATCH /api/users/{id}/online](#5-atualizar-status-online)
- [PATCH /api/users/{id}/active](#6-atualizar-status-ativo)
- [DELETE /api/users/{id}](#7-deletar-usuário)

### **3. Chamadas**
- [POST /api/calls](#1-criar-chamada)
- [GET /api/calls/{id}](#2-obter-chamada-por-id)
- [GET /api/calls](#3-listar-todas-as-chamadas)
- [GET /api/calls/status/{status}](#4-listar-chamadas-por-status)
- [GET /api/calls/active](#5-listar-chamadas-ativas)
- [GET /api/calls/completed](#6-listar-chamadas-concluídas)
- [POST /api/calls/{id}/end](#7-encerrar-chamada)
- [POST /api/calls/{id}/cancel](#8-cancelar-chamada)
- [PATCH /api/calls/{id}/type](#9-atualizar-tipo-de-chamada)
- [DELETE /api/calls/{id}](#10-deletar-chamada)

### **4. Mensagens de Chat**
- [POST /api/messages](#1-criar-mensagem)
- [GET /api/messages/{id}](#2-obter-mensagem-por-id)
- [GET /api/messages](#3-listar-todas-as-mensagens)
- [GET /api/messages/call/{callId}](#4-listar-mensagens-de-uma-chamada)
- [GET /api/messages/call/{callId}/count](#5-contar-mensagens-de-uma-chamada)
- [PUT /api/messages/{id}](#6-atualizar-mensagem)
- [DELETE /api/messages/{id}](#7-deletar-mensagem)
- [DELETE /api/messages/call/{callId}](#8-deletar-todas-as-mensagens-de-uma-chamada)

### **5. Avaliações**
- [POST /api/ratings](#1-criar-avaliação)
- [GET /api/ratings/{id}](#2-obter-avaliação-por-id)
- [GET /api/ratings](#3-listar-todas-as-avaliações)
- [GET /api/ratings/min-rating/{rating}](#4-listar-avaliações-por-nota-mínima)
- [GET /api/ratings/top](#5-listar-melhores-avaliações)
- [GET /api/ratings/positive](#6-listar-avaliações-positivas)
- [PUT /api/ratings/{id}](#7-atualizar-avaliação)
- [DELETE /api/ratings/{id}](#8-deletar-avaliação)

---

# 🔐 1. Autenticação

## 1. Signup - Cadastro de Usuário

**Endpoint:** `POST /api/auth/signup`

**Descrição:** Cria uma nova conta de usuário.

**Autenticação:** ❌ Não requerida

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Validações:**
- `name`: Obrigatório, não vazio
- `email`: Obrigatório, formato de email válido
- `password`: Obrigatório, não vazio

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzAxNDU2...",
  "type": "Bearer",
  "userId": 1,
  "name": "João Silva",
  "email": "joao@email.com"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Email já cadastrado
- `400 Bad Request` - Validação falhou

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

---

## 2. Login

**Endpoint:** `POST /api/auth/login`

**Descrição:** Autentica um usuário e retorna token JWT.

**Autenticação:** ❌ Não requerida

**Request Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzAxNDU2...",
  "type": "Bearer",
  "userId": 1,
  "name": "João Silva",
  "email": "joao@email.com"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Email ou senha inválidos
- `409 Conflict` - Usuário inativo

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

---

## 3. Logout

**Endpoint:** `POST /api/auth/logout`

**Descrição:** Faz logout do usuário (atualiza status online para false).

**Autenticação:** ✅ Requerida

**Response:** `204 No Content`

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer {seu_token}"
```

---

# 👤 2. Usuários

## 1. Obter Perfil do Usuário Autenticado

**Endpoint:** `GET /api/users/me`

**Descrição:** Retorna os dados do usuário logado.

**Autenticação:** ✅ Requerida

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "createdAt": "2025-12-01T10:30:00",
  "updatedAt": "2025-12-01T10:30:00",
  "isActive": true,
  "isOnline": true
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/users/me \
  -H "Authorization: Bearer {seu_token}"
```

---

## 2. Obter Usuário por ID

**Endpoint:** `GET /api/users/{id}`

**Descrição:** Retorna dados de um usuário específico.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode ver seu próprio perfil

**Path Parameters:**
- `id` (Long) - ID do usuário

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "createdAt": "2025-12-01T10:30:00",
  "updatedAt": "2025-12-01T10:30:00",
  "isActive": true,
  "isOnline": true
}
```

**Possíveis Erros:**
- `400 Bad Request` - Acesso negado (tentando ver outro usuário)
- `400 Bad Request` - Usuário não encontrado

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 3. Listar Todos os Usuários

**Endpoint:** `GET /api/users`

**Descrição:** Lista todos os usuários (apenas usuários ativos).

**Autenticação:** ✅ Requerida

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2025-12-01T10:30:00",
    "updatedAt": "2025-12-01T10:30:00",
    "isActive": true,
    "isOnline": true
  },
  {
    "id": 2,
    "name": "Maria Santos",
    "email": "maria@email.com",
    "createdAt": "2025-12-01T11:00:00",
    "updatedAt": "2025-12-01T11:00:00",
    "isActive": true,
    "isOnline": false
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer {seu_token}"
```

---

## 4. Atualizar Usuário

**Endpoint:** `PUT /api/users/{id}`

**Descrição:** Atualiza dados do usuário.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode atualizar seu próprio perfil

**Path Parameters:**
- `id` (Long) - ID do usuário

**Request Body:**
```json
{
  "name": "João Silva Atualizado",
  "email": "joao.novo@email.com"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "João Silva Atualizado",
  "email": "joao.novo@email.com",
  "createdAt": "2025-12-01T10:30:00",
  "updatedAt": "2025-12-01T15:45:00",
  "isActive": true,
  "isOnline": true
}
```

**Possíveis Erros:**
- `400 Bad Request` - Acesso negado
- `400 Bad Request` - Email já em uso

**Exemplo cURL:**
```bash
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Atualizado",
    "email": "joao.novo@email.com"
  }'
```

---

## 5. Atualizar Status Online

**Endpoint:** `PATCH /api/users/{id}/online`

**Descrição:** Atualiza o status online/offline do usuário.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode atualizar seu próprio status

**Path Parameters:**
- `id` (Long) - ID do usuário

**Query Parameters:**
- `isOnline` (boolean) - true ou false

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "createdAt": "2025-12-01T10:30:00",
  "updatedAt": "2025-12-01T15:50:00",
  "isActive": true,
  "isOnline": false
}
```

**Exemplo cURL:**
```bash
curl -X PATCH "http://localhost:8080/api/users/1/online?isOnline=false" \
  -H "Authorization: Bearer {seu_token}"
```

---

## 6. Atualizar Status Ativo

**Endpoint:** `PATCH /api/users/{id}/active`

**Descrição:** Ativa ou desativa a conta do usuário.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode atualizar sua própria conta

**Path Parameters:**
- `id` (Long) - ID do usuário

**Query Parameters:**
- `isActive` (boolean) - true ou false

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "createdAt": "2025-12-01T10:30:00",
  "updatedAt": "2025-12-01T16:00:00",
  "isActive": false,
  "isOnline": false
}
```

**Exemplo cURL:**
```bash
curl -X PATCH "http://localhost:8080/api/users/1/active?isActive=false" \
  -H "Authorization: Bearer {seu_token}"
```

---

## 7. Deletar Usuário

**Endpoint:** `DELETE /api/users/{id}`

**Descrição:** Remove permanentemente um usuário do sistema.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode deletar sua própria conta

**Path Parameters:**
- `id` (Long) - ID do usuário

**Response:** `204 No Content`

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

# 📞 3. Chamadas

## 1. Criar Chamada

**Endpoint:** `POST /api/calls`

**Descrição:** Cria uma nova chamada entre dois usuários.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário autenticado deve ser um dos participantes

**Request Body:**
```json
{
  "user1Id": 1,
  "user2Id": 2,
  "callType": "VIDEO"
}
```

**Campos:**
- `user1Id` (Long) - ID do primeiro usuário (obrigatório)
- `user2Id` (Long) - ID do segundo usuário (obrigatório)
- `callType` (String) - "VIDEO" ou "AUDIO" (opcional, padrão: "VIDEO")

**Response:** `201 Created`
```json
{
  "id": 1,
  "user1Id": 1,
  "user1Name": "João Silva",
  "user2Id": 2,
  "user2Name": "Maria Santos",
  "startedAt": "2025-12-01T16:30:00",
  "endedAt": null,
  "durationSeconds": null,
  "callType": "VIDEO",
  "status": "ACTIVE"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Você deve ser um dos participantes da chamada
- `400 Bad Request` - Tipo de chamada inválido

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/calls \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user1Id": 1,
    "user2Id": 2,
    "callType": "VIDEO"
  }'
```

---

## 2. Obter Chamada por ID

**Endpoint:** `GET /api/calls/{id}`

**Descrição:** Retorna detalhes de uma chamada específica.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `id` (Long) - ID da chamada

**Response:** `200 OK`
```json
{
  "id": 1,
  "user1Id": 1,
  "user1Name": "João Silva",
  "user2Id": 2,
  "user2Name": "Maria Santos",
  "startedAt": "2025-12-01T16:30:00",
  "endedAt": "2025-12-01T17:00:00",
  "durationSeconds": 1800,
  "callType": "VIDEO",
  "status": "COMPLETED"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Acesso negado
- `400 Bad Request` - Chamada não encontrada

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/calls/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 3. Listar Todas as Chamadas

**Endpoint:** `GET /api/calls`

**Descrição:** Lista todas as chamadas do usuário autenticado.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Retorna apenas chamadas que o usuário participa

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user1Id": 1,
    "user1Name": "João Silva",
    "user2Id": 2,
    "user2Name": "Maria Santos",
    "startedAt": "2025-12-01T16:30:00",
    "endedAt": "2025-12-01T17:00:00",
    "durationSeconds": 1800,
    "callType": "VIDEO",
    "status": "COMPLETED"
  },
  {
    "id": 2,
    "user1Id": 1,
    "user1Name": "João Silva",
    "user2Id": 3,
    "user2Name": "Pedro Costa",
    "startedAt": "2025-12-01T18:00:00",
    "endedAt": null,
    "durationSeconds": null,
    "callType": "AUDIO",
    "status": "ACTIVE"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/calls \
  -H "Authorization: Bearer {seu_token}"
```

---

## 4. Listar Chamadas por Status

**Endpoint:** `GET /api/calls/status/{status}`

**Descrição:** Lista chamadas do usuário filtradas por status.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Retorna apenas chamadas que o usuário participa

**Path Parameters:**
- `status` (String) - "ACTIVE", "COMPLETED" ou "CANCELLED"

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user1Id": 1,
    "user1Name": "João Silva",
    "user2Id": 2,
    "user2Name": "Maria Santos",
    "startedAt": "2025-12-01T16:30:00",
    "endedAt": "2025-12-01T17:00:00",
    "durationSeconds": 1800,
    "callType": "VIDEO",
    "status": "COMPLETED"
  }
]
```

**Possíveis Erros:**
- `400 Bad Request` - Status inválido. Use ACTIVE, COMPLETED ou CANCELLED

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/calls/status/COMPLETED \
  -H "Authorization: Bearer {seu_token}"
```

---

## 5. Listar Chamadas Ativas

**Endpoint:** `GET /api/calls/active`

**Descrição:** Lista apenas chamadas ativas do usuário.

**Autenticação:** ✅ Requerida

**Response:** `200 OK`
```json
[
  {
    "id": 2,
    "user1Id": 1,
    "user1Name": "João Silva",
    "user2Id": 3,
    "user2Name": "Pedro Costa",
    "startedAt": "2025-12-01T18:00:00",
    "endedAt": null,
    "durationSeconds": null,
    "callType": "AUDIO",
    "status": "ACTIVE"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/calls/active \
  -H "Authorization: Bearer {seu_token}"
```

---

## 6. Listar Chamadas Concluídas

**Endpoint:** `GET /api/calls/completed`

**Descrição:** Lista apenas chamadas concluídas do usuário.

**Autenticação:** ✅ Requerida

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user1Id": 1,
    "user1Name": "João Silva",
    "user2Id": 2,
    "user2Name": "Maria Santos",
    "startedAt": "2025-12-01T16:30:00",
    "endedAt": "2025-12-01T17:00:00",
    "durationSeconds": 1800,
    "callType": "VIDEO",
    "status": "COMPLETED"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/calls/completed \
  -H "Authorization: Bearer {seu_token}"
```

---

## 7. Encerrar Chamada

**Endpoint:** `POST /api/calls/{id}/end`

**Descrição:** Encerra uma chamada ativa.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `id` (Long) - ID da chamada

**Response:** `200 OK`
```json
{
  "id": 2,
  "user1Id": 1,
  "user1Name": "João Silva",
  "user2Id": 3,
  "user2Name": "Pedro Costa",
  "startedAt": "2025-12-01T18:00:00",
  "endedAt": "2025-12-01T18:30:00",
  "durationSeconds": 1800,
  "callType": "AUDIO",
  "status": "COMPLETED"
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/calls/2/end \
  -H "Authorization: Bearer {seu_token}"
```

---

## 8. Cancelar Chamada

**Endpoint:** `POST /api/calls/{id}/cancel`

**Descrição:** Cancela uma chamada.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `id` (Long) - ID da chamada

**Response:** `200 OK`
```json
{
  "id": 3,
  "user1Id": 1,
  "user1Name": "João Silva",
  "user2Id": 4,
  "user2Name": "Ana Lima",
  "startedAt": "2025-12-01T19:00:00",
  "endedAt": "2025-12-01T19:01:00",
  "durationSeconds": 60,
  "callType": "VIDEO",
  "status": "CANCELLED"
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/calls/3/cancel \
  -H "Authorization: Bearer {seu_token}"
```

---

## 9. Atualizar Tipo de Chamada

**Endpoint:** `PATCH /api/calls/{id}/type`

**Descrição:** Altera o tipo da chamada (vídeo para áudio ou vice-versa).

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `id` (Long) - ID da chamada

**Query Parameters:**
- `callType` (String) - "VIDEO" ou "AUDIO"

**Response:** `200 OK`
```json
{
  "id": 2,
  "user1Id": 1,
  "user1Name": "João Silva",
  "user2Id": 3,
  "user2Name": "Pedro Costa",
  "startedAt": "2025-12-01T18:00:00",
  "endedAt": null,
  "durationSeconds": null,
  "callType": "VIDEO",
  "status": "ACTIVE"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Tipo de chamada inválido. Use VIDEO ou AUDIO

**Exemplo cURL:**
```bash
curl -X PATCH "http://localhost:8080/api/calls/2/type?callType=VIDEO" \
  -H "Authorization: Bearer {seu_token}"
```

---

## 10. Deletar Chamada

**Endpoint:** `DELETE /api/calls/{id}`

**Descrição:** Remove uma chamada do sistema.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `id` (Long) - ID da chamada

**Response:** `204 No Content`

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:8080/api/calls/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

# 💬 4. Mensagens de Chat

## 1. Criar Mensagem

**Endpoint:** `POST /api/messages`

**Descrição:** Envia uma mensagem no chat de uma chamada.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada e ser o remetente

**Request Body:**
```json
{
  "callId": 1,
  "senderId": 1,
  "messageText": "Olá, como vai?"
}
```

**Campos:**
- `callId` (Long) - ID da chamada (obrigatório)
- `senderId` (Long) - ID do remetente (obrigatório)
- `messageText` (String) - Texto da mensagem (obrigatório, não vazio)

**Response:** `201 Created`
```json
{
  "id": 1,
  "callId": 1,
  "senderId": 1,
  "senderName": "João Silva",
  "messageText": "Olá, como vai?",
  "sentAt": "2025-12-01T16:35:00"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Você só pode enviar mensagens em seu próprio nome
- `400 Bad Request` - Você não participa desta chamada

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/messages \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": 1,
    "senderId": 1,
    "messageText": "Olá, como vai?"
  }'
```

---

## 2. Obter Mensagem por ID

**Endpoint:** `GET /api/messages/{id}`

**Descrição:** Retorna uma mensagem específica.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `id` (Long) - ID da mensagem

**Response:** `200 OK`
```json
{
  "id": 1,
  "callId": 1,
  "senderId": 1,
  "senderName": "João Silva",
  "messageText": "Olá, como vai?",
  "sentAt": "2025-12-01T16:35:00"
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/messages/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 3. Listar Todas as Mensagens

**Endpoint:** `GET /api/messages`

**Descrição:** Lista todas as mensagens das chamadas do usuário.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Retorna apenas mensagens de chamadas que o usuário participa

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "callId": 1,
    "senderId": 1,
    "senderName": "João Silva",
    "messageText": "Olá, como vai?",
    "sentAt": "2025-12-01T16:35:00"
  },
  {
    "id": 2,
    "callId": 1,
    "senderId": 2,
    "senderName": "Maria Santos",
    "messageText": "Oi! Tudo bem e você?",
    "sentAt": "2025-12-01T16:36:00"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/messages \
  -H "Authorization: Bearer {seu_token}"
```

---

## 4. Listar Mensagens de uma Chamada

**Endpoint:** `GET /api/messages/call/{callId}`

**Descrição:** Lista todas as mensagens de uma chamada específica.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `callId` (Long) - ID da chamada

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "callId": 1,
    "senderId": 1,
    "senderName": "João Silva",
    "messageText": "Olá, como vai?",
    "sentAt": "2025-12-01T16:35:00"
  },
  {
    "id": 2,
    "callId": 1,
    "senderId": 2,
    "senderName": "Maria Santos",
    "messageText": "Oi! Tudo bem e você?",
    "sentAt": "2025-12-01T16:36:00"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/messages/call/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 5. Contar Mensagens de uma Chamada

**Endpoint:** `GET /api/messages/call/{callId}/count`

**Descrição:** Retorna o número total de mensagens em uma chamada.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `callId` (Long) - ID da chamada

**Response:** `200 OK`
```json
25
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/messages/call/1/count \
  -H "Authorization: Bearer {seu_token}"
```

---

## 6. Atualizar Mensagem

**Endpoint:** `PUT /api/messages/{id}`

**Descrição:** Edita o texto de uma mensagem enviada.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode editar suas próprias mensagens

**Path Parameters:**
- `id` (Long) - ID da mensagem

**Query Parameters:**
- `messageText` (String) - Novo texto da mensagem

**Response:** `200 OK`
```json
{
  "id": 1,
  "callId": 1,
  "senderId": 1,
  "senderName": "João Silva",
  "messageText": "Olá, como você está?",
  "sentAt": "2025-12-01T16:35:00"
}
```

**Possíveis Erros:**
- `400 Bad Request` - Mensagem não pode estar vazia
- `400 Bad Request` - Você só pode editar suas próprias mensagens

**Exemplo cURL:**
```bash
curl -X PUT "http://localhost:8080/api/messages/1?messageText=Olá,%20como%20você%20está?" \
  -H "Authorization: Bearer {seu_token}"
```

---

## 7. Deletar Mensagem

**Endpoint:** `DELETE /api/messages/{id}`

**Descrição:** Remove uma mensagem.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode deletar suas próprias mensagens

**Path Parameters:**
- `id` (Long) - ID da mensagem

**Response:** `204 No Content`

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:8080/api/messages/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 8. Deletar Todas as Mensagens de uma Chamada

**Endpoint:** `DELETE /api/messages/call/{callId}`

**Descrição:** Remove todas as mensagens de uma chamada.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve participar da chamada

**Path Parameters:**
- `callId` (Long) - ID da chamada

**Response:** `204 No Content`

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:8080/api/messages/call/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

# ⭐ 5. Avaliações

## 1. Criar Avaliação

**Endpoint:** `POST /api/ratings`

**Descrição:** Avalia uma chamada concluída.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve ter participado da chamada

**Request Body:**
```json
{
  "callId": 1,
  "raterId": 1,
  "rating": 5,
  "comment": "Excelente conversa!"
}
```

**Campos:**
- `callId` (Long) - ID da chamada (obrigatório)
- `raterId` (Long) - ID de quem está avaliando (obrigatório)
- `rating` (Integer) - Nota de 1 a 5 (obrigatório)
- `comment` (String) - Comentário (opcional)

**Response:** `201 Created`
```json
{
  "id": 1,
  "callId": 1,
  "raterId": 1,
  "raterName": "João Silva",
  "rating": 5,
  "comment": "Excelente conversa!",
  "createdAt": "2025-12-01T17:05:00"
}
```

**Validações:**
- Rating deve estar entre 1 e 5

**Possíveis Erros:**
- `400 Bad Request` - Você só pode criar avaliações em seu próprio nome
- `400 Bad Request` - Você só pode avaliar chamadas que participou
- `400 Bad Request` - Rating deve estar entre 1 e 5

**Exemplo cURL:**
```bash
curl -X POST http://localhost:8080/api/ratings \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": 1,
    "raterId": 1,
    "rating": 5,
    "comment": "Excelente conversa!"
  }'
```

---

## 2. Obter Avaliação por ID

**Endpoint:** `GET /api/ratings/{id}`

**Descrição:** Retorna uma avaliação específica.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário deve ter participado da chamada avaliada

**Path Parameters:**
- `id` (Long) - ID da avaliação

**Response:** `200 OK`
```json
{
  "id": 1,
  "callId": 1,
  "raterId": 1,
  "raterName": "João Silva",
  "rating": 5,
  "comment": "Excelente conversa!",
  "createdAt": "2025-12-01T17:05:00"
}
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/ratings/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 3. Listar Todas as Avaliações

**Endpoint:** `GET /api/ratings`

**Descrição:** Lista todas as avaliações das chamadas do usuário.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Retorna apenas avaliações de chamadas que o usuário participou

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "callId": 1,
    "raterId": 1,
    "raterName": "João Silva",
    "rating": 5,
    "comment": "Excelente conversa!",
    "createdAt": "2025-12-01T17:05:00"
  },
  {
    "id": 2,
    "callId": 1,
    "raterId": 2,
    "raterName": "Maria Santos",
    "rating": 4,
    "comment": "Muito bom!",
    "createdAt": "2025-12-01T17:06:00"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/ratings \
  -H "Authorization: Bearer {seu_token}"
```

---

## 4. Listar Avaliações por Nota Mínima

**Endpoint:** `GET /api/ratings/min-rating/{rating}`

**Descrição:** Lista avaliações com nota igual ou superior ao valor especificado.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Retorna apenas avaliações de chamadas que o usuário participou

**Path Parameters:**
- `rating` (Integer) - Nota mínima (1 a 5)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "callId": 1,
    "raterId": 1,
    "raterName": "João Silva",
    "rating": 5,
    "comment": "Excelente conversa!",
    "createdAt": "2025-12-01T17:05:00"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/ratings/min-rating/4 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 5. Listar Melhores Avaliações

**Endpoint:** `GET /api/ratings/top`

**Descrição:** Lista avaliações com nota 5 (máxima).

**Autenticação:** ✅ Requerida

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "callId": 1,
    "raterId": 1,
    "raterName": "João Silva",
    "rating": 5,
    "comment": "Excelente conversa!",
    "createdAt": "2025-12-01T17:05:00"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/ratings/top \
  -H "Authorization: Bearer {seu_token}"
```

---

## 6. Listar Avaliações Positivas

**Endpoint:** `GET /api/ratings/positive`

**Descrição:** Lista avaliações com nota 4 ou 5.

**Autenticação:** ✅ Requerida

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "callId": 1,
    "raterId": 1,
    "raterName": "João Silva",
    "rating": 5,
    "comment": "Excelente conversa!",
    "createdAt": "2025-12-01T17:05:00"
  },
  {
    "id": 2,
    "callId": 1,
    "raterId": 2,
    "raterName": "Maria Santos",
    "rating": 4,
    "comment": "Muito bom!",
    "createdAt": "2025-12-01T17:06:00"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET http://localhost:8080/api/ratings/positive \
  -H "Authorization: Bearer {seu_token}"
```

---

## 7. Atualizar Avaliação

**Endpoint:** `PUT /api/ratings/{id}`

**Descrição:** Atualiza uma avaliação existente.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode atualizar suas próprias avaliações

**Path Parameters:**
- `id` (Long) - ID da avaliação

**Query Parameters:**
- `rating` (Integer) - Nova nota (opcional)
- `comment` (String) - Novo comentário (opcional)

**Response:** `200 OK`
```json
{
  "id": 1,
  "callId": 1,
  "raterId": 1,
  "raterName": "João Silva",
  "rating": 4,
  "comment": "Muito boa conversa!",
  "createdAt": "2025-12-01T17:05:00"
}
```

**Exemplo cURL:**
```bash
curl -X PUT "http://localhost:8080/api/ratings/1?rating=4&comment=Muito%20boa%20conversa!" \
  -H "Authorization: Bearer {seu_token}"
```

---

## 8. Deletar Avaliação

**Endpoint:** `DELETE /api/ratings/{id}`

**Descrição:** Remove uma avaliação.

**Autenticação:** ✅ Requerida

**Autorização:** ⚠️ Usuário só pode deletar suas próprias avaliações

**Path Parameters:**
- `id` (Long) - ID da avaliação

**Response:** `204 No Content`

**Exemplo cURL:**
```bash
curl -X DELETE http://localhost:8080/api/ratings/1 \
  -H "Authorization: Bearer {seu_token}"
```

---

# 🚨 Códigos de Status HTTP

## Sucesso
- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Operação bem-sucedida sem conteúdo de retorno

## Erros do Cliente
- `400 Bad Request` - Dados inválidos ou erro de validação
- `401 Unauthorized` - Token JWT inválido ou ausente
- `403 Forbidden` - Sem permissão para acessar o recurso
- `404 Not Found` - Recurso não encontrado

## Erros do Servidor
- `409 Conflict` - Conflito (ex: email duplicado, usuário inativo)
- `500 Internal Server Error` - Erro interno do servidor

---

# 📝 Formato de Erro Padrão

Todos os erros seguem o mesmo formato:

```json
{
  "timestamp": "2025-12-01T17:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email já cadastrado",
  "path": "/api/auth/signup"
}
```

---

# 🔧 Variáveis de Ambiente

Para facilitar testes, você pode criar um arquivo `.env` ou usar variáveis:

```bash
export API_URL=http://localhost:8080
export JWT_TOKEN=eyJhbGciOiJIUzI1NiJ9...
```

Exemplo de uso:
```bash
curl -X GET $API_URL/api/users/me \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

# 🧪 Testando com Postman

## 1. Importar Coleção

Crie uma nova coleção no Postman chamada "Chamadas API".

## 2. Configurar Variável de Ambiente

- `base_url`: http://localhost:8080
- `token`: (será preenchido após login)

## 3. Criar Requests

### Login Request (POST)
```
URL: {{base_url}}/api/auth/login
Body (raw JSON):
{
  "email": "joao@email.com",
  "password": "senha123"
}

Tests (Script):
pm.environment.set("token", pm.response.json().token);
```

### Chamadas (GET)
```
URL: {{base_url}}/api/calls
Headers:
  Authorization: Bearer {{token}}
```

---

# 🎯 Fluxo Completo de Uso

```
1. Signup    → POST /api/auth/signup
2. Login     → POST /api/auth/login (guarda token)
3. Ver perfil → GET /api/users/me
4. Criar call → POST /api/calls
5. Chat      → POST /api/messages
6. End call  → POST /api/calls/{id}/end
7. Avaliar   → POST /api/ratings
8. Logout    → POST /api/auth/logout
```

---

# 📚 Recursos Adicionais

- **Swagger UI** (futuro): `http://localhost:8080/swagger-ui.html`
- **H2 Console**: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./data/videocall_db`
  - Username: `admin`
  - Password: `admin`

---

**API REST completa e documentada!** 🚀
