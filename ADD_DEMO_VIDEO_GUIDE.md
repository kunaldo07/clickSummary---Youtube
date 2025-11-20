# How to Add Your Demo Video to the Hero Section

## ✅ Changes Made

I've added a demo video player to your hero section that will:
- Auto-play on page load (muted)
- Loop continuously
- Display with a beautiful shadow and rounded corners
- Animate in smoothly after the CTA buttons
- Be responsive on mobile devices

## 📹 Steps to Add Your Video

### 1. Prepare Your Video File

Convert your demo video to web-optimized formats for best compatibility:

**Recommended formats:**
- **MP4** (H.264 codec) - Primary format, works on all browsers
- **WebM** (optional) - Smaller file size, good for modern browsers

**Optimization tips:**
- Keep file size under 10MB for fast loading
- Recommended resolution: 1920x1080 or 1280x720
- Use a tool like HandBrake or FFmpeg to compress

**Example FFmpeg commands:**
```bash
# Convert to optimized MP4
ffmpeg -i your-demo.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k demo-video.mp4

# Convert to WebM (optional)
ffmpeg -i your-demo.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus demo-video.webm
```

### 2. Add Video Files to Public Folder

Copy your video file(s) to:
```
/Users/kbadole/Documents/projects/youtube-extension-2/frontend/public/
```

**Required files:**
- `demo-video.mp4` - Your main video file

**Optional files:**
- `demo-video.webm` - Alternative format for better compression
- `demo-thumbnail.jpg` - Poster image shown before video loads (recommended)

### 3. Create a Thumbnail (Optional but Recommended)

Create a thumbnail image from your video:
- Take a screenshot of an interesting frame from your video
- Save it as `demo-thumbnail.jpg`
- Recommended size: 1920x1080 or 1280x720
- Place it in the same `/frontend/public/` folder

### 4. Test Your Implementation

After adding the files, test your website:

```bash
cd /Users/kbadole/Documents/projects/youtube-extension-2/frontend
npm run dev
```

Visit `http://localhost:3000` and check:
- ✅ Video loads and plays automatically
- ✅ Video is muted (required for autoplay)
- ✅ Video loops continuously
- ✅ Thumbnail shows while loading (if added)
- ✅ Video looks good on mobile

## 🎨 Customization Options

### Change Video Behavior

Edit `/frontend/src/app/HomePageClient.js` line 757-767:

```javascript
<HeroDemoVideo
  autoPlay        // Remove to disable autoplay
  muted          // Required for autoplay to work
  loop           // Remove to play only once
  playsInline    // Required for mobile autoplay
  controls       // Add to show play/pause controls
  poster="/demo-thumbnail.jpg"
>
```

### Adjust Video Size

Edit the `HeroDemoContainer` styled component (line 164-177):

```javascript
const HeroDemoContainer = styled(motion.div)`
  max-width: 900px;  // Change this to adjust width
  margin: 64px auto 0;  // Adjust top margin
  // ... rest of styles
`;
```

### Change Animation

Edit the animation props (line 753-755):

```javascript
<HeroDemoContainer
  initial={{ opacity: 0, y: 50 }}  // Start state
  animate={{ opacity: 1, y: 0 }}   // End state
  transition={{ duration: 0.8, delay: 0.4 }}  // Timing
>
```

## 🚀 Alternative: Use YouTube Video

If you prefer to embed your demo from YouTube instead:

1. Upload your video to YouTube
2. Get the video ID from the URL (e.g., `dQw4w9WgXcQ` from `youtube.com/watch?v=dQw4w9WgXcQ`)
3. Replace the video player code with:

```javascript
<HeroDemoContainer
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.4 }}
>
  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
    <iframe
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '24px' }}
      src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=YOUR_VIDEO_ID"
      title="Product Demo"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
</HeroDemoContainer>
```

## 📁 File Structure

```
frontend/
├── public/
│   ├── demo-video.mp4          ← Add your video here
│   ├── demo-video.webm         ← Optional alternative format
│   └── demo-thumbnail.jpg      ← Optional poster image
└── src/
    └── app/
        └── HomePageClient.js   ← Video player code is here
```

## 🐛 Troubleshooting

**Video not playing:**
- Ensure file is named exactly `demo-video.mp4`
- Check browser console for errors
- Verify file is in `/frontend/public/` folder
- Try without `autoPlay` and add `controls` to test manually

**Video too large:**
- Compress using FFmpeg (see commands above)
- Consider using YouTube embed instead
- Use WebM format for smaller file size

**Autoplay not working:**
- Autoplay requires `muted` attribute
- Some browsers block autoplay - this is normal
- Add `playsInline` for mobile support

**Video not showing on deployed site:**
- Ensure video is committed to git
- Check deployment build includes public folder
- Verify file paths are correct (no leading `/` issues)

## 📝 Notes

- The video will autoplay muted to comply with browser policies
- Users can unmute by clicking if you add `controls` attribute
- Consider file size for mobile users (aim for <10MB)
- Test on multiple devices and browsers
