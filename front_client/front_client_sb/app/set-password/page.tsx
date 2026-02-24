import { Suspense } from 'react';
import SetPasswordClient from './SetPasswordClient';

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SetPasswordClient />
    </Suspense>
  );
}
