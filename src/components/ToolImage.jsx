import React from 'react';

export default function ToolImage({ src, alt = 'Tool image', size = 240 }) {
  const style = {
    width: size,
    height: size,
    objectFit: 'cover',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    background: '#f8fafc'
  };

  return (
    <img
      src={src || 'https://via.placeholder.com/400x300?text=No+image'}
      alt={alt}
      style={style}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+image';
      }}
    />
  );
}
