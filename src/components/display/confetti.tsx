'use client'

import { useEffect, useState } from 'react'

const COLORS = [
  'hsl(195, 100%, 50%)',
  'hsl(38, 95%, 55%)',
  'hsl(142, 76%, 45%)',
  'hsl(210, 100%, 60%)',
  'hsl(45, 100%, 60%)',
  'hsl(340, 82%, 52%)',
  'hsl(280, 80%, 60%)',
  'hsl(15, 90%, 55%)',
]

type Shape = 'circle' | 'square' | 'triangle' | 'star'

type Piece = {
  id: number
  left: number
  delay: number
  color: string
  size: number
  duration: number
  rotation: number
  shape: Shape
}

type Props = {
  isClosing?: boolean
}

export function Confetti({ isClosing }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    const shapes: Shape[] = ['circle', 'square', 'triangle', 'star']
    const newPieces: Piece[] = []
    for (let i = 0; i < 80; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        size: Math.random() * 12 + 6,
        duration: Math.random() * 2 + 3,
        rotation: Math.random() * 360,
        shape: shapes[Math.floor(Math.random() * shapes.length)]!,
      })
    }
    setPieces(newPieces)
  }, [])

  const getShapeStyle = (piece: Piece): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: `${piece.left}%`,
      animation: 'confetti-fall linear forwards',
      animationDelay: `${piece.delay}s`,
      animationDuration: `${piece.duration}s`,
      width: piece.shape === 'triangle' ? 0 : `${piece.size}px`,
      height: piece.shape === 'triangle' ? 0 : `${piece.size}px`,
      transform: `rotate(${piece.rotation}deg)`,
    }
    switch (piece.shape) {
      case 'circle':
        return { ...base, backgroundColor: piece.color, borderRadius: '50%' }
      case 'square':
        return { ...base, backgroundColor: piece.color, borderRadius: '2px' }
      case 'triangle':
        return {
          ...base,
          borderLeft: `${piece.size / 2}px solid transparent`,
          borderRight: `${piece.size / 2}px solid transparent`,
          borderBottom: `${piece.size}px solid ${piece.color}`,
        }
      case 'star':
        return {
          ...base,
          width: `${piece.size}px`,
          height: `${piece.size}px`,
          backgroundColor: piece.color,
          clipPath:
            'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        }
      default:
        return base
    }
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[60] overflow-hidden transition-opacity duration-500 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {pieces.map((piece) => (
        <div key={piece.id} style={getShapeStyle(piece)} />
      ))}
    </div>
  )
}
