import React from "react";

interface AdminModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AdminModal: React.FC<AdminModalProps> = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-8 w-full max-w-7xl md:max-w-6xl sm:max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white text-3xl font-bold rounded-xl transition focus:outline-none"
          title="Cerrar"
        >
          ×
        </button>
        <h2 className="text-3xl font-extrabold mb-8 text-neutral-800 dark:text-neutral-100">{title}</h2>
        <div className="flex-1 min-h-0 overflow-y-auto [&_input]:bg-white dark:[&_input]:bg-neutral-900 [&_input]:border [&_input]:border-neutral-300 dark:[&_input]:border-neutral-700 [&_input]:rounded-xl [&_input]:p-4 [&_input]:text-neutral-800 dark:[&_input]:text-neutral-100 [&_input]:placeholder-neutral-600 dark:[&_input]:placeholder-neutral-400 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-primary-500 [&_textarea]:bg-white dark:[&_textarea]:bg-neutral-900 [&_textarea]:border [&_textarea]:border-neutral-300 dark:[&_textarea]:border-neutral-700 [&_textarea]:rounded-xl [&_textarea]:p-4 [&_textarea]:text-neutral-800 dark:[&_textarea]:text-neutral-100 [&_textarea]:placeholder-neutral-600 dark:[&_textarea]:placeholder-neutral-400 [&_textarea]:focus:outline-none [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-primary-500">
          {children}
        </div>
        {footer && <div className="flex justify-end gap-4 pt-8">{footer}</div>}
      </div>
    </div>
  );
};

export default AdminModal;
