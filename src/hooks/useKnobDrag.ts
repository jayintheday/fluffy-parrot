import { useCallback, useRef } from 'react'

interface UseKnobDragOptions {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}

export function useKnobDrag({ value, min, max, step = 0.01, onChange }: UseKnobDragOptions) {
  const startY = useRef<number>(0)
  const startValue = useRef<number>(value)
  const dragging = useRef(false)

  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const snap = (v: number) => step > 0 ? Math.round(v / step) * step : v

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startY.current = e.clientY
    startValue.current = value
    dragging.current = true
    document.body.classList.add('dragging')

    const range = max - min
    // 150px = full range; shift = 10x fine
    const onMouseMove = (me: MouseEvent) => {
      if (!dragging.current) return
      const dy = startY.current - me.clientY
      const sensitivity = me.shiftKey ? range / 1500 : range / 150
      const newVal = clamp(snap(startValue.current + dy * sensitivity))
      onChange(newVal)
    }

    const onMouseUp = () => {
      dragging.current = false
      document.body.classList.remove('dragging')
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [value, min, max, step, onChange])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const direction = e.deltaY < 0 ? 1 : -1
    const newVal = clamp(snap(value + direction * step))
    onChange(newVal)
  }, [value, min, max, step, onChange])

  const onDoubleClick = useCallback(() => {
    // caller handles reset by passing defaultValue comparison
  }, [])

  return { onMouseDown, onWheel, onDoubleClick }
}
