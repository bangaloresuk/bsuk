// ============================================================
//  features/gallery.js
//  React component: PhotoGalleryTab
//  Upload photos to Google Drive via Apps Script + view grid.
//  Props: { api, sukKey }
//  FIX: Now fetches its own photos instead of relying on
//       undefined `photos`, `loading`, `onRefetch` variables.
// ============================================================

"use strict";

const { createElement: h, useState, useEffect, useCallback } = React;

window.PhotoGalleryTab = function PhotoGalleryTab({ api, sukKey }) {
  const [upload,    setUpload]    = useState({ caption:"", uploader:"", file:null, preview:null });
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState("");

  // FIX: local state for photos instead of undefined outer vars
  const [photos,  setPhotos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoErr, setPhotoErr] = useState("");

  // ── Fetch photos ──────────────────────────────────────────
  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setPhotoErr("");
    try {
      const res = await api.photos.getAll();
      setPhotos(res.data || []);
    } catch(e) {
      setPhotoErr("Could not load photos.");
    } finally {
      setLoading(false);
    }
  }, [sukKey]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleUpload = async () => {
    if (!upload.file) { setMsg("⚠️ Please select a photo first."); return; }

    setUploading(true); setMsg("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target.result.split(",")[1];
        const res = await api.photos.upload(
          base64, upload.file.name,
          upload.caption.trim(),
          upload.uploader.trim() || "Anonymous"
        );
        if (res.success) {
          const galleryUrl = (() => {
            try {
              const base = window.location.origin + window.location.pathname;
              return `${base}?suk=${encodeURIComponent(window.ACTIVE_SUK ? window.ACTIVE_SUK.key : "")}&open=gallery`;
            } catch(e) { return ""; }
          })();
          setMsg("✅ Photo uploaded! Share the gallery with family 🙏\n" + galleryUrl);
          setUpload({ caption:"", uploader:"", file:null, preview:null });
          loadPhotos(); // FIX: use local refetch function
        } else { setMsg("⚠️ " + (res.message || "Upload failed")); }
      } catch(e) { setMsg("⚠️ Upload failed. Please try again."); }
      setUploading(false);
    };
    reader.readAsDataURL(upload.file);
  };

  const handlePhotoShare = (p) => {
    const galleryUrl = (() => {
      try {
        const base = window.location.origin + window.location.pathname;
        return `${base}?suk=${encodeURIComponent(window.ACTIVE_SUK ? window.ACTIVE_SUK.key : "")}&open=gallery`;
      } catch(e) { return ""; }
    })();
    const text = [
      "🌸 *Jayguru* 🙏", "",
      p.caption ? p.caption : "A sacred prayer moment 🪷",
      p.uploader ? `— 🙏 ${p.uploader}` : "",
      "", "📸 View the Prayer Photo Gallery:", galleryUrl, "",
      `🙏 *${window.ACTIVE_SUK ? window.sukLabel(window.ACTIVE_SUK) : "Satsang Upayojana Kendra"}*`,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      navigator.share({ title:"🌸 Jayguru — Prayer Gallery", text }).catch(() => {});
    } else {
      window.shareCopy(text);
    }
  };

  return h("div", { style:{ display:"flex", flexDirection:"column", gap:16 } },

    // Header
    h("div", { className:"card", style:{ textAlign:"center", padding:"22px 16px 18px" } },
      h("div", { style:{ fontSize:44, marginBottom:8,
        filter:"drop-shadow(0 0 18px rgba(255,160,200,0.5))",
        animation:"floatEmoji 3s ease-in-out infinite alternate" } }, "🌸"),
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:18, fontWeight:800, marginBottom:4 } },
        "Prayer Photo Gallery"),
      h("div", { style:{ fontSize:12, color:"rgba(29,78,216,0.45)", lineHeight:1.7 } },
        "Upload & cherish sacred prayer moments"),
      h("div", { className:"blue-line", style:{ marginTop:14 } })
    ),

    // Upload form
    h("div", { className:"card" },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:14,
        fontWeight:700, marginBottom:14 } }, "📸 Upload a Photo"),
      h("div", { style:{ display:"flex", flexDirection:"column", gap:13 } },

        h("div", null,
          h("label", { className:"divine-label" }, "Select Photo"),
          h("label", {
            style:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              gap:8, padding:"20px 16px", borderRadius:14,
              border:"2px dashed rgba(59,130,246,0.3)",
              background:"rgba(239,246,255,0.5)", cursor:"pointer", textAlign:"center",
              position:"relative" },
          },
            upload.preview
              ? h("img", { src:upload.preview, alt:"preview",
                  style:{ maxWidth:"100%", maxHeight:200, borderRadius:10,
                    objectFit:"cover", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" } })
              : h("div", null,
                  h("div", { style:{ fontSize:36 } }, "🌸"),
                  h("div", { style:{ fontSize:13, color:"rgba(29,78,216,0.5)", fontWeight:600, marginTop:6 } },
                    "Tap to choose a photo"),
                  h("div", { style:{ fontSize:11, color:"rgba(29,78,216,0.35)", marginTop:4 } },
                    "JPG, PNG up to 5MB")
                ),
            h("input", {
              type:"file", accept:"image/*",
              style:{ position:"absolute", opacity:0, width:0, height:0 },
              onChange: e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { setMsg("⚠️ Photo must be under 5MB."); return; }
                setMsg("");
                const reader = new FileReader();
                reader.onload = ev => setUpload(u => ({ ...u, file, preview:ev.target.result }));
                reader.readAsDataURL(file);
              },
            })
          )
        ),

        h("div", null,
          h("label", { className:"divine-label" }, "Caption (optional)"),
          h("input", { className:"divine-input", placeholder:"e.g. Morning prayer at home, Feb 2026",
            value:upload.caption, onChange:e=>setUpload(u=>({...u,caption:e.target.value})) })),

        h("div", null,
          h("label", { className:"divine-label" }, "Your Name (optional)"),
          h("input", { className:"divine-input", placeholder:"e.g. Bannerghatta SUK",
            value:upload.uploader, onChange:e=>setUpload(u=>({...u,uploader:e.target.value})) })),

        msg && h("div", { style:{ padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600,
          whiteSpace:"pre-wrap",
          background:msg.startsWith("✅")?"#d1fae5":"#fef3c7",
          color:msg.startsWith("✅")?"#065f46":"#92400e" } }, msg),

        h("button", { onClick:handleUpload, disabled:uploading||!upload.file, className:"submit-btn" },
          uploading ? "⏳ Uploading..." : "🌸 Upload Photo"),
      )
    ),

    // Photo grid
    h("div", { className:"card" },
      h("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 } },
        h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:14, fontWeight:700 } },
          "🌸 Prayer Photo Gallery",
          !loading && photos.length > 0 && h("span", { style:{ fontSize:11, color:"rgba(29,78,216,0.45)",
            fontWeight:600, marginLeft:8 } }, `(${photos.length} photos)`)
        ),
        !loading && h("button", { onClick:loadPhotos,
          style:{ background:"none", border:"1px solid rgba(59,130,246,0.2)", borderRadius:8,
            padding:"4px 10px", fontSize:11, cursor:"pointer", color:"rgba(29,78,216,0.6)", fontWeight:600 } },
          "↻ Refresh")
      ),

      loading
        ? h("div", { style:{ textAlign:"center", padding:"24px", color:"rgba(29,78,216,0.4)", fontSize:13 } },
            "⏳ Loading gallery...")
        : photoErr
          ? h("div", { style:{ textAlign:"center", padding:"20px", color:"#b91c1c", fontSize:13 } },
              h("div", null, "⚠️ " + photoErr),
              h("button", { onClick:loadPhotos,
                style:{ marginTop:10, padding:"7px 14px", border:"1px solid #fca5a5",
                  borderRadius:8, background:"#fff", color:"#dc2626",
                  fontWeight:700, fontSize:12, cursor:"pointer" } }, "Try Again"))
          : photos.length === 0
            ? h("div", { style:{ textAlign:"center", padding:"30px 0" } },
                h("div", { style:{ fontSize:40, marginBottom:10, filter:"saturate(0) brightness(2.2)" } }, "🪷"),
                h("div", { style:{ color:"rgba(29,78,216,0.35)", fontSize:13 } },
                  "No photos yet — be the first to share a sacred moment 🙏")
              )
            : h("div", { style:{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 } },
                photos.map((p, i) =>
                  h("div", { key:p.id||i, style:{ borderRadius:12, overflow:"hidden",
                    border:"1px solid rgba(59,130,246,0.15)",
                    background:"rgba(239,246,255,0.4)",
                    display:"flex", flexDirection:"column" } },
                    h("img", { src:p.url, alt:p.caption||"Prayer", loading:"lazy",
                      style:{ width:"100%", aspectRatio:"1/1", objectFit:"cover", display:"block" } }),
                    (p.caption||p.uploader||p.date) && h("div", { style:{ padding:"8px 10px 4px" } },
                      p.caption && h("div", { style:{ fontSize:11, color:"#1e3a8a", fontWeight:600,
                        lineHeight:1.4, marginBottom:2 } }, p.caption),
                      p.uploader && h("div", { style:{ fontSize:10, color:"rgba(29,78,216,0.45)" } }, `🙏 ${p.uploader}`),
                      p.date && h("div", { style:{ fontSize:10, color:"rgba(29,78,216,0.3)", marginTop:2 } },
                        window.cleanPhotoDate(p.date))
                    ),
                    h("button", { onClick:()=>handlePhotoShare(p),
                      style:{ marginTop:"auto", padding:"8px", border:"none",
                        borderTop:"1px solid rgba(59,130,246,0.08)",
                        background:"transparent", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        gap:5, fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.55)" },
                      onMouseEnter:e=>e.currentTarget.style.background="rgba(29,78,216,0.05)",
                      onMouseLeave:e=>e.currentTarget.style.background="transparent",
                    }, h("span", { style:{ fontSize:14 } }, "📤"), "Share")
                  )
                )
              )
    )
  );
};