import * as React from "react";
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogTrigger as RadixDialogTrigger,
  DialogTitle as RedixDialogTitle,
} from "@radix-ui/react-dialog";

export function Dialog({ open, onClose, children }) {
  return (
    <RadixDialog open={open} onOpenChange={(state) => {
      if (!state && typeof onClose === 'function') {
        onClose();
      }
    }}>
      {children}
    </RadixDialog>
  );
}

export const DialogTrigger = RadixDialogTrigger;

export function DialogContent({ children, className = "" }) {
  return (
    <RadixDialogContent
      className={`fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 shadow-lg rounded-lg ${className}`.trim()}
    >
      {children}
    </RadixDialogContent>
  );
}

// 🛠️ תוספת לפתרון השגיאה
export const DialogTitle = RedixDialogTitle;
