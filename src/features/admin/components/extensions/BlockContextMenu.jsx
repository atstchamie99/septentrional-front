import { useState, useCallback, useEffect, useRef } from 'react'

export default function BlockContextMenu({ editor }) {
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [activeBlockPos, setActiveBlockPos] = useState(null)
  const menuRef = useRef(null)

  const handleGripClick = useCallback((e, blockPos) => {
    e.preventDefault()
    e.stopPropagation()

    if (activeBlockPos === blockPos && menuVisible) {
      setMenuVisible(false)
      setActiveBlockPos(null)
      return
    }

    const editorRect = editor?.view.dom.getBoundingClientRect()
    const coords = editor?.view.coordsAtPos(blockPos)
    if (!coords) return

    setMenuPos({
      x: coords.left - editorRect.left - 8,
      y: coords.top - editorRect.top,
    })
    setActiveBlockPos(blockPos)
    setMenuVisible(true)
  }, [editor, activeBlockPos, menuVisible])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuVisible(false)
        setActiveBlockPos(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNode = useCallback(() => {
    if (activeBlockPos === null || !editor) return null
    return editor.state.doc.nodeAt(activeBlockPos)
  }, [activeBlockPos, editor])

  const duplicate = useCallback(() => {
    const node = getNode()
    if (!node) return
    const pos = activeBlockPos + node.nodeSize
    editor.chain().focus().insertContentAt(pos, node.toJSON()).run()
    setMenuVisible(false)
    setActiveBlockPos(null)
  }, [activeBlockPos, editor, getNode])

  const remove = useCallback(() => {
    const node = getNode()
    if (!node) return
    editor.chain().focus().deleteRange({ from: activeBlockPos, to: activeBlockPos + node.nodeSize }).run()
    setMenuVisible(false)
    setActiveBlockPos(null)
  }, [activeBlockPos, editor, getNode])

  const moveUp = useCallback(() => {
    const node = getNode()
    if (!node || activeBlockPos === 0) return
    const before = editor.state.doc.resolve(activeBlockPos)
    const prevNode = editor.state.doc.nodeBefore(before)
    if (!prevNode) return
    const prevSize = prevNode.nodeSize
    const tr = editor.state.tr.delete(activeBlockPos, activeBlockPos + node.nodeSize)
    tr.insert(activeBlockPos - prevSize, node.toJSON())
    editor.view.dispatch(tr)
    editor.view.focus()
    setMenuVisible(false)
    setActiveBlockPos(null)
  }, [activeBlockPos, editor, getNode])

  const moveDown = useCallback(() => {
    const node = getNode()
    if (!node) return
    const after = editor.state.doc.resolve(activeBlockPos + node.nodeSize)
    const nextNode = editor.state.doc.nodeAfter(after)
    if (!nextNode) return
    const nextSize = nextNode.nodeSize
    const tr = editor.state.tr.delete(activeBlockPos, activeBlockPos + node.nodeSize)
    tr.insert(after.pos - node.nodeSize, nextNode.toJSON())
    editor.view.dispatch(tr)
    editor.view.focus()
    setMenuVisible(false)
    setActiveBlockPos(null)
  }, [activeBlockPos, editor, getNode])

  if (!editor) return null

  return {
    handleGripClick,
    menuVisible,
    menuPos,
    activeBlockPos,
    MenuComponent: menuVisible ? (
      <div
        ref={menuRef}
        className="absolute z-50 bg-white shadow-xl border border-gray-200 rounded-none py-1 min-w-[160px]"
        style={{ left: menuPos.x, top: menuPos.y }}
      >
        <button
          type="button"
          onClick={duplicate}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Dupliquer
        </button>
        <button
          type="button"
          onClick={remove}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          Supprimer
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          type="button"
          onClick={moveUp}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Déplacer vers le haut
        </button>
        <button
          type="button"
          onClick={moveDown}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Déplacer vers le bas
        </button>
      </div>
    ) : null,
  }
}
