'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Camera, Upload, RefreshCw, Check, X, AlertCircle, Trash2, Sparkles, User } from 'lucide-react'

interface StudentPhotoCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSavePhoto: (photoBase64: string | null) => Promise<void> | void
  studentName?: string
  studentRegNo?: string
  currentPhoto?: string | null
  title?: string
}

export function StudentPhotoCaptureModal({
  isOpen,
  onClose,
  onSavePhoto,
  studentName = 'Student',
  studentRegNo,
  currentPhoto = null,
  title = 'Student Passport Photo'
}: StudentPhotoCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(currentPhoto)
  const [isSaving, setIsSaving] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start webcam when camera tab is active
  const startCamera = async () => {
    setCameraError(null)
    setIsStartingCamera(true)
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser or use file upload.'
          : 'Unable to access camera on this device. Please use the file upload option.'
      )
    } finally {
      setIsStartingCamera(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(currentPhoto)
      if (activeTab === 'camera') {
        startCamera()
      }
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, activeTab])

  // Snap photo from live video feed
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640)
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Center crop to 1:1 passport square
    const startX = (video.videoWidth - size) / 2
    const startY = (video.videoHeight - size) / 2

    // Mirror image for natural selfie feel
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size)

    const base64 = canvas.toDataURL('image/jpeg', 0.88)
    setCapturedPhoto(base64)
  }

  const handleRetake = () => {
    setCapturedPhoto(null)
    if (!stream) {
      startCamera()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress and square-crop via canvas
        const canvas = document.createElement('canvas')
        const maxDim = 800
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          const base64 = canvas.toDataURL('image/jpeg', 0.88)
          setCapturedPhoto(base64)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSavePhoto(capturedPhoto)
      onClose()
    } catch (err: any) {
      alert(err?.message || 'Failed to save student photo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = () => {
    setCapturedPhoto(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {studentName} {studentRegNo ? `• ${studentRegNo}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-5 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera')
              setCapturedPhoto(null)
              startCamera()
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera size={15} /> Live Webcam Snap
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload')
              stopCamera()
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload size={15} /> Upload Image File
          </button>
        </div>

        {/* Body Canvas / Video / Preview Area */}
        <div className="p-5 space-y-4">
          {activeTab === 'camera' ? (
            <div>
              {capturedPhoto ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-md">
                    <img
                      src={capturedPhoto}
                      alt="Captured Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Check size={12} /> Captured
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw size={14} /> Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {cameraError ? (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3 w-full">
                      <AlertCircle size={28} className="mx-auto text-amber-600" />
                      <p className="text-xs text-amber-800 font-medium">{cameraError}</p>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw size={14} /> Retry Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload size={14} /> Switch to Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-72 h-72 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-300 flex items-center justify-center shadow-inner">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      {/* Passport Guide Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-56 rounded-[50%] border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                      </div>
                      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                        <span className="bg-slate-900/80 text-white/90 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs">
                          Align face inside oval guide
                        </span>
                      </div>
                    </div>
                  )}

                  {!cameraError && (
                    <button
                      type="button"
                      onClick={handleSnap}
                      disabled={isStartingCamera || !stream}
                      className="w-full max-w-xs py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Camera size={16} /> Snap Passport Photo
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {capturedPhoto ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                    <img
                      src={capturedPhoto}
                      alt="Uploaded Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload size={14} /> Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl text-center space-y-2 cursor-pointer transition"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to choose or drop student photo
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WEBP (Max 5MB)</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Hidden Canvas for Snap Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={15} className="animate-spin text-amber-400" />
            ) : (
              <Check size={15} className="text-emerald-400" />
            )}
            {capturedPhoto ? 'Apply & Save Photo' : 'Remove Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}
