// Canonical shape of a node in the binary network tree, as returned by
// buildTreeForUser (backend/src/services/treeService.js) via /api/referrals/*.
export type TreeNodeData = {
    id: string
    name?: string
    firstName?: string
    username?: string
    position?: string
    referredBy?: string
    hasPurchased?: boolean
    leftMemberCount?: number
    rightMemberCount?: number
    walletBalance?: number
    createdAt?: string
    left?: TreeNodeData | null
    right?: TreeNodeData | null
}
