import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import {
  ADMIN_BASE_PATH,
  ADMIN_FORGOT_PASSWORD_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_RESET_PASSWORD_PATH,
} from '@app/routes/authRoutes'
import PublicLayout from '@layouts/public/PublicLayout'
import AdminLayout from '@layouts/admin/AdminLayout'
import ProtectedAdminRoute from './ProtectedAdminRoute'
import AdminOnlyRoute from './AdminOnlyRoute'

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory()
    } catch (error: any) {
      console.warn('Dynamic import failed, retrying once...', error)
      await new Promise((resolve) => setTimeout(resolve, 300))
      try {
        return await factory()
      } catch (retryError) {
        const key = 'chunk_retry_' + window.location.pathname
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1')
          window.location.reload()
          return new Promise(() => {})
        }
        sessionStorage.removeItem(key)
        throw retryError
      }
    }
  })
}

import Home from '@features/public/pages/Home'
const Login = lazyWithRetry(() => import('@features/auth/pages/Login'))
const ForgotPassword = lazyWithRetry(() => import('@features/auth/pages/ForgotPassword'))
const ResetPassword = lazyWithRetry(() => import('@features/auth/pages/ResetPassword'))

const ArticlePage = lazyWithRetry(() => import('@features/public/pages/Article'))
const ArticlesList = lazyWithRetry(() => import('@features/public/pages/ArticlesList'))
const PageStatic = lazyWithRetry(() => import('@features/public/pages/PageStatic'))
const Desabonnement = lazyWithRetry(() => import('@features/public/pages/Desabonnement'))
const VideoDetail = lazyWithRetry(() => import('@features/public/pages/VideoDetail'))
const Videos = lazyWithRetry(() => import('@features/public/pages/Videos'))
const NotFound = lazyWithRetry(() => import('@features/public/pages/NotFound'))

const AbonnesList = lazyWithRetry(() => import('@features/admin/pages/AbonnesList'))
const ArticleForm = lazyWithRetry(() => import('@features/admin/pages/ArticleForm'))
const ArticlesListAdmin = lazyWithRetry(() => import('@features/admin/pages/ArticlesList'))
const CategoriesList = lazyWithRetry(() => import('@features/admin/pages/CategoriesList'))
const CommentairesList = lazyWithRetry(() => import('@features/admin/pages/CommentairesList'))
const Dashboard = lazyWithRetry(() => import('@features/admin/pages/Dashboard'))
const FlashInfosList = lazyWithRetry(() => import('@features/admin/pages/FlashInfosList'))
const OccasionsList = lazyWithRetry(() => import('@features/admin/pages/OccasionsList'))
const OccasionForm = lazyWithRetry(() => import('@features/admin/pages/OccasionForm'))
const NewsletterSend = lazyWithRetry(() => import('@features/admin/pages/NewsletterSend'))
const PageForm = lazyWithRetry(() => import('@features/admin/pages/PageForm'))
const PagesList = lazyWithRetry(() => import('@features/admin/pages/PagesList'))
const ParametresList = lazyWithRetry(() => import('@features/admin/pages/ParametresList'))
const VideoForm = lazyWithRetry(() => import('@features/admin/pages/VideoForm'))
const VideosListAdmin = lazyWithRetry(() => import('@features/admin/pages/VideosList'))
const UtilisateursList = lazyWithRetry(() => import('@features/admin/pages/UtilisateursList'))
const ApiKeysList = lazyWithRetry(() => import('@features/admin/pages/ApiKeysList'))
const MonProfil = lazyWithRetry(() => import('@features/admin/pages/MonProfil'))
const MediaLibrary = lazyWithRetry(() => import('@features/admin/pages/MediaLibrary'))

function RouteFallback() {
  return (
    <div
      className="max-w-7xl mx-auto w-full px-4 py-8 space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page"
    >
      <div className="skeleton h-8 w-56 rounded-lg" />
      <div className="skeleton h-64 w-full rounded-xl" />
      <span className="sr-only">Chargement…</span>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/actualites" element={<ArticlesList />} />
        <Route path="/politique" element={<ArticlesList fixedCategorySlug="politique" title="Politique" />} />
        <Route path="/autres-rubriques" element={<ArticlesList fixedCategorySlug="autres-rubriques" title="Autres rubriques" showCategoriesBar />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/categorie/:slug" element={<ArticlesList />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/video/:slug" element={<VideoDetail />} />
        <Route path="/a-propos" element={<PageStatic slug="a-propos" />} />
        <Route path="/mentions-legales" element={<PageStatic slug="mentions-legales" />} />
        <Route path="/contact" element={<PageStatic slug="contact" />} />
        <Route path="/pages/:slug" element={<PageStatic slug={undefined} />} />
        <Route path="/desabonnement/:jeton" element={<Desabonnement />} />
      </Route>

      <Route path={ADMIN_LOGIN_PATH} element={<Login />} />
      <Route path={ADMIN_FORGOT_PASSWORD_PATH} element={<ForgotPassword />} />
      <Route path={ADMIN_RESET_PASSWORD_PATH} element={<ResetPassword />} />

      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route path={ADMIN_BASE_PATH} element={<Dashboard />} />
        <Route path={`${ADMIN_BASE_PATH}/profil`} element={<MonProfil />} />
        <Route path={`${ADMIN_BASE_PATH}/articles`} element={<ArticlesListAdmin />} />
        <Route path={`${ADMIN_BASE_PATH}/articles/nouveau`} element={<ArticleForm />} />
        <Route path={`${ADMIN_BASE_PATH}/articles/:id/edit`} element={<ArticleForm />} />
        <Route path={`${ADMIN_BASE_PATH}/videos`} element={<VideosListAdmin />} />
        <Route path={`${ADMIN_BASE_PATH}/mediatheque`} element={<MediaLibrary />} />
        <Route path={`${ADMIN_BASE_PATH}/videos/nouveau`} element={<VideoForm />} />
        <Route path={`${ADMIN_BASE_PATH}/videos/:id/edit`} element={<VideoForm />} />
        <Route path={`${ADMIN_BASE_PATH}/commentaires`} element={<CommentairesList />} />
        <Route path={`${ADMIN_BASE_PATH}/flash-infos`} element={<FlashInfosList />} />
        <Route path={`${ADMIN_BASE_PATH}/occasions`} element={<OccasionsList />} />
        <Route path={`${ADMIN_BASE_PATH}/occasions/nouveau`} element={<OccasionForm />} />
        <Route path={`${ADMIN_BASE_PATH}/occasions/:id/edit`} element={<OccasionForm />} />
        <Route path={`${ADMIN_BASE_PATH}/pages`} element={<PagesList />} />
        <Route path={`${ADMIN_BASE_PATH}/pages/nouveau`} element={<PageForm />} />
        <Route path={`${ADMIN_BASE_PATH}/pages/:id/edit`} element={<PageForm />} />
        <Route path={`${ADMIN_BASE_PATH}/categories`} element={<AdminOnlyRoute><CategoriesList /></AdminOnlyRoute>} />
        <Route path={`${ADMIN_BASE_PATH}/parametres`} element={<AdminOnlyRoute><ParametresList /></AdminOnlyRoute>} />
        <Route path={`${ADMIN_BASE_PATH}/abonnes`} element={<AdminOnlyRoute><AbonnesList /></AdminOnlyRoute>} />
        <Route path={`${ADMIN_BASE_PATH}/newsletter`} element={<AdminOnlyRoute><NewsletterSend /></AdminOnlyRoute>} />
        <Route path={`${ADMIN_BASE_PATH}/utilisateurs`} element={<AdminOnlyRoute><UtilisateursList /></AdminOnlyRoute>} />
        <Route path={`${ADMIN_BASE_PATH}/api-keys`} element={<AdminOnlyRoute><ApiKeysList /></AdminOnlyRoute>} />
      </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
