import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { useAuth } from '@features/auth/AuthContext'
import { MessageSquare, CheckCircle, XCircle, Trash2, Eye, User } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function CommentairesList() {
  const confirm = useConfirm()
  const { isAdmin } = useAuth()
  const [commentaires, setCommentaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')

  useEffect(() => { loadCommentaires() }, [])

  const loadCommentaires = async () => {
    try {
      const res = await adminApi.getCommentaires()
      setCommentaires(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleModerer = async (id, statut) => {
    try {
      await adminApi.modererCommentaire(id, statut)
      loadCommentaires()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer ce commentaire ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteCommentaire(id)
      loadCommentaires()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const filtered = filter === 'en_attente'
    ? commentaires.filter(c => c.statut === 'en_attente')
    : commentaires

  const getStatusBadge = (statut) => {
    const styles = {
      approuve: 'bg-green-50 text-green-700 border-green-300',
      en_attente: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      rejete: 'bg-red-50 text-red-700 border-red-300',
    }
    return styles[statut] || 'bg-gray-50 text-gray-700 border-gray-300'
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement des commentaires...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1">
            Modération
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sept-blue-strong" />
            Commentaires
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('tous')}
            className={`px-4 py-2 rounded-none text-xs uppercase tracking-wider font-bold transition border ${filter === 'tous' ? 'bg-sept-blue-strong text-white border-sept-blue-strong' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Tous ({commentaires.length})
          </button>
          <button
            onClick={() => setFilter('en_attente')}
            className={`px-4 py-2 rounded-none text-xs uppercase tracking-wider font-bold transition border ${filter === 'en_attente' ? 'bg-sept-accent text-white border-sept-accent' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            En attente ({commentaires.filter(c => c.statut === 'en_attente').length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((comment) => (
          <div key={comment.id} className="bg-white rounded-none shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-none bg-sept-blue-strong/10 border border-sept-blue-strong/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-sept-blue-strong" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900">{comment.nom}</span>
                    <span className="text-[11px] text-gray-400 ml-2 font-mono">{comment.created_at}</span>
                  </div>
                  <span className={`ml-2 px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(comment.statut)}`}>
                    {comment.statut}
                  </span>
                </div>
                <p className="text-sm text-gray-700 ml-11 leading-relaxed bg-gray-50 p-3 border-l-2 border-gray-300">{comment.contenu}</p>
                <div className="ml-11 mt-2 text-xs text-gray-400 flex items-center gap-4">
                  {comment.commentable_type && (
                    <span className="font-medium text-gray-500">Concerne: {comment.commentable_type?.includes('Article') ? 'Article' : comment.commentable_type}</span>
                  )}
                  {comment.email && <span>Email: {comment.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-4 shrink-0">
                {comment.statut === 'en_attente' && (
                  <>
                    <button onClick={() => handleModerer(comment.id, 'approuve')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-none border border-transparent hover:border-green-200 transition" title="Approuver">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleModerer(comment.id, 'rejete')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition" title="Rejeter">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                {isAdmin() && (
                  <button onClick={() => handleDelete(comment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-200">Aucun commentaire dans cette vue</div>}
      </div>
    </div>
  )
}
