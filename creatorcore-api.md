# CreatorCore API Reference

**Base URL:** `/api`  
**Stack:** Express 5 · PostgreSQL · Gemini 2.5 Flash (text) · Gemini 2.5 Flash Image (image generation)

---

## Health

### GET /api/healthz
Check server status.

**Response 200:**
```json
{ "status": "ok" }
```

---

## Caption Generation

### POST /api/captions/generate-stream
Stream AI-generated captions, titles, hashtags, or bios via Server-Sent Events (SSE).

**Request body:**
```json
{
  "category": "gaming",
  "topic": "1v4 clutch in the final round",
  "type": "captions"
}
```

| Field | Type | Required | Values |
|---|---|---|---|
| category | string | yes | gaming, anime, attitude, motivation, sad, funny, romantic, free-fire, cinematic, youtube |
| topic | string | yes | Any text (max ~200 chars) |
| type | string | yes | captions, titles, hashtags, bio, all |

**Response:** `text/event-stream`

Each SSE event is one of:
```
data: {"type":"item","kind":"caption","text":"Never back down."}
data: {"type":"item","kind":"title","text":"THE IMPOSSIBLE 1v4"}
data: {"type":"item","kind":"hashtag","text":"#FreeFire"}
data: {"type":"item","kind":"bio","text":"Content creator..."}
data: {"type":"done"}
data: {"type":"error","error":"..."}
```

---

### POST /api/captions/generate
Non-streaming version — returns full result as JSON.

**Request body:** Same as `/generate-stream`

**Response 200:**
```json
{
  "captions": ["Never back down.", "..."],
  "titles": ["THE IMPOSSIBLE 1v4", "..."],
  "hashtags": ["#FreeFire", "..."],
  "bio": "Content creator..." ,
  "category": "gaming",
  "topic": "1v4 clutch in the final round",
  "generatedAt": "2026-05-27T20:00:00.000Z"
}
```

---

## Saved Captions

### GET /api/captions/saved
Return all saved captions.

**Response 200:**
```json
[
  {
    "id": 1,
    "text": "Never back down.",
    "category": "gaming",
    "type": "captions",
    "savedAt": "2026-05-27T20:00:00.000Z"
  }
]
```

---

### POST /api/captions/saved
Save a caption to the collection.

**Request body:**
```json
{
  "text": "Never back down.",
  "category": "gaming",
  "type": "captions"
}
```

**Response 201:** Returns the saved caption object (same shape as above).

---

### DELETE /api/captions/saved/:id
Delete a saved caption by ID.

**Response 204:** No content.  
**Response 404:** `{ "error": "Not found" }`

---

## History & Stats

### GET /api/captions/history
Return the recent generation history.

**Response 200:**
```json
[
  {
    "id": 1,
    "category": "gaming",
    "topic": "1v4 clutch",
    "type": "captions",
    "generatedAt": "2026-05-27T20:00:00.000Z",
    "resultSnapshot": "{\"captions\":[...]}"
  }
]
```

---

### GET /api/captions/stats
Return usage analytics.

**Response 200:**
```json
{
  "totalGenerations": 42,
  "totalSaved": 7,
  "topCategory": "gaming",
  "categoryCounts": {
    "gaming": 20,
    "anime": 10,
    "attitude": 5,
    "motivation": 7
  }
}
```

---

## Analyze / AI Thumbnail (Gemini Vision)

### POST /api/analyze/generate-thumbnail
Upload an image and stream back AI-generated creator assets (hooks, titles, captions, hashtags, layout ideas, color palette, scene analysis).

**Request body:**
```json
{
  "imageBase64": "<base64 string — NO data URI prefix>",
  "mimeType": "image/jpeg",
  "platform": "YouTube",
  "mood": "Rage",
  "style": "Anime Aura",
  "situation": "1v4 clutch revenge scene",
  "game": "Free Fire",
  "extraPrompt": "add cherry blossoms"
}
```

| Field | Type | Required | Values |
|---|---|---|---|
| imageBase64 | string | yes | Raw base64, no `data:image/...;base64,` prefix |
| mimeType | string | yes | image/jpeg, image/png, image/webp |
| platform | string | yes | YouTube, YouTube Shorts, Instagram, Reels, TikTok, Facebook, X/Twitter |
| mood | string | yes | Rage, Revenge, Dark, Emotional, Heroic, Funny, Clutch, Aggressive, Cinematic |
| style | string | yes | Anime Aura, Esports, Cinematic, Neon, Fire, Dark Mode, Hyper-realistic, Action Movie |
| situation | string | yes | Scene description / hook angle |
| game | string | yes | Game name or content context |
| extraPrompt | string | no | Extra visual instructions for image generation |

**Response:** `text/event-stream`

SSE event kinds:
```
data: {"type":"item","kind":"scene_analysis","text":"..."}
data: {"type":"item","kind":"thumbnail_text","text":"RAGE MODE"}
data: {"type":"item","kind":"layout_idea","text":"..."}
data: {"type":"item","kind":"color_palette","text":"red, black, gold"}
data: {"type":"item","kind":"hook","text":"..."}
data: {"type":"item","kind":"title","text":"..."}
data: {"type":"item","kind":"caption","text":"..."}
data: {"type":"item","kind":"hashtag","text":"#FreeFire"}
data: {"type":"item","kind":"cta","text":"..."}
data: {"type":"done"}
```

---

### POST /api/analyze/generate-image
Generate a fully AI-styled thumbnail image using Gemini image generation (image-to-image). Auto-saves to the gallery.

**Request body:** Same fields as `/analyze/generate-thumbnail`

**Response 200:**
```json
{
  "id": 12,
  "b64_json": "<base64 PNG>",
  "mimeType": "image/png"
}
```

**Response 400/500:** `{ "error": "..." }`

---

## Image Gallery

### GET /api/analyze/generated-images
List all saved AI-generated thumbnail images.

**Response 200:**
```json
[
  {
    "id": 12,
    "mimeType": "image/png",
    "platform": "YouTube",
    "mood": "Rage",
    "style": "Anime Aura",
    "game": "Free Fire",
    "situation": "clutch scene",
    "extraPrompt": "add lightning",
    "createdAt": "2026-05-27T20:00:00.000Z",
    "thumbnailB64": "<full base64 image data>"
  }
]
```

---

### GET /api/analyze/generated-images/:id
Get a single generated image with full base64 data.

**Response 200:** Same shape as single item above.  
**Response 404:** `{ "error": "Not found" }`

---

### DELETE /api/analyze/generated-images/:id
Delete a generated image from the gallery.

**Response 204:** No content.  
**Response 404:** `{ "error": "Not found" }`

---

## Error Format
All error responses follow this shape:
```json
{ "error": "Human-readable error message" }
```
