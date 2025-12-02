# Sistema de Avaliações - RandomCall

## Visão Geral

O sistema de avaliações permite que os usuários avaliem suas chamadas de vídeo com uma nota de 1 a 5 estrelas e um comentário opcional. A implementação segue o padrão estabelecido no projeto, utilizando React Query para gerenciamento de estado do servidor e componentes reutilizáveis.

## Arquitetura

### 1. Camada de Dados (`/src/services`)

#### **Types** (`/src/services/types/rating.types.ts`)
```typescript
interface Rating {
  id: number;
  callId: number;
  raterId: number;
  raterName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

interface CreateRatingRequest {
  callId: number;
  raterId: number;
  rating: number;
  comment?: string;
}

interface UpdateRatingRequest {
  rating: number;
  comment?: string;
}
```

#### **Service** (`/src/services/ratingService.ts`)
Factory service com 8 métodos:

**Queries:**
- `createRating(data)` - POST `/api/ratings`
- `getRatingById(id)` - GET `/api/ratings/{id}`
- `getAllRatings()` - GET `/api/ratings`
- `getRatingsByMinRating(rating)` - GET `/api/ratings/min-rating/{rating}`
- `getTopRatings()` - GET `/api/ratings/top`
- `getPositiveRatings()` - GET `/api/ratings/positive`

**Mutations:**
- `updateRating(id, data)` - PUT `/api/ratings/{id}`
- `deleteRating(id)` - DELETE `/api/ratings/{id}`

#### **Hooks** (`/src/services/hooks/useRatings.ts`)
React Query hooks para todas as operações:

**Query Hooks:**
- `useRating(id)` - Busca avaliação específica
- `useRatings()` - Busca todas as avaliações do usuário
- `useRatingsByMinRating(rating)` - Filtra por nota mínima
- `useTopRatings()` - Avaliações 4-5 estrelas
- `usePositiveRatings()` - Avaliações 3+ estrelas

**Mutation Hooks:**
- `useCreateRating()` - Cria nova avaliação
- `useUpdateRating()` - Atualiza avaliação existente
- `useDeleteRating()` - Remove avaliação

**Cache Management:**
```typescript
export const ratingKeys = {
  all: ['ratings'] as const,
  lists: () => [...ratingKeys.all, 'list'] as const,
  list: (filters: string) => [...ratingKeys.lists(), { filters }] as const,
  details: () => [...ratingKeys.all, 'detail'] as const,
  detail: (id: number) => [...ratingKeys.details(), id] as const,
}
```

**Auto-invalidação:**
- Ao criar/atualizar/deletar uma avaliação:
  - Invalida cache de `ratings` (recarrega lista de avaliações)
  - Invalida cache de `calls` (atualiza contadores e estatísticas)

### 2. Camada de Componentes (`/src/components`)

#### **RatingDialog** (`/src/components/RatingDialog.tsx`)
Dialog para criar ou editar avaliações.

**Props:**
```typescript
interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: number;
  userId: number;
  existingRating?: Rating; // Se presente, modo edição
}
```

**Funcionalidades:**
- Seleção de 1-5 estrelas com hover
- Campo de comentário (opcional, máx 500 caracteres)
- Labels descritivos: "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"
- Detecção automática de modo (criar vs editar)
- Validação: obriga seleção de pelo menos 1 estrela
- Loading state durante envio
- Toast notifications (sucesso/erro)

#### **RatingDisplay** (`/src/components/RatingDisplay.tsx`)
Componente para exibir avaliações existentes.

**Props:**
```typescript
interface RatingDisplayProps {
  rating: Rating;
  compact?: boolean; // Modo compacto ou completo
}
```

**Modos:**
- **Compact**: Apenas estrelas + nota numérica (para listas)
- **Full**: Estrelas + nota + comentário + data de criação

#### **ViewRatingDialog** (`/src/components/ViewRatingDialog.tsx`)
Dialog para visualizar detalhes completos de uma avaliação.

**Props:**
```typescript
interface ViewRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: Rating;
  onEdit?: () => void; // Callback para abrir modo edição
}
```

**Funcionalidades:**
- Exibição completa da avaliação (usa `RatingDisplay`)
- Botão "Editar" (abre `RatingDialog` em modo edição)
- Botão "Excluir" (com confirmação via AlertDialog)
- Proteção contra exclusão acidental

### 3. Integração na Página de Histórico (`/src/routes/app/history.tsx`)

#### **Estados Gerenciados:**
```typescript
const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
const [viewRatingDialogOpen, setViewRatingDialogOpen] = useState(false);
const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
```

#### **Funções Auxiliares:**
```typescript
// Busca avaliação do usuário para uma chamada
const getRatingForCall = (callId: number) => {
  return ratings?.find(r => r.callId === callId && r.raterId === currentUserId);
};

// Abre dialog de avaliação (criar/editar)
const handleOpenRatingDialog = (callId: number) => {
  setSelectedCallId(callId);
  setRatingDialogOpen(true);
};

// Abre dialog de visualização
const handleViewRating = (callId: number) => {
  setSelectedCallId(callId);
  setViewRatingDialogOpen(true);
};
```

#### **Exibição por Chamada:**

Cada chamada no histórico mostra:

**Se não avaliada:**
```tsx
<Button variant="outline" onClick={() => handleOpenRatingDialog(call.id)}>
  <Star className="w-4 h-4" />
  Avaliar
</Button>
```

**Se já avaliada:**
```tsx
<RatingDisplay rating={existingRating} compact />
{existingRating.comment && (
  <Button onClick={() => handleViewRating(call.id)}>
    <MessageSquare className="w-3 h-3" />
  </Button>
)}
<Button onClick={() => handleOpenRatingDialog(call.id)}>
  <Edit2 className="w-4 h-4" />
</Button>
```

#### **Estatísticas:**
Card de "Avaliação média" no topo da página:
```typescript
const averageRating = useMemo(() => {
  if (!ratings || ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return (sum / ratings.length).toFixed(1);
}, [ratings]);
```

## Fluxo de Uso

### 1. Criar Avaliação
1. Usuário clica em "Avaliar" na chamada
2. `RatingDialog` abre em modo criação
3. Usuário seleciona estrelas (1-5) e opcionalmente adiciona comentário
4. Ao clicar "Enviar Avaliação":
   - `useCreateRating` envia POST para `/api/ratings`
   - Toast de sucesso/erro
   - Dialog fecha
   - Cache de `ratings` e `calls` é invalidado
   - UI atualiza automaticamente

### 2. Visualizar Avaliação
1. Usuário clica no ícone de mensagem (se houver comentário)
2. `ViewRatingDialog` abre mostrando detalhes completos
3. Opções:
   - "Editar" → abre `RatingDialog` em modo edição
   - "Excluir" → abre `AlertDialog` de confirmação
   - "Fechar" → fecha o dialog

### 3. Editar Avaliação
1. Usuário clica no ícone de edição ou "Editar" no ViewDialog
2. `RatingDialog` abre em modo edição com valores preenchidos
3. Usuário modifica estrelas/comentário
4. Ao clicar "Atualizar Avaliação":
   - `useUpdateRating` envia PUT para `/api/ratings/{id}`
   - Toast de sucesso/erro
   - Dialog fecha
   - Cache invalidado
   - UI atualiza

### 4. Excluir Avaliação
1. Usuário clica "Excluir" no `ViewRatingDialog`
2. `AlertDialog` pede confirmação
3. Se confirmar:
   - `useDeleteRating` envia DELETE para `/api/ratings/{id}`
   - Toast de sucesso/erro
   - Ambos os dialogs fecham
   - Cache invalidado
   - UI atualiza (botão "Avaliar" reaparece)

## Validações

### Client-side:
- Rating obrigatório (1-5 estrelas)
- Comentário opcional (máx 500 caracteres)
- Contador de caracteres em tempo real

### Server-side (esperado pela API):
- Usuário deve ter participado da chamada
- Chamada deve estar finalizada
- Rating entre 1 e 5

## Feedback ao Usuário

### Toast Notifications (Sonner):
- ✅ "Avaliação enviada com sucesso!"
- ✅ "Avaliação atualizada com sucesso!"
- ✅ "Avaliação excluída com sucesso!"
- ❌ "Selecione uma avaliação de 1 a 5 estrelas"
- ❌ "Erro ao enviar avaliação. Tente novamente."

### Loading States:
- Botões desabilitados durante mutações
- Texto muda para "Enviando..." durante operações
- Dialog não pode ser fechado durante operações

### Visual Feedback:
- Estrelas mudam de cor no hover
- Escala aumenta no hover (transform: scale(1.1))
- Labels descritivos para cada nota
- Contador de caracteres do comentário

## Cache Strategy

### Invalidação em Cascata:
Quando uma avaliação é criada/atualizada/deletada:

1. **Invalida `ratings`**: Recarrega todas as avaliações
   - Atualiza lista no histórico
   - Recalcula média

2. **Invalida `calls`**: Recarrega chamadas
   - Permite futuras features (ex: mostrar se chamada foi avaliada)
   - Mantém consistência de dados

### Queries Condicionais:
```typescript
useRating(id, { enabled: !!id })
```
Só executa query se ID estiver presente.

## Acessibilidade

- Labels apropriados em botões: `aria-label="Avaliar com X estrelas"`
- Navegação por teclado funcional em todos os dialogs
- Foco automático em campos relevantes
- Contraste adequado de cores
- Tamanhos de toque adequados (min 44x44px)

## Responsive Design

- Dialogs adaptam tamanho em mobile (`sm:max-w-[425px]`)
- Layout de botões ajusta em telas pequenas
- Estrelas mantêm tamanho adequado em todos os breakpoints
- Grid de estatísticas responsivo (3 colunas → stack em mobile)

## Próximas Melhorias Sugeridas

1. **Filtros avançados no histórico:**
   - Filtrar por avaliação mínima
   - Ver apenas chamadas não avaliadas
   - Ordenar por nota

2. **Estatísticas expandidas:**
   - Distribuição de notas (gráfico)
   - Tendência de satisfação ao longo do tempo
   - Comparação com média global

3. **Notificações:**
   - Lembrete para avaliar chamadas antigas não avaliadas
   - Badge de "novas chamadas para avaliar"

4. **Edição inline:**
   - Quick rating (estrelas direto na lista) sem abrir dialog
   - Adicionar comentário depois

5. **Moderação:**
   - Reportar avaliações abusivas
   - Sistema de verificação de avaliações

## Notas de Implementação

- ✅ Sem erros de TypeScript
- ✅ Seguindo padrões do projeto (factory services, React Query)
- ✅ Reutilização de componentes UI (Button, Dialog, Textarea)
- ✅ Consistência com design system (glass effects, cores)
- ✅ TODO: Integração com AuthContext quando implementado (atualmente usa `currentUserId = 1`)
- ✅ Compilação bem-sucedida (`npm run build`)

## Dependências Utilizadas

- `@tanstack/react-query` - Gerenciamento de estado do servidor
- `sonner` - Toast notifications
- `lucide-react` - Ícones (Star, Edit2, MessageSquare, Trash2)
- Radix UI - Componentes base (Dialog, AlertDialog)
- Tailwind CSS - Estilização
