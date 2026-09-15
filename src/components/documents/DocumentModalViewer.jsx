import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import OfficialDocumentView from './OfficialDocumentView';

export default function DocumentModalViewer({ open, onClose, doc, onSendSuccess }) {
  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <span>Consultation Officielle de Document</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-normal">
              {doc.doc_number}
            </span>
          </DialogTitle>
        </DialogHeader>

        <OfficialDocumentView
          doc={doc}
          onSendSuccess={(res) => {
            if (onSendSuccess) onSendSuccess(res);
          }}
          showActions={true}
        />
      </DialogContent>
    </Dialog>
  );
}
