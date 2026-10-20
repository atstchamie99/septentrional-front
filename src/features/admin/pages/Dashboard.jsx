import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@services/api/admin';
import { useAuth } from '@features/auth/AuthContext';
import {
  FileText, Video, MessageSquare, Users,
  Calendar, Plus, Zap
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    articles: 0,
    videos: 0,
    commentairesEnAttente: 0,
    abonnes: 0,
    articlesVues: 0,
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, articlesRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getArticles({ per_page: 5, page: 1 }),
      ]);

      setStats({
        articles: statsRes.data.articles,
        videos: statsRes.data.videos,
        commentairesEnAttente: statsRes.data.commentaires_en_attente,
        abonnes: statsRes.data.abonnes,
        articlesVues: statsRes.data.articles_vues,
      });

      setRecentArticles(articlesRes.data.data || []);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Articles', value: stats.articles, icon: FileText, gradient: 'from-blue-600 to-cyan-500', link: '/management/septentrional/articles' },
    { label: 'Vidéos', value: stats.videos, icon: Video, gradient: 'from-red-600 to-rose-500', link: '/management/septentrional/videos' },
    { label: 'Commentaires (attente)', value: stats.commentairesEnAttente, icon: MessageSquare, gradient: 'from-yellow-600 to-amber-500', link: '/management/septentrional/commentaires' },
    { label: 'Abonnés', value: stats.abonnes, icon: Users, gradient: 'from-indigo-600 to-violet-500', link: '/management/septentrional/abonnes' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="skeleton h-16 w-64 rounded-none" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-none" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 animate-fade-in-up border-b border-gray-200 pb-5">
        <div className="inline-block bg-sept-blue-strong text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 mb-2">
          Vue d'ensemble
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-gray-900 uppercase">
          Tableau de bord
        </h1>
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">
          Espace éditorial & gestion • Bienvenue, {user?.name}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.label} 
              to={card.link} 
              className={`admin-stat-card bg-gradient-to-br ${card.gradient} animate-fade-in-up group`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="text-3xl font-black mb-1 drop-shadow-sm font-serif">{card.value}</div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-white/90">{card.label}</div>
                </div>
                <div className="p-2.5 bg-white/20 rounded-none group-hover:scale-105 transition-transform duration-200">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 animate-fade-in-up mb-8" style={{ animationDelay: '0.35s' }}>
        <h2 className="font-serif font-bold text-base uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Zap className="w-4 h-4 text-sept-gold" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          <Link to="/management/septentrional/articles/nouveau" className="flex flex-col items-center justify-center p-4 rounded-none border border-gray-200 bg-gray-50 hover:bg-sept-blue-strong hover:text-white hover:border-sept-blue-strong transition-all duration-150 group text-center">
            <div className="w-8 h-8 rounded-none bg-white border border-gray-200 flex items-center justify-center mb-2 text-sept-blue-strong group-hover:bg-white/20 group-hover:text-white group-hover:border-white/20 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-wider font-bold">Nouvel Article</span>
          </Link>
          <Link to="/management/septentrional/videos/nouveau" className="flex flex-col items-center justify-center p-4 rounded-none border border-gray-200 bg-gray-50 hover:bg-sept-blue-strong hover:text-white hover:border-sept-blue-strong transition-all duration-150 group text-center">
            <div className="w-8 h-8 rounded-none bg-white border border-gray-200 flex items-center justify-center mb-2 text-red-600 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/20 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-wider font-bold">Nouvelle Vidéo</span>
          </Link>
          <Link to="/management/septentrional/flash-infos" className="flex flex-col items-center justify-center p-4 rounded-none border border-gray-200 bg-gray-50 hover:bg-sept-blue-strong hover:text-white hover:border-sept-blue-strong transition-all duration-150 group text-center">
            <div className="w-8 h-8 rounded-none bg-white border border-gray-200 flex items-center justify-center mb-2 text-amber-600 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/20 transition-colors">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-wider font-bold">Flash Info</span>
          </Link>
        </div>
      </div>

      {/* Articles récents */}
      {recentArticles.length > 0 && (
        <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50">
            <h2 className="font-serif font-bold text-base uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sept-blue-strong" />
              Derniers articles publiés
            </h2>
            <Link to="/management/septentrional/articles" className="text-xs uppercase tracking-wider font-bold text-sept-blue-strong hover:text-sept-blue-dark transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3.5 px-6 text-xs uppercase font-bold tracking-wider text-gray-600">Titre</th>
                  <th className="text-left py-3.5 px-6 text-xs uppercase font-bold tracking-wider text-gray-600">Statut</th>
                  <th className="text-left py-3.5 px-6 text-xs uppercase font-bold tracking-wider text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <Link to={`/management/septentrional/articles/${article.id}/edit`} className="font-medium text-gray-800 group-hover:text-sept-blue-strong transition-colors">
                        {article.titre}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${
                        article.statut === 'publie' ? 'bg-green-50 text-green-700 border-green-300' :
                        article.statut === 'brouillon' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                        'bg-gray-50 text-gray-700 border-gray-300'
                      }`}>
                        {article.statut}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.date_publication ? new Date(article.date_publication).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
