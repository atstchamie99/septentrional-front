import apiClient, { API_URL } from './client';

export const publicApi = {
  health: () => apiClient.get('/health'),
  resolveLegacyUrl: (path) => apiClient.get('/legacy/resolve', { params: { path } }),

  getArticles: (params = {}) => apiClient.get('/articles', { params }),
  getArticle: (slug) => apiClient.get(`/articles/${slug}`),
  getAlertes: () => apiClient.get('/articles/alertes'),
  getPopulaires: (params = {}) => apiClient.get('/articles/populaires', { params }),
  getArchivesMois: () => apiClient.get('/articles/archives-mois'),

  getCategories: () => apiClient.get('/categories'),
  getCategorie: (slug) => apiClient.get(`/categories/${slug}`),

  getVideos: (params = {}) => apiClient.get('/videos', { params }),
  getVideo: (slug) => apiClient.get(`/videos/${slug}`),

  postCommentaire: (data) => apiClient.post('/commentaires', data),
  getCommentairesArticle: (slug) => apiClient.get(`/articles/${slug}/commentaires`),

  getFlashInfos: () => apiClient.get('/flash-infos'),

  getPage: (slug) => apiClient.get(`/pages/${slug}`),



  getParametresPublics: () => apiClient.get('/parametres/publics'),

  getOccasionActive: () => apiClient.get('/occasions/active'),
  getMeteoJour: () => apiClient.get('/meteo/jour'),

  subscribeNewsletter: (data) => apiClient.post('/abonnes', data),
  unsubscribeNewsletter: (jeton) => apiClient.get(`/abonnes/desabonner/${jeton}`),

  forgotPassword: (email) => apiClient.post('/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/reset-password', data),
};
