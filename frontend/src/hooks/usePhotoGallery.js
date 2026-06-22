// ============================================================
//  usePhotoGallery — photo fetch, upload, delete
// ============================================================
import React from 'react'
import { photoApi } from '../services/api.js'
import state from '../config/activeSuk.js'

export function usePhotoGallery({ isConfigured }) {
  const [photos,        setPhotos]        = React.useState([])
  const [photosLoading, setPhotosLoading] = React.useState(false)
  const [photoUpload,   setPhotoUpload]   = React.useState({ caption:'', uploader:'', file:null, preview:null })
  const [photoUploading,setPhotoUploading]= React.useState(false)
  const [photoMsg,      setPhotoMsg]      = React.useState('')

  const fetchPhotos = React.useCallback(async () => {
    if (!isConfigured) return
    setPhotosLoading(true)
    try {
      const d = await photoApi.getAll()
      if (d.success && Array.isArray(d.data)) setPhotos(d.data)
      else if (Array.isArray(d)) setPhotos(d)
    } catch (e) { /* silent */ }
    setPhotosLoading(false)
  }, [isConfigured])

  React.useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return
    try {
      const res = await photoApi.delete(photoId)
      if (res.success) {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setPhotoMsg('✅ Photo deleted.')
      } else {
        setPhotoMsg('⚠️ ' + (res.message || 'Delete failed.'))
      }
    } catch (e) {
      setPhotoMsg('⚠️ Delete failed. Please try again.')
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoUpload.file)             { setPhotoMsg('⚠️ Please select a photo first.'); return }
    if (!photoUpload.uploader.trim())  { setPhotoMsg('⚠️ Please enter your name before uploading.'); return }
    if (!isConfigured)                 { setPhotoMsg('⚠️ Script URL not configured.'); return }
    setPhotoUploading(true); setPhotoMsg('')
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const res = await photoApi.upload(
          base64,
          photoUpload.file.name,
          photoUpload.caption.trim(),
          photoUpload.uploader.trim() || 'Anonymous'
        )
        if (res.success) {
          const galleryUrl = (() => {
            try {
              const base = window.location.origin + window.location.pathname
              return `${base}?suk=${encodeURIComponent(state.ACTIVE_SUK ? state.ACTIVE_SUK.key : '')}&open=gallery`
            } catch (e) { return '' }
          })()
          setPhotoMsg('✅ Photo uploaded! Share the gallery with family 🙏\n' + galleryUrl)
          setPhotoUpload({ caption:'', uploader:'', file:null, preview:null })
          fetchPhotos()
        } else {
          setPhotoMsg('⚠️ ' + (res.message || 'Upload failed'))
        }
        setPhotoUploading(false)
      }
      reader.readAsDataURL(photoUpload.file)
    } catch (e) {
      setPhotoMsg('⚠️ Upload failed. Please try again.')
      setPhotoUploading(false)
    }
  }

  return {
    photos, photosLoading,
    photoUpload, setPhotoUpload,
    photoUploading,
    photoMsg, setPhotoMsg,
    fetchPhotos,
    handleDeletePhoto,
    handlePhotoUpload,
  }
}
