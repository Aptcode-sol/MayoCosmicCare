import api from '../api';

export const getNetworkTree = (rootId, depth = 3) =>
    api.get(`/api/admin/analytics/network${rootId ? `?rootId=${rootId}&depth=${depth}` : `?depth=${depth}`}`).then(r => r.data);

export const getNetworkSubtree = (userId, depth = 3) =>
    api.get(`/api/admin/analytics/network/${userId}?depth=${depth}`).then(r => r.data);

export const getNetworkSummary = () =>
    api.get('/api/admin/analytics/network/summary').then(r => r.data);

export const searchNetwork = (q) =>
    api.get(`/api/admin/analytics/network/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getNetworkPath = (userId) =>
    api.get(`/api/admin/analytics/network/path/${userId}`).then(r => r.data);
