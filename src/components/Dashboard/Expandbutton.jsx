import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

export default function ExpandButton({ children, className = '', modalClassName = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {}
      <button
        onClick={() => setIsExpanded(true)}
        aria-label="Expand to fullscreen"
        className={`p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${className}`}
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto relative ${modalClassName}`}>
            {}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-md"
              aria-label="Close expanded view"
            >
              <X className="w-6 h-6" />
            </button>

            {}
            <div className="p-8">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
