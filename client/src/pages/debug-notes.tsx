import React from 'react';

export default function DebugNotes() {
  console.log('🐛 DebugNotes component rendering...');
  
  return (
    <div className="p-4">
      <h1>Debug Notes Page</h1>
      <p>If you can see this, the basic routing is working.</p>
    </div>
  );
}