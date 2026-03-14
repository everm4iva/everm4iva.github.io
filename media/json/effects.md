# Audio-Synced Visual Effects System
Real-time visual effects engine that synchronizes with musical audio using Web Audio API frequency analysis.

**Built with:** Web Audio API (AnalyserNode), vanilla JavaScript, and reactive intensity ranges

---

## Core Features

### Audio Synchronization
- **Real-time frequency analysis** using 256-bin FFT (Fast Fourier Transform)
- **Bass frequency tracking** (0-5 Hz bands) for detecting low-end energy
- **Beat detection** (combination of bass + mid frequencies) for synchronized pulses
- **Adaptive response** scales effect intensity based on live audio data

### Duration Modes
```javascript
// Fixed Duration (seconds) - Effect fades out after N seconds
"duration": 2.5

// Consistent Duration - Effect runs indefinitely until audio pauses/ends
"duration": "consistent"
```

### Advanced Intensity Control
Instead of a single `intensity` value, effects now support intelligent intensity ranges:

```javascript
{
  "intensity": 0.5,        // Average/baseline intensity
  "minIntensity": 0.2,     // Minimum when audio is quiet
  "maxIntensity": 0.8      // Maximum when audio has strong energy
}
```

The effect dynamically scales between min and max based on audio energy, maintaining a smooth response to the music.

### Sensitivity & Trigger Types
Control how responsive effects are to audio:

```javascript
{
  "sensitivity": 0.8,           // 0-1: How quickly effects respond
                                // 0 = no audio response
                                // 1 = full responsiveness
  "triggerType": "bass" | "beat"
                                // "bass": Respond to low frequencies
                                // "beat": Respond to bass + mid frequencies
}
```

---

## Effect Types

### 1. **Screenshake**
Shakes the viewport to create impact and immersion.

**Parameters:**
```javascript
{
  "screenshake": {
    "intensity": 0.5,
    "minIntensity": 0.2,
    "maxIntensity": 0.8,
    "duration": "consistent" | 2.5,
    "sensitivity": 0.8,
    "triggerType": "bass",
    "syncToAudio": true
  }
}
```

**Behavior:**
- Generates random X/Y offsets up to 20px per frame
- Intensity scales between min/max based on bass energy
- With `"triggerType": "bass"`, triggers strongly on kick drums and low-end hits
- With `"consistent"` duration, continues throughout song playback

**Example:** FANG DUMMY - KNIFE BRIDE

---

### 2. **Color Overlay**
Applies a warm (orange) or cold (blue) color tint with fade effects.

**Parameters:**
```javascript
{
  "colorOverlay": {
    "type": "warm" | "cold",
    "intensity": 0.3,
    "minIntensity": 0.1,
    "maxIntensity": 0.5,
    "duration": 2.0,
    "sensitivity": 1.0,
    "triggerType": "beat",
    "syncToAudio": true
  }
}
```

**Colors:**
- `"warm"`: `rgba(255, 100, 0, opacity)` — Orange/sunset tint
- `"cold"`: `rgba(0, 150, 255, opacity)` — Blue/ice tint

**Behavior:**
- Fades in with CSS animation
- Auto-removes after duration (unless duration is `"consistent"`)
- Opacity scales between min/max based on audio

---

### 3. **Image Overlay**
Projects a custom image across the viewport with blend modes.

**Parameters:**
```javascript
{
  "imageOverlay": {
    "imageSrc": "./path/to/image.png",
    "intensity": 0.5,
    "mode": "screen" | "multiply" | "overlay",
    "duration": "consistent" | 3.0,
    "sensitivity": 0.9,
    "triggerType": "beat",
    "syncToAudio": true
  }
}
```

**Blend Modes:**
- `"screen"`: Brightens the page (light images work best)
- `"multiply"`: Darkens the page (dark images work best)
- `"overlay"`: Combines multiply + screen for contrast

**Use Cases:**
- Lens flares or light streaks
- Texture overlays
- Logo/watermark effects
- Animated patterns

---

### 4. **Distortion**
Glitch effect with audio-synced clipping and frequency modulation.

**Parameters:**
```javascript
{
  "distortion": {
    "intensity": 0.4,
    "minIntensity": 0.1,
    "maxIntensity": 0.7,
    "frequency": "low" | "medium" | "high",
    "duration": 4.0,
    "sensitivity": 0.7,
    "triggerType": "beat",
    "syncToAudio": true
  }
}
```

**Frequencies:**
- `"low"`: 100ms oscillation (slow distortion)
- `"medium"`: 50ms oscillation (moderate glitch)
- `"high"`: 20ms oscillation (fast glitch)

**Behavior:**
- Uses `clip-path` to create geometric distortion
- Clip intensity scales based on audio energy
- Frequency modulation syncs glitch rate to beat
- Creates RGB gradient background with `mix-blend-mode: screen`

**Example:** Pry - Marionette, CATHODE RAY TUNE

---

### 5. **Pulse**
Rhythmic strobe-like pulsing synchronized to audio.

**Parameters:**
```javascript
{
  "pulse": {
    "intensity": 0.4,
    "minIntensity": 0.15,
    "maxIntensity": 0.65,
    "speed": "slow" | "medium" | "fast" | 0.5,
    "color": "white" | "color",
    "duration": "consistent" | 5.0,
    "sensitivity": 0.8,
    "triggerType": "beat",
    "syncToAudio": true
  }
}
```

**Speeds:**
- `"slow"`: 1 second per cycle
- `"medium"`: 0.5 seconds per cycle
- `"fast"`: 0.2 seconds per cycle
- `number`: Custom speed in seconds (e.g., `0.3`)

**Colors:**
- `"white"`: Pure white pulsing overlay
- `"color"`: Warm orange/amber color

**Behavior:**
- Uses sine wave for smooth opacity transitions
- Syncs to audio playback time when `syncToAudio: true`
- Pulse intensity modulates based on beat energy
- Perfect for highlighting audio peaks

**Example:** CATHODE RAY TUNE, HOOLIGANG

---

## Configuration Examples

### Example 1: Heavy Metal Track with Bass-Driven Screenshake

```json
{
  "title": "FANG DUMMY",
  "artist": "KNIFE BRIDE",
  "effects": {
    "screenshake": {
      "intensity": 0.5,
      "minIntensity": 0.2,
      "maxIntensity": 0.8,
      "duration": "consistent",
      "sensitivity": 0.8,
      "triggerType": "bass",
      "syncToAudio": true
    }
  }
}
```
**Result:** Shakes intensify on kick drums, continue throughout the entire song.

---

### Example 2: Breakcore with Beat-Tracking Distortion & Pulse

```json
{
  "title": "CATHODE RAY TUNE",
  "artist": "telemist",
  "effects": {
    "distortion": {
      "intensity": 0.5,
      "minIntensity": 0.2,
      "maxIntensity": 0.8,
      "frequency": "high",
      "duration": 4.0,
      "sensitivity": 0.8,
      "triggerType": "beat",
      "syncToAudio": true
    },
    "pulse": {
      "intensity": 0.4,
      "minIntensity": 0.15,
      "maxIntensity": 0.65,
      "speed": "fast",
      "duration": 4.0,
      "sensitivity": 0.8,
      "triggerType": "beat",
      "syncToAudio": true
    }
  }
}
```
**Result:** Fast glitching with intense pulsing that responds to beat energy.

---

### Example 3: Progressive Build with Intensity Scaling

```json
{
  "title": "Progressive Track",
  "effects": {
    "colorOverlay": {
      "type": "cold",
      "intensity": 0.2,
      "minIntensity": 0.05,
      "maxIntensity": 0.4,
      "duration": "consistent",
      "sensitivity": 0.9,
      "triggerType": "beat"
    },
    "screenshake": {
      "intensity": 0.3,
      "minIntensity": 0.05,
      "maxIntensity": 0.6,
      "duration": "consistent",
      "sensitivity": 0.8,
      "triggerType": "bass"
    }
  }
}
```
**Result:** Subtle at quiet sections, intensifies during builds, varies throughout song.

---

## Implementation Details

### How Intensity Ranges Work

1. **During quiet passages:** Effect uses `minIntensity` value
2. **During peak energy:** Effect uses `maxIntensity` value
3. **In between:** Effect interpolates between min/max based on audio energy

```
Quiet: ████░░░░░░ → minIntensity (0.2)
Medium: ███████░░░ → median (0.5)
Peaks: ██████████ → maxIntensity (0.8)
```

### Sensitivity Scaling

Sensitivity uses exponential scaling for responsive feel:
```
scaledEnergy = Math.pow(rawAudioEnergy, 2 - sensitivity)
```

- **Low sensitivity (0.3):** Changes are subtle; audio must be very loud to trigger
- **Medium sensitivity (0.6):** Balanced; most audio peaks trigger noticeable effects
- **High sensitivity (0.9):** Very responsive; even quiet passages cause visible effects

### Web Audio API Flow

1. **Initialization:** When audio element plays, `AnalyserNode` connects to audio stream
2. **Analysis:** Every frame, frequency data is extracted as 256-bin array
3. **Feature Extraction:**
   - Bass energy: Average of first 5 frequency bins
   - Beat energy: Bass + weighted mid-range (bins 20-60)
4. **Effect Modulation:** Audio energy scales intensity between min/max
5. **Rendering:** CSS transforms/filters applied each animation frame

---

## Performance Considerations

- **Frame Rate:** Effects update at 60fps (requestAnimationFrame)
- **Memory:** Each effect is stored in a Map, cleared on audio pause
- **Frequency Analysis:** FFT computed once per frame (~low overhead)
- **CSS:** Uses hardware-accelerated transforms where possible

**Optimization Tips:**
- Avoid running 5+ effects simultaneously on slower devices
- Use shorter fixed durations instead of `"consistent"` for performance
- Prioritize bass/beat triggers over complex image overlays

---

##  Code Architecture

### EffectSystem Class

**Core Methods:**
- `initAudioContext()` — Initializes Web Audio API and AnalyserNode
- `getBassEnergy()` — Returns 0-1 value from bass frequencies
- `getAudioEnergy(triggerType)` — Gets energy by trigger type
- `parseIntensity(config)` — Converts min/avg/max to usable values
- `applySensitivity(energy, sensitivity)` — Scales audio response
- `applyEffects(track)` — Applies all effects from track config
- `clearAllEffects()` — Removes all active effects on pause/end

**Per-Effect Methods:**
- `addScreenshake()`, `animateScreenshake()`
- `addColorOverlay()`
- `addImageOverlay()`
- `addDistortion()`, `animateDistortion()`
- `addPulse()`, `animatePulse()`

### Integration Points

**In audiolib.js:**
```javascript
selectTrack(index) {
  // ... existing code ...
  window.effectSystem.applyEffects(track); // Apply effects on selection
}

// Cleanup on pause/close
audioElement.addEventListener('pause', () => {
  window.effectSystem.clearAllEffects();
});
```

**In index.html:**
```html
<script src="media/scripts/effectsystem.js"></script>
<script src="media/scripts/effectsystem.css"></script>
<script>
  // Instantiate on page load
  window.effectSystem = new EffectSystem(document.querySelector('.audio-element'));
</script>
```

---

## Future Enhancement Ideas

- **Beat Detection Algorithm** — Use autocorrelation to detect actual BPM instead of raw frequency
- **Keyframe-Based Effects** — Chain multiple effects over time
- **3D Transforms** — Use `perspective()` and `rotateX/Y` for 3D shakes
- **Audio Synthesis** — Generate sound effects based on visual events
- **Machine Learning** — Predict optimal effects based on audio characteristics
- **User Presets** — Save/load effect configurations

---

## Remember

We're really proud of what we built here! This effects system:
- ✅ Synchronizes with live audio in real-time
- ✅ Responds dynamically to frequency content
- ✅ Supports indefinite effects with `"consistent"` duration
- ✅ Offers fine-grained control with intensity ranges
- ✅ Provides responsive sensitivity scaling
- ✅ Differentiates between bass and beat triggers
- ✅ Works across all modern browsers with Web Audio API support

The system is production-ready and extensible—add your own effect types by following the same patterns!

---

**Last Updated:** March 14, 2026
**Status:** Complete & Production-Ready ✨
