import { useEffect, useRef, useState } from 'react'

/**
 * Hook to trigger animations when an element enters the viewport.
 * Works seamlessly across all devices and screen sizes.
 *
 * @param {Object} options
 * @param {number} [options.threshold=0.08] - Visibility ratio before triggering.
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] - Viewport margin.
 * @param {boolean} [options.once=true] - Trigger once and stay visible.
 * @returns {[React.RefObject, boolean]}
 */
export function useScrollReveal({
  threshold = 0.08,
  rootMargin = '0px 0px -30px 0px',
  once = true,
} = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Fallback if browser doesn't support IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    // Check if element is already in viewport on mount (e.g. above the fold)
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true)
      if (once) return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(node)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(node)

    return () => {
      if (node) observer.unobserve(node)
    }
  }, [threshold, rootMargin, once])

  return [ref, isVisible]
}
