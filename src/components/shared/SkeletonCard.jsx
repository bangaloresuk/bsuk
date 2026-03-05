import React from 'react'

/** Shimmer placeholder shown while data is loading */
export function SkeletonCard({ rows = 3, style = {} }) {
  return (
    <div className="skeleton-card" style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 6 }} />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{
          height: 11, borderRadius: 6,
          width: i === rows - 1 ? '45%' : i % 2 === 0 ? '80%' : '65%',
        }} />
      ))}
      <div className="skeleton" style={{ height: 38, borderRadius: 10, marginTop: 4 }} />
    </div>
  )
}
