# OceanBoard User Guide

> Your friendly guide to getting started with OceanBoard!

---

## **What is OceanBoard?**

Imagine having a **magical notebook** that:
- Organizes your stories, novels, or creative projects
- Never loses your work (auto-saves!)
- Looks beautiful (seriously, those animations!)
- Works offline (no internet needed)
- Respects your privacy (no accounts, no tracking)

That's OceanBoard!

---

## **Quick Start (5 Minutes)**

### Step 1: Create Your First Series
1. Look at the **pink strip on the left**
2. Click the **+ button** at the top
3. Type a name (e.g., "My Novel")
4. Press Enter

**Boom!** You just created your first workspace!

### Step 2: Add a Season
1. Click the **+** next to "Seasons" in the sidebar
2. Name it (e.g., "Act 1")
3. Press Enter

Think of seasons as **chapters** or **sections** of your project!

### Step 3: Add Your First Episode
1. Click the **+** inside your season
2. Name it (e.g., "Chapter 1")
3. Press Enter

**Episodes** are your actual content files!

### Step 4: Start Writing!
1. Click your episode to open it
2. The editor appears with two panels:
   - **Left:** Where you type (Markdown)
   - **Right:** Live preview (see the result!)
3. Explore your ambient (Tip: press ctrl + K (or cmd + K if you are on mac) to open command palette. Makes your life easier)
3. Start writing!

### Step 5: Format Your Text
Use the toolbar at the bottom:
- `**B**` - Make text bold
- `**I**` - Make text italic
- ` - Make code words
- `*H1, H2, H3*` - Headings
- `~~strikethrough~~` - Lines through
- `- BulletList` - Make bullet
- `> BlockQuote` - Make quotes
- `[Text](link)` - To make LINKS!
- `![img-url]` or `$img-name` - to insert images
---

## **Understanding the Interface**

### The Pink Strip (Series Selector)
**Location:** Far left side

**What it does:**
- Shows all your projects (series)
- Each series is a separate workspace
- Click a series to switch to it
- Right-click for options (rename, change color, etc.)

**Buttons:**
- **+ (top)** - Create new series
- **Command** - Open commands
- **Export** - Backup your work
- **Import** - Restore from backup
- **Settings** - Customize OceanBoard

### The Sidebar (File Explorer)
**Location:** Next to the pink strip

**Three sections:**

#### 1. **Seasons** (Folders)
- Organize your episodes
- Drag to reorder
- Click arrow to collapse/expand
- Add episodes inside

#### 2. **Components** (Special Files)
Six file types for reference:
- **EP** (Episode) - Blue - Regular content
- **C** (Character) - Green - Character profiles
- **O** (Object) - Orange - Important items
- **SC** (Scene) - Purple - Scene notes
- **A** (Action) - Red - Action sequences
- **AT** (Attribute) - Yellow - Character traits

#### 3. **Media**
- All images/videos/audios you upload will be here, neatly organized and ready to click to insert.

### The Editor Area
**Location:** Center/right side

**Two panels:**
- **Left:** Your writing (Markdown input)
- **Right:** Preview (how it looks)

**Bottom toolbar:**
- Formatting buttons
- Click to format selected text

### The Tab Bar
**Location:** Above editor

- Shows all open files
- Click tab to switch files
- Click X to close tab
- Active tab has pink underline

---

## **Writing with Markdown**

### What is Markdown?
A **simple way** to format text using symbols!

### Basic Formatting

#### **Make Text Bold**
```markdown
**This is bold**
```
Result: **This is bold**

#### **Make Text Italic**
```markdown
*This is italic*
```
Result: *This is italic*

#### **Headings**
```markdown
# Big Heading
## Medium Heading
### Small Heading
```

#### **Lists**
```markdown
- Item 1
- Item 2
- Item 3
```

#### **Numbered Lists**
```markdown
1. First thing
2. Second thing
3. Third thing
```

#### **Links**
```markdown
[Click here](https://po.ta.to)
```

#### **Quotes**
```markdown
> This is a quote
> - Someone smart
```

#### **Code**
`single line of code`

#### **Code Block**
```markdown
Multiple lines
of code here
```

### Pro Tips
1. **Select text first**, then click toolbar button
2. **Preview updates live** - no save needed
3. **Mix and match** - combine formats!
4. **Experiment** - you can't break anything!

---

## **Saving Your Work**

### Auto-Save
- **Saves every 15 seconds** by default
- **Only changed files** are saved
- **No action needed** - it's automatic!
- **Customizable** in settings (5-60 seconds)

### Manual Backup (Recommended!)
1. Click **Export** button (download icon)
2. Choose type:
   - **Full Workspace** - Everything (settings too)
   - **Files Only** - Just your content
3. ZIP file downloads automatically!

### When to Backup?
- ✅ Before major changes
- ✅ After finishing a section
- ✅ Weekly (just to be safe)
- ✅ Before updating OceanBoard
- ✅ Whenever you feel like it!

### Restoring from Backup
1. Click **Import** button (upload icon)
2. Select your `.zip` file
3. Page reloads with your data
4. Done!

---

## **Customizing OceanBoard**

### Opening Settings
Click the **settings icon** (gear) in the pink strip

### What You Can Change

#### **Editor Settings**
- **Font Size** - Make text bigger/smaller (10-24px)
- **Line Height** - Space between lines (1.2-2.5)
- **Line Numbers** - Show line numbers? (On/Off)
- **Word Wrap** - Wrap long lines? (On/Off)
- **Smooth Scroll** - Smooth scrolling? (On/Off)

#### **System Settings**
- **Autosave Interval** - How often to save (5-60 seconds)

### My Recommended Settings
```
Font Size: 16px
Line Height: 1.8
Line Numbers: On
Word Wrap: On
Smooth Scroll: On
Autosave: 15 seconds
```

---

## **Personalizing Your Series**

### Change Series Color
1. Right-click series tile
2. Choose "Change Color"
3. Pick your favorite color!

### Add Cover Image
1. Right-click series tile
2. Choose "Change Cover"
3. Select image (GIF supported!)
4. **Tip:** Keep under 1MB

### Remove Cover
1. Right-click series tile
2. Choose "Remove Cover"
3. Back to color-only tile

---

## **Finding Your Files**

### Using the Sidebar
- **Seasons** can be collapsed
- **Scroll** through file list
- **Color-coded** by type

### Tab System
- **Open files** stay in tabs
- **Switch quickly** between tabs
- **Close unused tabs** to stay organized

### Pro Tip: Use Components!
- Keep **frequently referenced** files as components
- **Always visible** in sidebar
- **Quick access** to character sheets, world rules, etc.

---

## **Working with Special Files**

### What Are They?
**Special files** (Components) are reference materials that stay accessible!

### When to Use Each Type

#### **Episode (EP) - Blue**
- Regular story content
- Chapters or sections
- Main narrative

#### **Character (C) - Green**
- Character profiles
- Backstories
- Personality traits
- Example:
```markdown
# Hero Name
**Age:** 25
**Personality:** Brave but reckless
**Goal:** Save the kingdom
**Secret:** Afraid of spiders
```

#### **Object (O) - Orange**
- Important items
- Weapons, artifacts
- Example:
```markdown
# The Magic Sword
**Power:** Glows near evil
**History:** Forged 1000 years ago
**Weakness:** Rusts in water
```

#### **Scene (SC) - Purple**
- Location descriptions
- Setting notes
- Example:
```markdown
# The Dark Forest
**Mood:** Mysterious and eerie
**Features:** Ancient trees, glowing mushrooms
**Danger Level:** High
```

#### **Action (A) - Red**
- Combat sequences
- Action choreography
- Example:
```markdown
# Final Battle Sequence
1. Hero enters throne room
2. Villain laughs
3. Sword fight on balcony
4. Dramatic fall
```

#### **Attribute (AT) - Yellow**
- World rules
- Magic systems
- Character stats

---

## **Tips for Success**

### Writing Tips
1. **Write first, format later** - Get ideas down!
2. **Use headings** - Organize your thoughts
3. **Close tabs** you're not using - Stay focused
4. **Preview panel** - See how it looks!

### Organization Tips
1. **Name things clearly** - Future you will thank you
2. **Use seasons** - Break big projects into parts
3. **Keep components updated** - Central reference point
4. **Don't over-organize** - Start simple!

### Productivity Tips
1. **Multiple tabs** - Work on related files
2. **Drag files** - Quick reorganization
3. **Duplicate files** - Use as templates
4. **Export often** - Peace of mind!

### Storage Tips
1. **One series per project** - Keep it clean
2. **Compress cover images** - Save space
3. **Export old projects** - Archive completed work
4. **Don't worry about space** - LocalStorage is generous!

---

## **Troubleshooting**

### "I can't find my file!"
- Check all seasons (they might be collapsed)
- Look in Components section
- Check if it's already open in a tab

### "My changes aren't saving!"
- Wait 15 seconds (auto-save delay)
- Check if file is actually selected/open
- Export as backup just in case

### "I deleted something by accident!"
- ctrl + z (command + z)
- Restore from there
- If emptied trash: restore from backup

### "Page is slow/laggy"
- Close unused tabs
- Collapse seasons you're not using
- Clear browser cache
- Restart browser

### "I lost my data!"
- Import from latest backup
- Check browser's localStorage wasn't cleared
- Check if you're in the right browser profile

---

## **More Resources**

- **Complete Feature Guide** - Every feature explained
- **info.md files** - Technical details in each folder
- **Changelog** - See what's new
- **Website** - Latest news and updates

**Need help?** Check our [Forms](https://forms.gle/VD4Qn2DiFyBh8Pib6) or the docs for more!

**Made with by umaera**
