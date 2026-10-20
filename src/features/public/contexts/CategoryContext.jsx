/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { publicApi } from '@services/api/public'
import { getList } from '@features/public/utils/articles'

const CategoryContext = createContext(null)

export const CategoryProvider = ({ children }) => {
  const [categoryArticles, setCategoryArticles] = useState(null)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const loadCategoryArticles = useCallback(async (slug, limit = 6) => {
    setLoadingCategory(true)
    setSelectedCategory(slug)
    try {
      const res = await publicApi.getArticles({
        categorie: slug,
        per_page: limit,
        sort: '-date_publication',
      })
      const articles = getList(res)
      setCategoryArticles(articles)
      return articles
    } catch (error) {
      console.error('Erreur chargement articles catégorie:', error)
      setCategoryArticles([])
      return []
    } finally {
      setLoadingCategory(false)
    }
  }, [])

  const clearCategoryArticles = useCallback(() => {
    setCategoryArticles(null)
    setSelectedCategory(null)
  }, [])

  const value = {
    categoryArticles,
    loadingCategory,
    selectedCategory,
    loadCategoryArticles,
    clearCategoryArticles
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export const useCategory = () => {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider')
  }
  return context
}
