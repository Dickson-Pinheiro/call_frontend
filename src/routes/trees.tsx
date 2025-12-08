import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import Tree from 'react-d3-tree';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAllTrees } from '@/services';
import type { TreeType, TreeNode, TreeStructure } from '@/services';
import { Database, GitBranch, Users, Phone, MessageSquare, Star, TrendingUp } from 'lucide-react';

export const Route = createFileRoute('/trees')({
  component: TreesPage,
});

// Transform AVL tree structure to react-d3-tree format
interface D3TreeNode {
  name: string;
  attributes?: Record<string, string | number>;
  children?: D3TreeNode[];
}

function transformToD3Tree(structure: TreeStructure): D3TreeNode | null {
  if (structure.isEmpty || structure.nodes.length === 0) {
    return {
      name: 'Empty Tree',
      attributes: { info: 'No nodes in tree' },
    };
  }

  // Create a map of nodes by key for easy lookup
  const nodeMap = new Map<number, TreeNode>();
  structure.nodes.forEach(node => {
    nodeMap.set(node.key, node);
  });

  // Find the root node (parentKey === null)
  const rootNode = structure.nodes.find(node => node.parentKey === null);
  if (!rootNode) {
    return {
      name: 'Error',
      attributes: { error: 'No root node found' },
    };
  }

  // Recursively build the tree
  function buildNode(node: TreeNode): D3TreeNode {
    const children: D3TreeNode[] = [];

    // Add left child
    if (node.leftChildKey !== null) {
      const leftChild = nodeMap.get(node.leftChildKey);
      if (leftChild) {
        children.push(buildNode(leftChild));
      }
    }

    // Add right child
    if (node.rightChildKey !== null) {
      const rightChild = nodeMap.get(node.rightChildKey);
      if (rightChild) {
        children.push(buildNode(rightChild));
      }
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

const treeIcons: Record<TreeType, React.ReactNode> = {
  users: <Users className="w-5 h-5" />,
  calls: <Phone className="w-5 h-5" />,
  messages: <MessageSquare className="w-5 h-5" />,
  ratings: <Star className="w-5 h-5" />,
  follows: <TrendingUp className="w-5 h-5" />,
};

const treeLabels: Record<TreeType, string> = {
  users: 'User Tree',
  calls: 'Call Tree',
  messages: 'Message Tree',
  ratings: 'Rating Tree',
  follows: 'Follow Tree',
};

function TreesPage() {
  const [selectedTree, setSelectedTree] = useState<TreeType>('users');
  const { data: allTrees, isLoading, error } = useAllTrees();

  // Get the selected tree structure
  const currentTree: TreeStructure | undefined = allTrees
    ? allTrees[`${selectedTree === 'users' ? 'user' : selectedTree === 'calls' ? 'call' : selectedTree === 'messages' ? 'chatMessage' : selectedTree === 'ratings' ? 'callRating' : 'follow'}Tree`]
    : undefined;

  const d3Tree = currentTree ? transformToD3Tree(currentTree) : null;

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-100 via-blue-50 to-pink-100 dark:from-gray-950 dark:via-purple-950 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Database className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AVL Tree Visualization
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the internal structure of AVL trees used in the backend
          </p>
        </div>

        {/* Tree Selector */}
        <Card className="p-4 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
          <div className="flex flex-wrap gap-2 justify-center">
            {(Object.keys(treeLabels) as TreeType[]).map((treeType) => (
              <Button
                key={treeType}
                variant={selectedTree === treeType ? 'default' : 'outline'}
                className={`gap-2 ${
                  selectedTree === treeType
                    ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white'
                    : ''
                }`}
                onClick={() => setSelectedTree(treeType)}
              >
                {treeIcons[treeType]}
                {treeLabels[treeType]}
              </Button>
            ))}
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-8 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 backdrop-blur-sm bg-red-50/70 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="font-semibold">Error loading tree data</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Tree Statistics */}
        {currentTree && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Nodes</p>
                <p className="text-2xl font-bold text-purple-600">{currentTree.totalNodes}</p>
              </div>
            </Card>
            <Card className="p-4 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tree Height</p>
                <p className="text-2xl font-bold text-blue-600">{currentTree.treeHeight}</p>
              </div>
            </Card>
            <Card className="p-4 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <Badge variant={currentTree.isEmpty ? 'secondary' : 'default'} className="text-base">
                  {currentTree.isEmpty ? 'Empty' : 'Active'}
                </Badge>
              </div>
            </Card>
            <Card className="p-4 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Balanced</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {currentTree.nodes.every(n => Math.abs(n.balanceFactor) <= 1) ? 'Yes' : 'No'}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tree Visualization */}
        {d3Tree && !isLoading && (
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="h-[600px] w-full">
              <Tree
                data={d3Tree}
                orientation="vertical"
                pathFunc="step"
                translate={{ x: 400, y: 50 }}
                separation={{ siblings: 2, nonSiblings: 2 }}
                nodeSize={{ x: 200, y: 150 }}
                enableLegacyTransitions
                transitionDuration={500}
                pathClassFunc={() => 'stroke-purple-600 stroke-2'}
                renderCustomNodeElement={(rd3tProps) => {
                  const isBalanced = rd3tProps.nodeDatum.attributes?.Balanced === 'Yes';
                  const fillColor = isBalanced ? '#10b981' : '#ef4444';
                  
                  return (
                    <g>
                      <circle
                        r={30}
                        fill={fillColor}
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        onClick={rd3tProps.toggleNode}
                        style={{ cursor: 'pointer' }}
                      />
                      <text
                        fill="white"
                        strokeWidth="0"
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {rd3tProps.nodeDatum.name}
                      </text>
                      {rd3tProps.nodeDatum.attributes && (
                        <text
                          fill="#4b5563"
                          strokeWidth="0"
                          x="0"
                          y="50"
                          textAnchor="middle"
                          fontSize="10"
                        >
                          H: {rd3tProps.nodeDatum.attributes.Height} | BF: {rd3tProps.nodeDatum.attributes['Balance Factor']}
                        </text>
                      )}
                    </g>
                  );
                }}
              />
            </div>
          </Card>
        )}

        {/* Traversals */}
        {currentTree && !currentTree.isEmpty && (
          <Card className="p-6 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                Tree Traversals
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">In-Order</h3>
                  <p className="text-sm font-mono bg-purple-50 dark:bg-purple-950/50 p-2 rounded">
                    {currentTree.inOrderTraversal.join(', ')}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Pre-Order</h3>
                  <p className="text-sm font-mono bg-blue-50 dark:bg-blue-950/50 p-2 rounded">
                    {currentTree.preOrderTraversal.join(', ')}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Post-Order</h3>
                  <p className="text-sm font-mono bg-pink-50 dark:bg-pink-950/50 p-2 rounded">
                    {currentTree.postOrderTraversal.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Legend */}
        <Card className="p-4 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-purple-200 dark:border-purple-800">
          <div className="flex flex-wrap gap-6 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-purple-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Balanced Node (BF: -1, 0, 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-purple-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Unbalanced Node (|BF| &gt; 1)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
