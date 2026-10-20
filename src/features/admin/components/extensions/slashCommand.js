import { Extension } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        startOfLine: true,
        items: ({ query }) => {
          const items = [
            { title: 'Titre 1', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run() },
            { title: 'Titre 2', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run() },
            { title: 'Titre 3', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run() },
            { title: 'Titre 4', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 4 }).run() },
            { title: 'Image', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent({ type: 'image', attrs: { src: 'https://placehold.co/800x400', width: '100%', align: 'center' } }).run() },
            { title: 'Vidéo', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent({ type: 'video', attrs: { src: '', width: '100%', align: 'center' } }).run() },
            { title: 'YouTube', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent({ type: 'youtubeVideo', attrs: { src: '', width: '100%', align: 'center' } }).run() },
            { title: 'Tableau', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
            { title: 'Citation', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
            { title: 'Code', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
            { title: 'Séparateur', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
            { title: 'Liste à puces', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
            { title: 'Liste numérotée', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
          ]

          const q = query.toLowerCase()
          return items.filter(item => item.title.toLowerCase().includes(q)).slice(0, 8)
        },
        render: () => {
          let dom
          let list

          return {
            onStart: (props) => {
              dom = document.createElement('div')
              dom.className = 'slash-command-menu fixed z-50 bg-white shadow-xl border border-gray-200 rounded-none max-h-64 overflow-y-auto min-w-[200px]'
              document.body.appendChild(dom)

              list = document.createElement('div')
              list.className = 'p-1'
              dom.appendChild(list)

              const renderItems = () => {
                list.innerHTML = ''
                props.items.forEach((item, index) => {
                  const btn = document.createElement('button')
                  btn.type = 'button'
                  btn.className = `w-full text-left px-3 py-2 text-sm rounded-none transition-colors ${index === props.selectedIndex ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : 'text-gray-700 hover:bg-gray-100'}`
                  btn.textContent = item.title
                  btn.onclick = () => props.command({ editor: props.editor, range: props.range })
                  btn.onmouseenter = () => props.event?.keyboard?.selectItem?.(index)
                  list.appendChild(btn)
                })
              }

              renderItems()

              props.onUpdate = (updateProps) => {
                props.selectedIndex = updateProps.selectedIndex
                props.items = updateProps.items
                renderItems()
              }
            },

            onUpdate: (props) => {
              props.items.forEach((item, index) => {
                const btns = list.querySelectorAll('button')
                if (btns[index]) {
                  btns[index].className = `w-full text-left px-3 py-2 text-sm rounded-none transition-colors ${index === props.selectedIndex ? 'bg-sept-blue-strong/10 text-sept-blue-strong' : 'text-gray-700 hover:bg-gray-100'}`
                }
              })
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                dom?.remove()
                return true
              }
              return false
            },

            onExit: () => {
              dom?.remove()
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
