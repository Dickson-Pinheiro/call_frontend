# Sistema de Follow (Seguir) - Documentação

## 📋 Visão Geral

Sistema completo de "seguir usuários" implementado com:
- ✅ Entity JPA com relacionamentos bidirecionais
- ✅ Árvore AVL para busca O(log n) em memória
- ✅ Sincronização distribuída via Redis Pub/Sub
- ✅ Repository para persistência
- ✅ Service com regras de negócio
- ✅ Controller REST API
- ✅ DTOs para responses

## 🏗️ Estrutura Criada

### 1. **FollowEntity** (`entity/FollowEntity.java`)
```java
- id: Long (auto incrementado)
- follower: UserEntity (quem segue)
- following: UserEntity (quem é seguido)
- followedAt: LocalDateTime (timestamp)
- Constraint única: (follower_id, following_id)
```

### 2. **FollowRepository** (`repository/FollowRepository.java`)
```java
- findByFollowerIdAndFollowingId()
- findByFollowerId() - lista quem o usuário segue
- findByFollowingId() - lista seguidores do usuário
- countFollowing() - conta quantos o usuário segue
- countFollowers() - conta seguidores do usuário
- existsByFollowerIdAndFollowingId()
- deleteByFollowerIdAndFollowingId()
```

### 3. **FollowTree** (`tree/FollowTree.java`)
Árvore AVL especializada para Follow:
```java
- loadFromDatabase() - carrega todos os follows do banco
- addFollow() - adiciona e persiste
- removeFollow() - remove e persiste
- findById() - busca O(log n)
- findByFollowerId() - filtra por quem segue
- findByFollowingId() - filtra por quem é seguido
- findByFollowerAndFollowing() - busca relação específica
- reload() - recarrega do banco
```

### 4. **FollowService** (`service/FollowService.java`)
Lógica de negócio:
```java
- follow(followerId, followingId) - criar relação
  * Valida: não pode seguir a si mesmo
  * Valida: já está seguindo
  * Publica no Redis para sync distribuído
  
- unfollow(followerId, followingId) - remover relação
  * Publica no Redis para sync distribuído
  
- getFollowing(userId) - lista quem o usuário segue
- getFollowers(userId) - lista seguidores
- isFollowing(followerId, followingId) - verifica relação
- countFollowing(userId) - conta follows
- countFollowers(userId) - conta followers
- syncFollowAction() - sincroniza ações do Redis
```

### 5. **RedisFollowSyncService** (`service/RedisFollowSyncService.java`)
Publicador Redis:
```java
- publishFollowAction(action, followId, followerId, followingId)
  * Canal: "follow:sync"
  * Payload JSON: { action, followId, followerId, followingId, timestamp }
  * Actions: "ADD" | "REMOVE"
```

### 6. **RedisFollowSyncListener** (`service/RedisFollowSyncListener.java`)
Listener Redis:
```java
- onMessage() - escuta canal "follow:sync"
- Chama FollowService.syncFollowAction()
- Sincroniza árvore local com operações remotas
```

### 7. **FollowController** (`controller/FollowController.java`)
API REST:
```
POST   /api/follows/{followingId}?userId=X  - Seguir usuário
DELETE /api/follows/{followingId}?userId=X  - Deixar de seguir
GET    /api/follows/{userId}/following       - Listar quem o usuário segue
GET    /api/follows/{userId}/followers       - Listar seguidores
GET    /api/follows/{userId}/stats           - Estatísticas (com isFollowing)
GET    /api/follows/check?followerId=X&followingId=Y - Verificar se segue
```

### 8. **DTOs**
- `FollowResponse` - resposta completa de follow
- `UserStatsResponse` - estatísticas do usuário (followingCount, followersCount, isFollowing)

## 🔄 Estratégia de Sincronização Distribuída

### Problema
Em um sistema com múltiplas instâncias (containers Docker/servidores), cada instância tem sua própria árvore AVL em memória. Quando um usuário segue alguém no servidor A, o servidor B não sabe.

### Solução Implementada: Redis Pub/Sub

#### Fluxo de Follow:
1. **Cliente** → POST `/api/follows/123?userId=1`
2. **Servidor A** (recebe request):
   - Valida dados
   - Salva no banco: `followRepository.save()`
   - Insere na árvore local: `followTree.insert()`
   - **Publica no Redis**: `redisFollowSync.publishFollowAction("ADD", ...)`
   
3. **Redis** → Canal "follow:sync" transmite para todos servidores

4. **Servidor B, C, D...** (todos os outros):
   - `RedisFollowSyncListener` recebe mensagem
   - Valida se follow já existe na árvore local
   - Se não existe: busca no banco e insere na árvore
   - Árvore sincronizada! ✅

#### Fluxo de Unfollow:
1. **Cliente** → DELETE `/api/follows/123?userId=1`
2. **Servidor A**:
   - Remove do banco
   - Remove da árvore local
   - Publica "REMOVE" no Redis
   
3. **Servidores B, C, D...**:
   - Recebem "REMOVE"
   - Removem da árvore local
   - Sincronizado! ✅

### Vantagens
✅ **Performance**: Busca O(log n) em memória  
✅ **Consistência**: Todas instâncias sincronizadas via Redis  
✅ **Persistência**: Banco como fonte de verdade  
✅ **Escalabilidade**: Adicione quantos servidores quiser  
✅ **Resiliência**: Se uma árvore corromper, recarrega do banco  

### Garantias
- **Source of Truth**: PostgreSQL (banco relacional)
- **Cache Distribuído**: Árvores AVL sincronizadas
- **Eventual Consistency**: Redis Pub/Sub garante propagação
- **Fallback**: Método `reload()` recarrega do banco se necessário

## 📊 Exemplo de Uso

### Seguir um usuário
```bash
POST /api/follows/5?userId=1
Response: {
  "success": true,
  "message": "Você agora está seguindo este usuário",
  "followerId": 1,
  "followingId": 5
}
```

### Listar quem estou seguindo
```bash
GET /api/follows/1/following
Response: [
  { "id": 5, "name": "João", "email": "joao@email.com", ... },
  { "id": 8, "name": "Maria", "email": "maria@email.com", ... }
]
```

### Ver estatísticas de um usuário
```bash
GET /api/follows/5/stats?currentUserId=1
Response: {
  "userId": 5,
  "name": "João",
  "followingCount": 10,    // João segue 10 pessoas
  "followersCount": 150,   // João tem 150 seguidores
  "isFollowing": true      // Eu (userId=1) sigo o João
}
```

### Verificar se sigo alguém
```bash
GET /api/follows/check?followerId=1&followingId=5
Response: {
  "isFollowing": true
}
```

## 🔧 Configuração

### RedisConfig atualizado
O `RedisConfig` foi atualizado para registrar o listener:
```java
@Bean
public RedisMessageListenerContainer redisMessageListenerContainer(
        RedisConnectionFactory connectionFactory,
        RedisFollowSyncListener followSyncListener) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);
    container.addMessageListener(followSyncListener, new ChannelTopic("follow:sync"));
    return container;
}
```

### Dependências Redis
Já existentes no projeto:
- `spring-boot-starter-data-redis`
- `jedis` (cliente Redis)

## 🗄️ Migração de Banco de Dados

Será necessário criar a tabela `follows`:
```sql
CREATE TABLE follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id),
    following_id BIGINT NOT NULL REFERENCES users(id),
    followed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT check_not_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

## 📈 Complexidade

### Operações AVL Tree
- Inserção: **O(log n)**
- Remoção: **O(log n)**
- Busca por ID: **O(log n)**
- Travessia in-order: **O(n)**

### Busca por Relacionamento
- `findByFollowerId()`: **O(n)** - filtra in-order traversal
- `findByFollowingId()`: **O(n)** - filtra in-order traversal
- `isFollowing()`: **O(n)** no pior caso

### Otimização Futura
Para melhorar buscas por followerId/followingId, considere:
- Manter duas árvores: uma indexada por followerId, outra por followingId
- Usar HashMap auxiliar para lookup O(1)

## ✅ Compilação

**BUILD SUCCESS** ✅  
71 arquivos compilados sem erros!

## 🚀 Próximos Passos

1. Executar migração SQL para criar tabela `follows`
2. Testar endpoints com Postman/curl
3. Monitorar Redis para verificar mensagens de sync
4. (Opcional) Criar testes unitários
5. (Opcional) Adicionar paginação em `/following` e `/followers`
