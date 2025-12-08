# API Pública de Visualização de Árvores AVL

## 📋 Visão Geral

API REST pública para visualizar a estrutura interna das árvores AVL (Adelson-Velsky e Landis) utilizadas no sistema para armazenamento em memória de alta performance. Todas as rotas são **públicas** e não requerem autenticação.

## 🌐 Base URL

**Produção:** `https://call-backend.fly.dev/api/public/trees`  
**Local:** `http://localhost:8080/api/public/trees`

## 🔗 Endpoints

### 1. Visualizar Todas as Árvores
```http
GET /api/public/trees
```

Retorna a estrutura completa de todas as 5 árvores AVL do sistema.

**Response:**
```json
{
  "userTree": { ... },
  "callTree": { ... },
  "chatMessageTree": { ... },
  "callRatingTree": { ... },
  "followTree": { ... },
  "timestamp": "2025-12-08T14:30:00"
}
```

---

### 2. Árvore de Usuários
```http
GET /api/public/trees/users
```

Visualiza a estrutura da árvore de usuários (indexada por ID).

**Exemplo de Response:**
```json
{
  "treeName": "UserTree",
  "totalNodes": 150,
  "treeHeight": 8,
  "isEmpty": false,
  "nodes": [
    {
      "key": 10,
      "data": {
        "type": "UserEntity",
        "toString": "UserEntity(id=10, name=João Silva, email=joao@email.com)"
      },
      "parentKey": 5,
      "leftChildKey": 7,
      "rightChildKey": 15,
      "height": 3,
      "balanceFactor": 0
    }
  ],
  "inOrderTraversal": [1, 2, 3, 5, 7, 10, 15, 20, ...],
  "preOrderTraversal": [10, 5, 2, 1, 3, 7, 15, 20, ...],
  "postOrderTraversal": [1, 3, 2, 7, 5, 20, 15, 10, ...]
}
```

---

### 3. Árvore de Chamadas
```http
GET /api/public/trees/calls
```

Visualiza a estrutura da árvore de chamadas (vídeo/áudio).

**Dados:** CallEntity com informações de user1, user2, tipo, duração, status.

---

### 4. Árvore de Mensagens de Chat
```http
GET /api/public/trees/messages
```

Visualiza a estrutura da árvore de mensagens de chat.

**Dados:** ChatMessageEntity com sender, call, texto, timestamp.

---

### 5. Árvore de Avaliações
```http
GET /api/public/trees/ratings
```

Visualiza a estrutura da árvore de avaliações de chamadas.

**Dados:** CallRatingEntity com rating (1-5), comentário, rater, call.

---

### 6. Árvore de Seguir/Seguidores
```http
GET /api/public/trees/follows
```

Visualiza a estrutura da árvore de relacionamentos follow.

**Dados:** FollowEntity com follower, following, followedAt.

---

## 📊 Estrutura da Resposta

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `treeName` | string | Nome identificador da árvore |
| `totalNodes` | integer | Número total de nós na árvore |
| `treeHeight` | integer | Altura máxima da árvore |
| `isEmpty` | boolean | Se a árvore está vazia |
| `nodes` | array | Lista de todos os nós com detalhes |
| `inOrderTraversal` | array | Percurso em-ordem (E-R-D) |
| `preOrderTraversal` | array | Percurso pré-ordem (R-E-D) |
| `postOrderTraversal` | array | Percurso pós-ordem (E-D-R) |

### Estrutura de um Nó

```json
{
  "key": 42,
  "data": {
    "type": "UserEntity",
    "toString": "UserEntity(id=42, name=...)"
  },
  "parentKey": 20,
  "leftChildKey": 30,
  "rightChildKey": 50,
  "height": 4,
  "balanceFactor": 1
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `key` | long | Chave única do nó (geralmente o ID da entidade) |
| `data` | object | Dados simplificados do nó |
| `parentKey` | long/null | Chave do nó pai (null se for raiz) |
| `leftChildKey` | long/null | Chave do filho esquerdo |
| `rightChildKey` | long/null | Chave do filho direito |
| `height` | integer | Altura do nó (folhas = 1) |
| `balanceFactor` | integer | leftHeight - rightHeight |

### Fator de Balanceamento

- **-1, 0, 1**: Árvore balanceada ✅
- **< -1 ou > 1**: Necessita rotação (não deve ocorrer em AVL)

O fator de balanceamento indica se a árvore está pendendo para a esquerda (positivo) ou direita (negativo).

---

## 🔍 Tipos de Percurso (Traversal)

### In-Order (Em-Ordem)
**Ordem:** Esquerda → Raiz → Direita  
**Resultado:** Valores ordenados crescentemente  
**Uso:** Listar dados em ordem

### Pre-Order (Pré-Ordem)
**Ordem:** Raiz → Esquerda → Direita  
**Resultado:** Raiz aparece primeiro  
**Uso:** Copiar estrutura da árvore

### Post-Order (Pós-Ordem)
**Ordem:** Esquerda → Direita → Raiz  
**Resultado:** Raiz aparece por último  
**Uso:** Deletar árvore

---

## 🎯 Casos de Uso

### 1. Verificar Balanceamento
```bash
curl https://call-backend.fly.dev/api/public/trees/users | jq '.nodes[] | select(.balanceFactor > 1 or .balanceFactor < -1)'
```
Deve retornar vazio se a árvore está balanceada.

### 2. Encontrar Raiz da Árvore
```bash
curl https://call-backend.fly.dev/api/public/trees/users | jq '.nodes[] | select(.parentKey == null)'
```

### 3. Contar Nós Folha
```bash
curl https://call-backend.fly.dev/api/public/trees/users | jq '.nodes[] | select(.leftChildKey == null and .rightChildKey == null) | .key'
```

### 4. Visualizar Altura da Árvore
```bash
curl https://call-backend.fly.dev/api/public/trees | jq '{
  users: .userTree.treeHeight,
  calls: .callTree.treeHeight,
  messages: .chatMessageTree.treeHeight,
  ratings: .callRatingTree.treeHeight,
  follows: .followTree.treeHeight
}'
```

### 5. Comparar Tamanhos
```bash
curl https://call-backend.fly.dev/api/public/trees | jq '{
  users: .userTree.totalNodes,
  calls: .callTree.totalNodes,
  messages: .chatMessageTree.totalNodes,
  ratings: .callRatingTree.totalNodes,
  follows: .followTree.totalNodes
}'
```

---

## 📈 Complexidade de Operações AVL

| Operação | Complexidade | Descrição |
|----------|-------------|-----------|
| Busca | **O(log n)** | Busca binária balanceada |
| Inserção | **O(log n)** | Com rotações de balanceamento |
| Remoção | **O(log n)** | Com rotações de balanceamento |
| Percurso | **O(n)** | Visita todos os nós |

Onde **n** = número de nós na árvore.

---

## 🌳 Propriedades da Árvore AVL

1. **Árvore Binária de Busca**: Filho esquerdo < Raiz < Filho direito
2. **Balanceamento**: |altura(esquerda) - altura(direita)| ≤ 1
3. **Altura**: O(log n) para n nós
4. **Auto-balanceamento**: Rotações automáticas após inserção/remoção

### Tipos de Rotação

- **Rotação Simples à Direita**: Caso Esquerda-Esquerda
- **Rotação Simples à Esquerda**: Caso Direita-Direita
- **Rotação Dupla E-D**: Caso Esquerda-Direita
- **Rotação Dupla D-E**: Caso Direita-Esquerda

---

## 🔧 Exemplos de Uso

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function getAllTrees() {
  const response = await axios.get('https://call-backend.fly.dev/api/public/trees');
  console.log('Total de usuários:', response.data.userTree.totalNodes);
  console.log('Altura da árvore de follows:', response.data.followTree.treeHeight);
}
```

### Python
```python
import requests

response = requests.get('https://call-backend.fly.dev/api/public/trees/users')
tree = response.json()

print(f"Total de nós: {tree['totalNodes']}")
print(f"Altura da árvore: {tree['treeHeight']}")
print(f"Raiz: {next(n for n in tree['nodes'] if n['parentKey'] is None)}")
```

### cURL
```bash
# Ver todas as árvores
curl -s https://call-backend.fly.dev/api/public/trees | jq '.'

# Ver apenas usuários
curl -s https://call-backend.fly.dev/api/public/trees/users | jq '.'

# Estatísticas rápidas
curl -s https://call-backend.fly.dev/api/public/trees/follows | jq '{
  total: .totalNodes,
  altura: .treeHeight,
  vazia: .isEmpty
}'
```

---

## 🎓 Conceitos Educacionais

Esta API é útil para:
- **Ensino de Estruturas de Dados**: Visualizar AVL em ação
- **Debugging**: Verificar estado da árvore em produção
- **Análise de Performance**: Verificar se altura está O(log n)
- **Validação**: Confirmar propriedades AVL (balanceamento)

### Verificar se é AVL Válida

Uma AVL válida deve:
1. ✅ Todo `balanceFactor` entre -1 e 1
2. ✅ Para cada nó: `leftChild.key < node.key < rightChild.key`
3. ✅ `height(node) = 1 + max(height(left), height(right))`
4. ✅ Árvore conectada (todos nós alcançáveis da raiz)

---

## 🚀 Performance

- **Latência**: ~50-200ms (depende da conexão e tamanho das árvores)
- **Cache**: Sem cache (dados em tempo real)
- **Rate Limit**: Nenhum (rota pública)
- **Tamanho da Response**: Proporcional ao número de nós

---

## 🔒 Segurança

- **Autenticação**: Não requerida (rota pública)
- **CORS**: Habilitado para todos os domínios
- **Dados Sensíveis**: Senhas não são expostas (hash omitido)
- **Recomendação**: Dados são simplificados para evitar vazamento de informações

---

## 📝 Notas Importantes

1. **Dados Simplificados**: A propriedade `data` mostra apenas tipo e toString, não o objeto completo
2. **Snapshot**: Os dados refletem o estado no momento da requisição
3. **Performance**: Árvores grandes podem demorar mais para serializar
4. **Sincronização**: Em sistemas distribuídos, árvores são sincronizadas via Redis

---

## 🐛 Troubleshooting

### Árvore Vazia
```json
{
  "treeName": "UserTree",
  "totalNodes": 0,
  "treeHeight": 0,
  "isEmpty": true,
  "nodes": [],
  "inOrderTraversal": [],
  "preOrderTraversal": [],
  "postOrderTraversal": []
}
```

### Balanceamento Incorreto
Se algum nó tiver `|balanceFactor| > 1`, há um bug na implementação AVL.

---

## 📞 Suporte

Para dúvidas sobre estruturas de dados AVL ou sobre a API:
- **Documentação AVL**: Wikipedia - AVL Tree
- **Repository**: github.com/Dickson-Pinheiro/call_backend
- **Issues**: Reporte bugs ou solicite features

---

## 🎉 Exemplo Completo: Visualizar Estrutura

```bash
#!/bin/bash

echo "=== Estrutura das Árvores AVL ==="
echo ""

curl -s https://call-backend.fly.dev/api/public/trees | jq '{
  resumo: {
    users: {
      total: .userTree.totalNodes,
      altura: .userTree.treeHeight
    },
    calls: {
      total: .callTree.totalNodes,
      altura: .callTree.treeHeight
    },
    messages: {
      total: .chatMessageTree.totalNodes,
      altura: .chatMessageTree.treeHeight
    },
    ratings: {
      total: .callRatingTree.totalNodes,
      altura: .callRatingTree.treeHeight
    },
    follows: {
      total: .followTree.totalNodes,
      altura: .followTree.treeHeight
    }
  },
  timestamp: .timestamp
}'
```

---

**Última atualização:** 8 de dezembro de 2025  
**Versão da API:** 1.0  
**Disponibilidade:** 99.9% (hospedado no Fly.io)
