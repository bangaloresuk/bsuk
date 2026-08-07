// ============================================================
//  usePhotoGallery — photo fetch, upload, delete
// ============================================================
import React from 'react'
import { photoApi } from '../services/api.js'
import state from '../config/activeSuk.js'

// ------------------------------------------------------------
//  EXIF orientation fix
//  Phone cameras often save photos with the pixels "sideways"
//  and just set an EXIF Orientation tag telling viewers how to
//  rotate it. Not every device/browser respects that tag, which
//  is why the same photo looks fine on one phone and upside
//  down / sideways on another. To make it consistent everywhere,
//  we read the tag ourselves, draw the image onto a canvas with
//  the correct rotation baked into the actual pixels, and upload
//  that corrected version instead of the raw file.
// ------------------------------------------------------------

// Reads the EXIF Orientation value (1-8) directly from the JPEG bytes.
// Returns 1 (normal) if it can't find one, isn't a JPEG, etc.
function getExifOrientation(arrayBuffer) {
  const view = new DataView(arrayBuffer)
  if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) return 1 // not a JPEG

  let offset = 2
  while (offset < view.byteLength - 1) {
    const marker = view.getUint16(offset, false)
    offset += 2
    if (marker === 0xffe1) { // APP1 (EXIF) marker
      const exifLength = view.getUint16(offset, false)
      offset += 2
      if (view.getUint32(offset, false) !== 0x45786966) return 1 // "Exif"
      const tiffOffset = offset + 6
      const little = view.getUint16(tiffOffset, false) === 0x4949
      const firstIFDOffset = view.getUint32(tiffOffset + 4, little)
      const dirStart = tiffOffset + firstIFDOffset
      const entries = view.getUint16(dirStart, little)
      for (let i = 0; i < entries; i++) {
        const entryOffset = dirStart + 2 + i * 12
        if (view.getUint16(entryOffset, little) === 0x0112) { // Orientation tag
          return view.getUint16(entryOffset + 8, little)
        }
      }
      return 1
    } else if ((marker & 0xff00) !== 0xff00) {
      break
    } else {
      offset += view.getUint16(offset, false)
    }
  }
  return 1
}

// Draws the image onto a canvas, applying the transform that
// corrects for the given EXIF orientation, and returns a JPEG
// data URL with the rotation permanently baked into the pixels.
function correctImageOrientation(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = (ev) => {
      const arrayBuffer = ev.target.result
      const orientation = getExifOrientation(arrayBuffer)
      const blob = new Blob([arrayBuffer])
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        const canvas = document.createElement('canvas')
        const swapDims = orientation >= 5 && orientation <= 8
        canvas.width = swapDims ? height : width
        canvas.height = swapDims ? width : height
        const ctx = canvas.getContext('2d')

        switch (orientation) {
          case 2: ctx.transform(-1, 0, 0, 1, width, 0); break
          case 3: ctx.transform(-1, 0, 0, -1, width, height); break
          case 4: ctx.transform(1, 0, 0, -1, 0, height); break
          case 5: ctx.transform(0, 1, 1, 0, 0, 0); break
          case 6: ctx.transform(0, 1, -1, 0, height, 0); break
          case 7: ctx.transform(0, -1, -1, 0, height, width); break
          case 8: ctx.transform(0, -1, 1, 0, 0, width); break
          default: break // orientation 1 (or unknown): no change needed
        }

        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
      img.src = url
    }
    fileReader.onerror = () => reject(new Error('Could not read file'))
    fileReader.readAsArrayBuffer(file)
  })
}

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
      // Bake in the correct rotation before uploading, so the photo
      // displays right-side-up on every device, regardless of how
      // the uploading phone tagged its EXIF orientation.
      let dataUrl
      try {
        dataUrl = await correctImageOrientation(photoUpload.file)
      } catch (orientationErr) {
        // If orientation correction fails for any reason, fall back to
        // uploading the original file rather than blocking the upload.
        dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader()
          r.onload = (ev) => resolve(ev.target.result)
          r.onerror = reject
          r.readAsDataURL(photoUpload.file)
        })
      }

      const base64 = dataUrl.split(',')[1]
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