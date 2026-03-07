# Classes Folder - The Brain of OceanBoard!

## What's This Folder About?

All the JavaScript logic lives here! This is where the magic happens behind the scenes. Think of it as the puppet master pulling all the strings!

## Subfolders

### `attributes/`

Handles file attribute parsing and validation:

-   `parser.js` - Parses markdown attributes and metadata from files
-   `validation.js` - Validates file attributes and ensures data integrity
-   Think of it like giving your files superpowers with metadata!

### `config/`

Configuration and version management:

-   `version.js` - Manages application version information
-   Tracks current version for update notifications

### `editors/`

Contains all the editor-related code:

-   `markdowneditor.js` - The split-pane Markdown editor with toolbar
-   `tabsystem.js` - Tab management (open, close, switch)
-   `settingswindow.js` - Opens settings in a popup window
-   `settingsapplier.js` - Applies settings in real-time (live updates!)
-   `mediarenderer.js` - Custom renderer for media elements in markdown

### `files/`

-   `filetypes.js` - Determines what icon and color each file type gets
    -   Episode (EP) = blue
    -   Character (C) = green
    -   Object (O) = orange
    -   Scene (SC) = purple
    -   Action (A) = red
    -   Attribute (AT) = yellow

### `filesystem/`

The backbone of the entire system:

-   `seriessystem.js` - Manages multiple series (workspaces)
-   `storage.js` - Saves/loads everything to localStorage
-   `storagemanager.js` - Monitors storage usage and quota
-   `dragdrop.js` - Makes things draggable (desktop & mobile!)
-   `sidebaractions.js` - Handles sidebar button clicks
-   `contextmenu.js` - Right-click menus for desktop
-   `importexport.js` - ZIP export/import functionality
-   `mediasystem.js` - Manages media files (images, videos)

### `forStyles/`

-   `particles.js` - The floating particle system (50 pink particles!)

### `ui/`

User interface components:

-   `modal.js` - Modal dialogs (choice, confirm, input)
-   `mediaproperties.js` - Media file properties and context menus
-   `updatenotification.js` - Checks for updates and shows changelog

### `utils/`

Utility classes features:

-   `errorhandler.js` - Global error handling and logging
-   `feedback.js` - Toast notifications (success, error, info)
-   `keyboard.js` - Keyboard shortcuts and command palette
-   `wordcounter.js` - Counts words in markdown files
-   `storage.js` - Storage compression utilities
-   `mobile.js` - Mobile-specific navigation and interactions
-   `mobile-integration.js` - Mobile UI integration and optimizations

## Main File

### `index.js`

This is the main entry point that:

1. Imports all other modules
2. Initializes everything on page load
3. Connects all the systems together
4. Sets up header buttons (Import, Export, Changelog, Command Palette, Settings)
5. Makes sure everyone plays nice!

## How They Work Together

```
index.js
   ↓
   ├─→ editors/ (handles text editing & tabs)
   ├─→ files/ (knows about file types)
   ├─→ filesystem/ (saves, loads, organizes, imports/exports)
   ├─→ forStyles/ (makes it pretty)
   ├─→ ui/ (modals, media properties, notifications)
   ├─→ utils/ (keyboard shortcuts, mobile support, feedback)
   └─→ All connected via ES6 imports/exports!
```

## Code Style

-   ES6 modules (`import`/`export`)
-   Max 500 lines per file (mostly!)
-   Clear function names
-   Console logs with `[Module Name]` prefix
-   No frameworks - pure vanilla JS!
-   Modern async/await patterns
-   Event-driven architecture

## Recent Improvements

-   Command palette with 25+ commands
-   Comprehensive keyboard shortcuts
-   Mobile context menus (touch-and-hold)
-   Mobile drag-and-drop functionality
-   Update notification system
-   Storage compression and monitoring
-   Enhanced error handling
-   Toast notification system
