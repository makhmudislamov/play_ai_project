'use client';

import dynamic from 'next/dynamic';

// Dynamically import ChatWidget with no SSR
const ChatWidget = dynamic(
  () => import('./ChatWidget'),
  { ssr: false }
);

export default ChatWidget;