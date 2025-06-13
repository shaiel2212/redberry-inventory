import * as React from 'react';
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { X } from 'lucide-react';

export const Dialog = ({ children, open, onClose }) => (
  <HeadlessDialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div className="relative z-50 bg-white p-4 rounded-lg shadow-lg w-full max-w-md mx-4">
      <button
        onClick={onClose}
        className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>
      {children}
    </div>
  </HeadlessDialog>
);

export const DialogTrigger = ({ asChild, children }) => children;

export const DialogContent = ({ children }) => (
  <div className="mt-2">
    {children}
  </div>
);