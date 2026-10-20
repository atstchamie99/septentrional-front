import { useState, useCallback, useRef, useEffect } from 'react'

export default function DragHandle({ editor }) {
  const [activePos, setActivePos] = useState(null)
  const menuRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    if (!editor) return
    const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
    if (!pos) { setActivePos(null); return }
    const resolved = editor.state.doc.resolve(pos.pos)
    if (resolved.depth === 0) { setActivePos(null); return }
    const blockPos = resolved.before(resolved.depth)
    if (blockPos !== activePos) setActivePos(blockPos)
  }, [editor, activePos])

  useEffect(() => {
    if (!editor) return
    const editorDom = editor.view.dom
    editorDom.addEventListener('mousemove', handleMouseMove)
    return () => editorDom.removeEventListener('mousemove', handleMouseMove)
  }, [editor, handleMouseMove])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        const pos = editor?.view.posAtCoords({ left: e.clientX, top: e.clientY })
        if (pos) {
          const resolved = editor?.state.doc.resolve(pos.pos)
          if (resolved && resolved.before(resolved.depth) !== activePos) {
            setActivePos(null)
          }
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editor, activePos])

  const getBlockNode = useCallback(() => {
    if (activePos === null || !editor) return null
    return editor.view.nodeDOM(activePos)
  }, [activePos, editor])

  const duplicateBlock = useCallback(() => {
    if (activePos === null || !editor) return
    const node = editor.state.doc.nodeAt(activePos)
    if (!node) return
    const pos = activePos + node.nodeSize
    editor.chain().focus().insertContentAt(pos, node.toJSON()).run()
    setActivePos(null)
  }, [activePos, editor])

  const deleteBlock = useCallback(() => {
    if (activePos === null || !editor) return
    const node = editor.state.doc.nodeAt(activePos)
    if (!node) return
    editor.chain().focus().deleteRange({ from: activePos, to: activePos + node.nodeSize }).run()
    setActivePos(null)
  }, [activePos, editor])

  const moveBlock = useCallback((direction) => {
    if (activePos === null || !editor) return
    const { state, dispatch } = editor.view
    const { doc } = state
    const node = doc.nodeAt(activePos)
    if (!node) return

    if (direction === 'up') {
      const before = doc.resolve(activePos)
      if (before.pos === 0) return
      const prevNode = doc.nodeBefore(before)
      if (!prevNode) return
      const prevSize = prevNode.nodeSize
      const tr = state.tr.delete(activePos, activePos + node.nodeSize)
      tr.insert(activePos - prevSize, node.toJSON())
      dispatch(tr)
    } else {
      const after = doc.resolve(activePos + node.nodeSize)
      const nextNode = doc.nodeAfter(after)
      if (!nextNode) return
      const nextSize = nextNode.nodeSize
      const tr = state.tr.delete(activePos, activePos + node.nodeSize)
      tr.insert(after.pos - node.nodeSize, nextNode.toJSON())
      dispatch(tr)
    }
    setActivePos(null)
  }, [activePos, editor])

  if (!editor || activePos === null) return null

  return (
    <div ref={menuRef}>
      <div
        className="drag-handle absolute left-0 top-0 -translate-x-full px-1 cursor-pointer opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
        style={{ display: 'flex', alignItems: 'center', height: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-gray-400 hover:text-gray-600 text-lg leading-none select-none">⋮⋮</span>
      </div>
    </div>
  )
}
