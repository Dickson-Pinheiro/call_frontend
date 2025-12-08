export interface TreeNode {
  key: number;
  data: {
    type: string;
    toString: string;
  };
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

export interface AllTreesResponse {
  userTree: TreeStructure;
  callTree: TreeStructure;
  chatMessageTree: TreeStructure;
  callRatingTree: TreeStructure;
  followTree: TreeStructure;
  timestamp: string;
}

export type TreeType = 'users' | 'calls' | 'messages' | 'ratings' | 'follows';
