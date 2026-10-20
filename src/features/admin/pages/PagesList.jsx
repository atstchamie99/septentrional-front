import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@services/api/admin'
import { useAuth } from '@features/auth/AuthContext'
import { Plus, Edit, Trash2, FileText, ExternalLink } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function PagesList() {
  const confirm = useConfirm()
  const { isAdmin } = useAuth()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPages() }, [])

  const loadPages = async () => {
    try {
      const res = await adminApi.getPages()
      setPages(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer cette page ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deletePage(id)
      loadPages()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  if (loading) return <div className="text-center py-10 text-xs uppercase tracking-wider text-gray-500 font-semibold">Chargement des pages statiques...</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1">
            Contenu Légal & Info
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-gray-900 uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-sept-blue-strong" />
            Pages statiques
          </h1>
        </div>
        <Link to="/management/septentrional/pages/nouveau" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-wider text-xs font-bold py-2.5 rounded-none">
          <Plus className="w-4 h-4" />
          Nouvelle page
        </Link>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Titre</th>
              <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Slug</th>
              <th className="px-6 py-3.5 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Statut</th>
              <th className="px-6 py-3.5 text-right text-xs uppercase font-bold tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-sept-blue-strong shrink-0" />
                    <span className="font-medium text-gray-900">{page.titre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-gray-500">/{page.slug}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${page.statut === 'publie' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}`}>
                    {page.statut}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-none border border-transparent hover:border-gray-200 transition" title="Voir">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Link to={`/management/septentrional/pages/${page.id}/edit`} className="p-1.5 text-sept-blue-strong hover:bg-blue-50 rounded-none border border-transparent hover:border-blue-200 transition" title="Modifier">
                      <Edit className="w-4 h-4" />
                    </Link>
                    {isAdmin() && (
                      <button onClick={() => handleDelete(page.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-none border border-transparent hover:border-red-200 transition" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Aucune page statique enregistrée</div>}
      </div>
    </div>
  )
}
