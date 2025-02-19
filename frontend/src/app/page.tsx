'use client';

import PDFUpload from '@/components/PDF/PDFUpload';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">PDF Upload Test</h1>
      <PDFUpload 
        onUpload={(file) => {
          console.log('File uploaded:', file);
        }} 
      />
    </main>
  );
}