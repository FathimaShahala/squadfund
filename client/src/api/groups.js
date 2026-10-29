import api from './axios'

export const fetchGroups = () => api.get('/groups').then((r) => r.data.groups)
export const fetchGroup = (id) => api.get(`/groups/${id}`).then((r) => r.data.group)
export const fetchMembers = (id) => api.get(`/groups/${id}/members`).then((r) => r.data)

export const createGroup = (body) => api.post('/groups', body).then((r) => r.data.group)
export const joinGroup = (inviteCode) => api.post('/groups/join', { inviteCode }).then((r) => r.data)

export const approveMember = (id, userId) => api.post(`/groups/${id}/members/${userId}/approve`)
export const removeMember = (id, userId) => api.delete(`/groups/${id}/members/${userId}`)
export const leaveGroup = (id) => api.post(`/groups/${id}/leave`)
export const regenerateInvite = (id) => api.post(`/groups/${id}/invite/regenerate`).then((r) => r.data)

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err.response?.data?.message || fallback

export const rupees = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
