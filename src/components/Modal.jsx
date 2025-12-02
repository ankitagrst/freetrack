import { X } from 'lucide-react'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', // 'sm', 'md', 'lg', 'xl', '2xl'
  showCloseButton = true 
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 md:bottom-0 overflow-y-auto" 
      style={{ bottom: 'var(--bottom-nav-height, 72px)' }}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-xl ${sizeClasses[size]} w-full max-h-[calc(100%-2rem)] overflow-hidden shadow-2xl my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
            {title && (
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-auto"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-var(--bottom-nav-height,72px))] md:max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
