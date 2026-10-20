import apiClient from './client';

const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        data[key].forEach((item) => formData.append(`${key}[]`, item));
      } else if (data[key] instanceof File || data[key] instanceof Blob) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  return formData;
};

const normalizeOccasionPayload = (data) => ({
  ...data,
  texte: data.texte || null,
  est_actif: data.est_actif ? 1 : 0,
});

const multipartConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
};

export const adminApi = {
  getMediaLibrary: (params = {}) => apiClient.get('/admin/media-library', { params }),
  uploadMedia: (data) => apiClient.post('/admin/media-library', createFormData(data), multipartConfig),
  deleteMedia: (id) => apiClient.delete(`/admin/media-library/${id}`),
  bulkDeleteMedia: (ids) => apiClient.post('/admin/media-library/bulk-delete', { ids }),

  getArticles: (params = {}) => apiClient.get('/admin/articles', { params }),
  getArticle: (id) => apiClient.get(`/admin/articles/${id}`),
  createArticle: (data) => apiClient.post('/admin/articles', createFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateArticle: (id, data) => apiClient.post(`/admin/articles/${id}?_method=PUT`, createFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteArticle: (id) => apiClient.delete(`/admin/articles/${id}`),
  publierArticle: (id) => apiClient.patch(`/admin/articles/${id}/publier`),
  archiverArticle: (id) => apiClient.patch(`/admin/articles/${id}/archiver`),


  getCommentaires: () => apiClient.get('/admin/commentaires'),
  getCommentairesEnAttente: () => apiClient.get('/admin/commentaires/en-attente'),
  modererCommentaire: (id, statut) => apiClient.patch(`/admin/commentaires/${id}/moderer`, { statut }),
  deleteCommentaire: (id) => apiClient.delete(`/admin/commentaires/${id}`),

  getFlashInfos: () => apiClient.get('/admin/flash-infos'),
  createFlashInfo: (data) => apiClient.post('/admin/flash-infos', data),
  updateFlashInfo: (id, data) => apiClient.put(`/admin/flash-infos/${id}`, data),
  deleteFlashInfo: (id) => apiClient.delete(`/admin/flash-infos/${id}`),

  getPages: () => apiClient.get('/admin/pages'),
  getPage: (id) => apiClient.get(`/admin/pages/${id}`),
  createPage: (data) => apiClient.post('/admin/pages', data),
  updatePage: (id, data) => apiClient.put(`/admin/pages/${id}`, data),
  deletePage: (id) => apiClient.delete(`/admin/pages/${id}`),

  getVideos: () => apiClient.get('/admin/videos'),
  getVideo: (id) => apiClient.get(`/admin/videos/${id}`),
  createVideo: (data) => apiClient.post('/admin/videos', createFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateVideo: (id, data) => apiClient.post(`/admin/videos/${id}?_method=PUT`, createFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteVideo: (id) => apiClient.delete(`/admin/videos/${id}`),
  publierVideo: (id) => apiClient.patch(`/admin/videos/${id}/publier`),


  getCategories: () => apiClient.get('/admin/categories'),
  createCategorie: (data) => apiClient.post('/admin/categories', data),
  updateCategorie: (id, data) => apiClient.put(`/admin/categories/${id}`, data),
  deleteCategorie: (id) => apiClient.delete(`/admin/categories/${id}`),

  getParametres: () => apiClient.get('/admin/parametres'),
  createParametre: (data) => apiClient.post('/admin/parametres', data),
  updateParametre: (id, data) => apiClient.put(`/admin/parametres/${id}`, data),
  deleteParametre: (id) => apiClient.delete(`/admin/parametres/${id}`),
  getParametresGroupe: (groupe) => apiClient.get(`/admin/parametres/groupe/${groupe}`),


  getAbonnes: () => apiClient.get('/admin/abonnes'),
  deleteAbonne: (id) => apiClient.delete(`/admin/abonnes/${id}`),

  getOccasions: () => apiClient.get('/admin/occasions'),
  getOccasion: (id) => apiClient.get(`/admin/occasions/${id}`),
  createOccasion: (data) => apiClient.post('/admin/occasions', createFormData(normalizeOccasionPayload(data)), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateOccasion: (id, data) => apiClient.post(`/admin/occasions/${id}?_method=PUT`, createFormData(normalizeOccasionPayload(data)), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteOccasion: (id) => apiClient.delete(`/admin/occasions/${id}`),

  sendNewsletter: (data) => apiClient.post('/admin/newsletter/envoyer', data),

  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),

  getUtilisateurs: () => apiClient.get('/admin/utilisateurs'),
  createUtilisateur: (data) => apiClient.post('/admin/utilisateurs', data),
  updateUtilisateur: (id, data) => apiClient.put(`/admin/utilisateurs/${id}`, data),
  suspendreUtilisateur: (id) => apiClient.patch(`/admin/utilisateurs/${id}/suspendre`),
  reactiverUtilisateur: (id) => apiClient.patch(`/admin/utilisateurs/${id}/reactiver`),

  getApiKeys: () => apiClient.get('/admin/api-keys'),
  createApiKey: (data) => apiClient.post('/admin/api-keys', data),
  revokeApiKey: (id) => apiClient.delete(`/admin/api-keys/${id}`),
};
