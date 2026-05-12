import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { X, Printer } from 'lucide-react'

interface Props {
  label: string
  url: string
  onClose: () => void
}

export default function QRModal({ label, url, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2 })
    }
  }, [url])

  function print() {
    const win = window.open('', '_blank')
    if (!win) return
    const dataUrl = canvasRef.current?.toDataURL() ?? ''
    win.document.write(`
      <html><head><title>${label}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:2rem">
        <h2>${label}</h2>
        <img src="${dataUrl}" style="width:256px;height:256px" />
        <p style="font-size:0.75rem;color:#666;word-break:break-all">${url}</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white">{label}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <canvas ref={canvasRef} className="mx-auto rounded-lg" />
        <p className="text-xs text-gray-400 mt-2 break-all">{url}</p>
        <button
          onClick={print}
          className="mt-4 flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition-colors"
        >
          <Printer size={18} /> Drucken
        </button>
      </div>
    </div>
  )
}
