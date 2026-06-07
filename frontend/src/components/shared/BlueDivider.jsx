import React from 'react'

/** Decorative gold–blue ornament divider used throughout the app */
export const BlueDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 16px' }}>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.4))' }} />
    <span style={{ color: 'rgba(59,130,246,0.45)', fontSize: 14 }}>✦</span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,rgba(59,130,246,0.4),transparent)' }} />
  </div>
)
