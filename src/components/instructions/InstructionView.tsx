import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2 } from 'lucide-react'
import type { Instruction, InstructionStep } from '../../types'

interface Props {
  instruction: Instruction
  steps: InstructionStep[]
  onClose: () => void
}

export default function InstructionView({ instruction, steps, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { if (lightbox) setLightbox(false); else onClose() }
      if (e.key === 'ArrowRight') setCurrentStep(s => Math.min(s + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setCurrentStep(s => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, onClose, steps.length])

  const step = steps[currentStep]
  const hasSteps = steps.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="font-bold text-lg text-gray-900 leading-tight">{instruction.title}</h2>
            {instruction.equipment && (
              <p className="text-xs text-navy-600 font-medium mt-0.5">{instruction.equipment.name}</p>
            )}
            {instruction.description && (
              <p className="text-sm text-gray-500 mt-1">{instruction.description}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!hasSteps && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Noch keine Schritte vorhanden.
            </div>
          )}

          {hasSteps && step && (
            <div className="flex flex-col">
              {/* Step indicator */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-xs font-semibold text-navy-700 bg-navy-50 px-2.5 py-1 rounded-full">
                  Schritt {currentStep + 1} von {steps.length}
                </span>
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentStep ? 'bg-navy-700 w-6' : 'bg-gray-200 w-1.5 hover:bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Media */}
              {step.media_url && step.media_type === 'image' && (
                <div className="relative mx-5 rounded-xl overflow-hidden bg-gray-100 cursor-pointer group" onClick={() => setLightbox(true)}>
                  <img
                    src={step.media_url}
                    alt={`Schritt ${currentStep + 1}`}
                    className="w-full object-contain max-h-64"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Maximize2 size={28} className="text-white drop-shadow" />
                  </div>
                </div>
              )}

              {step.media_url && step.media_type === 'video' && (
                <div className="mx-5 rounded-xl overflow-hidden bg-black">
                  <video
                    src={step.media_url}
                    controls
                    className="w-full max-h-64 object-contain"
                    playsInline
                  />
                </div>
              )}

              {!step.media_url && (
                <div className="mx-5 rounded-xl bg-gray-50 flex items-center justify-center h-32">
                  <ImageIcon size={32} className="text-gray-200" />
                </div>
              )}

              {/* Description */}
              <div className="px-5 pt-4 pb-6">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{step.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {hasSteps && steps.length > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
            <button
              onClick={() => setCurrentStep(s => Math.max(s - 1, 0))}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Zurück
            </button>
            <button
              onClick={() => setCurrentStep(s => Math.min(s + 1, steps.length - 1))}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Weiter
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox for images */}
      {lightbox && step?.media_url && step.media_type === 'image' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={step.media_url}
            alt={`Schritt ${currentStep + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
