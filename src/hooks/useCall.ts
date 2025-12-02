import { useContext } from 'react';
import { CallContext } from '@/contexts/CallContext';

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall deve ser usado dentro de CallProvider');
  }
  return context;
}
