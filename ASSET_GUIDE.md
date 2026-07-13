# TAN Café Scene - Visual Asset Guide

This guide details the specifications, file structure, and design prompts for Nabil's 8 conversational character states. 

## 📂 File Directory Structure
All actual JPG/PNG illustrations or MP4 video loops should be saved inside `/public/scene/` at the root of your React development project.

```text
/public/scene/
├── welcome.jpg        # Also acts as "idle", "talking", "listening" fallback
├── thinking.jpg       # State for "thinking", "searching", "confused" fallback
└── coffee.jpg         # State for "coffee_invite" and "celebrate" fallback
```

*Note: The built-in Café Scene engine checks if these local files exist in your filesystem. If they are missing, it falls back to a highly polished CSS/SVG vector-illustrated representation of Nabil in a cozy coffee shop.*

---

## 📐 Sizing & Image Specs
- **Dimensions**: `1280px` wide by `720px` high (Standard 16:9 widescreen layout) or `1920px` by `1080px`.
- **Format**: Optimized `.jpg` (progressive encoding) or `.png` (for transparency overlays).
- **Style Tone**: Lo-fi anime, warm cafe timbers, amber glows, flat cel-shading, ink outlines.

---

## 🎨 Gemini Image Generation Prompts (16:9 Aspect Ratio)

If you are using Gemini or an external generator to render these scenes, use the following structured prompts:

### 1. Welcome / Idle / Talking / Listening (`welcome.jpg`)
> **Prompt**: `A medium shot, widescreen 16:9, anime cel-shaded illustration of a cozy lo-fi coffee shop. A young man (Nabil) with fluffy curly dark hair, black-rimmed rectangular glasses, and a neatly trimmed full beard is smiling warmly, waving hello with his right hand. He is wearing a simple black crew-neck t-shirt. The background is a warm, inviting café with wooden shelves holding ceramic mugs, a chrome espresso machine, potted green plants, and glowing amber pendant light bulbs. Nostalgic aesthetic, soft brown and tan tones, bold outlines, highly detailed visual novel style --ar 16:9`

### 2. Thinking / Deep Focus (`thinking.jpg`)
> **Prompt**: `A widescreen 16:9, medium shot, anime cel-shaded illustration of a cozy lo-fi coffee shop. A young man (Nabil) with fluffy curly dark hair, black glasses, and a neatly trimmed full beard is looking thoughtful, resting his hand under his chin in a thinking pose. He is wearing a black crew-neck t-shirt. In the warm background, shelves hold coffee beans, mugs, and glowing golden pendant lights. Mild chalkboard menu on the side. High detailed visual novel asset, cel-shading --ar 16:9`

### 3. Coffee Invite / Celebrate (`coffee.jpg`)
> **Prompt**: `A widescreen 16:9, medium shot, anime cel-shaded illustration of a cozy coffee shop. A young man (Nabil) with fluffy curly dark hair, black rectangular glasses, and a neatly trimmed full beard is holding up a steaming ceramic coffee mug toward the viewer with a cheerful, inviting smile. He is wearing a black crew-neck t-shirt. The background is a warm-toned, comforting café with glowing Edison bulbs, wood paneling, and floating warm steam. Beautiful visual novel illustration --ar 16:9`
