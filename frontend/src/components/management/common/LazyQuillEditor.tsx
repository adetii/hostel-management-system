import React, { Suspense, lazy } from 'react';

// Dynamically import ReactQuill - only loads when editor is actually used
const ReactQuill = lazy(() => import('react-quill'));

interface LazyQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  modules?: any;
  formats?: string[];
  placeholder?: string;
  theme?: string;
  className?: string;
}

const QuillEditorFallback = () => (
  <div className="border border-gray-300 dark:border-gray-600 rounded-lg h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading editor...</p>
    </div>
  </div>
);

const LazyQuillEditor: React.FC<LazyQuillEditorProps> = (props) => {
  return (
    <Suspense fallback={<QuillEditorFallback />}>
      <ReactQuill {...props} />
    </Suspense>
  );
};

export default LazyQuillEditor;