import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { useAuth } from '@features/auth/AuthContext'
import { Plus, Edit, Trash2, Video, CheckCircle } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function VideosList() {
  const confirm = useConfirm()
  const { isAdmin } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadVideos() }, [])

  const loadVideos = async () => {
    try {
      const res = await adminApi.getVideos()
      setVideos(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer cette vidéo ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteVideo(id)
      loadVideos()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handlePublier = async (id) => {
    try {
      await adminApi.publierVideo(id)
      loadVideos()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const getStatusBadge = (statut) => {
    const styles = {
      publie: 'bg-green-50 text-green-700 border-green-300',
      brouillon: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      archive: 'bg-gray-50 text-gray-700 border-gray-300',
    }
    return styles[statut] || 'bg-gray-50 text-gray-700 border-gray-300'
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement des vidéos...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1">
            Multimédia
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600" />
            Vidéos
          </h1>
        </div>
        <Link to="/management/septentrional/videos/nouveau" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-wider text-xs font-bold py-2.5 rounded-none">
          <Plus className="w-4 h-4" />
          Nouvelle vidéo
        </Link>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Titre</th>
              <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Type</th>
              <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Statut</th>
              <th className="px-6 py-3.5 text-right text-xs uppercase font-bold tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{video.titre}</td>
                <td className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">{video.type_video || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(video.statut)}`}>
                    {video.statut}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {video.statut === 'brouillon' && (
                      <button onClick={() => handlePublier(video.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-none border border-transparent hover:border-green-200 transition" title="Publier">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <Link to={`/management/septentrional/videos/${video.id}/edit`} className="p-1.5 text-sept-blue-strong hover:bg-blue-50 rounded-none border border-transparent hover:border-blue-200 transition" title="Modifier">
                      <Edit className="w-4 h-4" />
                    </Link>
                    {isAdmin() && (
                      <button onClick={() => handleDelete(video.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {videos.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Aucune vidéo enregistrée</div>}
      </div>
    </div>
  )
}
