# Tree Visualization Feature

## Overview

This feature provides an interactive visualization of the 5 AVL trees used in the backend to store application data. The visualization is publicly accessible and displays the tree structure, node properties, balance factors, and traversals.

## Access

The tree visualization page can be accessed at `/trees` and is available from the main navigation menu (desktop and mobile).

## Features

### Tree Types

The application visualizes 5 different AVL trees:

1. **User Tree** - Stores user account information
2. **Call Tree** - Stores call records and metadata
3. **Message Tree** - Stores chat messages from calls
4. **Rating Tree** - Stores call ratings and reviews
5. **Follow Tree** - Stores follow relationships between users

### Visualization

- **Interactive Tree Display**: Powered by `react-d3-tree` library
- **Node Colors**: 
  - 🟢 Green nodes = Balanced (Balance Factor: -1, 0, or 1)
  - 🔴 Red nodes = Unbalanced (|Balance Factor| > 1)
- **Node Information**:
  - Key (unique identifier)
  - Height
  - Balance Factor
  - Data (string representation)
- **Pan and Zoom**: Navigate large trees easily
- **Click to Expand/Collapse**: Manage complex tree structures

### Statistics Panel

Each tree displays:
- **Total Nodes**: Number of nodes in the tree
- **Tree Height**: Maximum depth from root to leaf
- **Status**: Active or Empty
- **Balanced**: Whether all nodes maintain AVL balance property

### Traversals

The page displays three standard tree traversals:
- **In-Order Traversal**: Left → Root → Right (sorted order for AVL trees)
- **Pre-Order Traversal**: Root → Left → Right
- **Post-Order Traversal**: Left → Right → Root

## Implementation

### Service Layer

#### Types (`/src/services/types/tree.types.ts`)
```typescript
export interface TreeNode {
  key: number;
  data: { type: string; toString: string };
  parentKey: number | null;
  leftChildKey: number | null;
  rightChildKey: number | null;
  height: number;
  balanceFactor: number;
}

export interface TreeStructure {
  treeName: string;
  totalNodes: number;
  treeHeight: number;
  isEmpty: boolean;
  nodes: TreeNode[];
  inOrderTraversal: number[];
  preOrderTraversal: number[];
  postOrderTraversal: number[];
}

export type TreeType = 'users' | 'calls' | 'messages' | 'ratings' | 'follows';
```

#### Service (`/src/services/treeService.ts`)
```typescript
// Public API endpoints (no authentication required)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const treeService = {
  getAllTrees: () => axios.get<AllTreesResponse>(`${BASE_URL}/api/public/trees`),
  getTreeByType: (type: TreeType) => axios.get<TreeStructure>(`${BASE_URL}/api/public/trees/${type}`)
};
```

#### Hooks (`/src/services/hooks/useTrees.ts`)
```typescript
// React Query hooks with caching
export const useAllTrees = () => {
  return useQuery({
    queryKey: treeKeys.all,
    queryFn: () => treeService.getAllTrees().then((res) => res.data),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useTreeByType = (type: TreeType) => {
  return useQuery({
    queryKey: treeKeys.byType(type),
    queryFn: () => treeService.getTreeByType(type).then((res) => res.data),
    staleTime: 1000 * 60,
  });
};
```

### UI Component

#### Page (`/src/routes/trees.tsx`)

The page component includes:
1. **Tree Selector**: Buttons to switch between the 5 tree types
2. **Statistics Cards**: Display tree metrics
3. **D3 Tree Visualization**: Interactive tree diagram
4. **Traversal Display**: Shows all three traversal orders
5. **Legend**: Explains node colors

#### Data Transformation

AVL tree structure is transformed to D3 hierarchical format:

```typescript
function transformToD3Tree(structure: TreeStructure): D3TreeNode | null {
  // Find root node (parentKey === null)
  const rootNode = structure.nodes.find(node => node.parentKey === null);
  
  // Recursively build tree
  function buildNode(node: TreeNode): D3TreeNode {
    const children: D3TreeNode[] = [];
    
    // Add left child
    if (node.leftChildKey !== null) {
      const leftChild = nodeMap.get(node.leftChildKey);
      if (leftChild) children.push(buildNode(leftChild));
    }
    
    // Add right child
    if (node.rightChildKey !== null) {
      const rightChild = nodeMap.get(node.rightChildKey);
      if (rightChild) children.push(buildNode(rightChild));
    }
    
    return {
      name: `${node.key}`,
      attributes: {
        Data: node.data.toString,
        Height: node.height,
        'Balance Factor': node.balanceFactor,
        Balanced: Math.abs(node.balanceFactor) <= 1 ? 'Yes' : 'No',
      },
      children: children.length > 0 ? children : undefined,
    };
  }
  
  return buildNode(rootNode);
}
```

## Design

The visualization follows the application's glass morphism aesthetic:

- **Background**: Purple to blue gradient
- **Cards**: Frosted glass effect with backdrop blur
- **Colors**: Purple and blue theme matching the app
- **Typography**: Clear hierarchy with gradient text for headers
- **Responsive**: Works on mobile and desktop

## API Documentation

For complete API documentation, see [TREE_VISUALIZATION_API.md](./TREE_VISUALIZATION_API.md).

### Public Endpoints

- `GET /api/public/trees` - Get all trees
- `GET /api/public/trees/{type}` - Get specific tree
  - Types: `users`, `calls`, `messages`, `ratings`, `follows`

### Response Format

```json
{
  "userTree": {
    "treeName": "UserTree",
    "totalNodes": 15,
    "treeHeight": 4,
    "isEmpty": false,
    "nodes": [
      {
        "key": 100,
        "data": { "type": "User", "toString": "user@example.com" },
        "parentKey": null,
        "leftChildKey": 50,
        "rightChildKey": 150,
        "height": 3,
        "balanceFactor": 0
      }
    ],
    "inOrderTraversal": [10, 20, 50, 100, 150],
    "preOrderTraversal": [100, 50, 20, 10, 150],
    "postOrderTraversal": [10, 20, 50, 150, 100]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Educational Value

This feature serves multiple purposes:

1. **Learning Tool**: Visualize how AVL trees maintain balance
2. **Debugging**: Inspect tree structure and balance factors
3. **Performance Insights**: See tree heights and node distributions
4. **Algorithm Understanding**: Observe how rotations maintain O(log n) performance

## Dependencies

- **react-d3-tree**: Interactive tree visualization library
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Styling and layout
- **shadcn/ui**: UI components

## Future Enhancements

Potential improvements:
- Real-time updates via WebSocket
- Tree rotation animations
- Node insertion/deletion visualization
- Performance metrics (search time, rotation count)
- Export tree as image
- Compare before/after rotations
- Highlight specific nodes or paths
