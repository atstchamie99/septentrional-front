import { useState, useEffect } from 'react'
import { resolveImageUrl } from '@features/public/utils/articles';
import { Link } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { getList } from '@features/public/utils/articles'
import { useAuth } from '@features/auth/AuthContext'
import { Plus, Edit, Trash2, PartyPopper } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'

export default function OccasionsList() {
  const confirm = useConfirm()
  const { isAdmin } = useAuth()
  const [occasions, setOccasions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOccasions = async () => {
    try {
      const res = await adminApi.getOccasions()
      setOccasions(getList(res))
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOccasions()
  }, [])

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer cette occasion spéciale ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteOccasion(id)
      loadOccasions()
    } catch (error) { console.error('Erreur:', error) }
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement des occasions spéciales...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1">
            Événements
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-sept-blue-strong" />
            Occasions spéciales
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Bannières temporaires affichées sous le Flash Info (vœux, fêtes nationales, commémorations).
          </p>
        </div>
        <Link to="/management/septentrional/occasions/nouveau" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-wider text-xs font-bold py-2.5 rounded-none">
          <Plus className="w-4 h-4" />
          Nouvelle occasion
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {occasions.map((occasion) => (
          <div key={occasion.id} className={`bg-white rounded-none shadow-sm border border-gray-200 p-5 flex flex-col justify-between ${!occasion.est_actif ? 'opacity-60 bg-gray-50' : ''}`}>
            <div>
              <div className="flex items-start gap-3 mb-3">
                {occasion.image && (
                  <img src={resolveImageUrl(occasion.image)} alt={occasion.titre} className="w-14 h-14 rounded-none object-cover border border-gray-200 shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-gray-900 text-sm truncate">{occasion.titre}</h3>
                  <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                    {occasion.date_debut} → {occasion.date_fin}
                  </span>
                </div>
              </div>
              {occasion.texte && (
                <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">{occasion.texte}</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
              <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${occasion.est_actif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {occasion.est_actif ? 'Actif' : 'Inactif'}
              </span>
              <div className="flex gap-1.5">
                <Link to={`/management/septentrional/occasions/${occasion.id}/edit`} className="p-1.5 text-sept-blue-strong hover:bg-blue-50 rounded-none border border-transparent hover:border-blue-200 transition" title="Modifier">
                  <Edit className="w-4 h-4" />
                </Link>
                {isAdmin() && (
                  <button onClick={() => handleDelete(occasion.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {occasions.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm bg-white border border-gray-200">
            Aucune occasion spéciale enregistrée. <Link to="/management/septentrional/occasions/nouveau" className="text-sept-blue-strong font-bold hover:underline">Ajouter la première</Link>
          </div>
        )}
      </div>
    </div>
  )
}
