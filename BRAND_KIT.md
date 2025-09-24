# VacationRentalOahu.co Brand Kit

**Complete Design System Documentation**  
*Last updated: September 2025*

---

## Table of Contents

1. [Typography System](#typography-system)
2. [Color Palette](#color-palette)
3. [Component Styling Rules](#component-styling-rules)
4. [Usage Guidelines](#usage-guidelines)
5. [Technical Implementation](#technical-implementation)

---

## Typography System

### Font Families

**Primary Font (Serif)**
- **Font**: Playfair Display
- **Fallbacks**: Cormorant Garamond, Georgia, Times New Roman, serif
- **Usage**: All headings, body text, buttons, and UI elements
- **CSS Variable**: `--font-serif`

**Secondary Font (Sans Serif)**
- **Font**: Inter
- **Fallbacks**: Helvetica Neue, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif
- **Usage**: Limited use for technical content or labels when needed
- **CSS Variable**: `--font-sans`

**Monospace Font**
- **Font**: JetBrains Mono
- **Fallbacks**: Fira Code, Consolas, Courier New, monospace
- **Usage**: Code blocks, technical specifications
- **CSS Variable**: `--font-mono`

### Typography Scale

| Size Token | Font Size | Line Height | Usage |
|------------|-----------|-------------|--------|
| `luxury-xs` | 12px (0.75rem) | 1.4 | Captions, fine print, metadata |
| `luxury-sm` | 14px (0.875rem) | 1.4 | Small body text, labels |
| `luxury-base` | 16px (1rem) | 1.4 | Default body text, paragraphs |
| `luxury-lg` | 18px (1.125rem) | 1.6 | Large body text, emphasis |
| `luxury-xl` | 20px (1.25rem) | 1.6 | H4 headings, call-outs |
| `luxury-2xl` | 24px (1.5rem) | 1.2 | H3 headings, section titles |
| `luxury-3xl` | 30px (1.875rem) | 1.1 | H2 headings, page subtitles |
| `luxury-4xl` | 36px (2.25rem) | 1.1 | H1 headings, hero titles |
| `luxury-5xl` | 48px (3rem) | 1.0 | Large hero text |
| `luxury-6xl` | 60px (3.75rem) | 1.0 | Display headings |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `luxury-tight` | -0.02em | **Primary usage** - All text elements |
| `luxury-normal` | 0em | Neutral spacing when needed |
| `luxury-wide` | 0.02em | Emphasis text |
| `luxury-elegant` | 0.12em | Special luxury emphasis |
| `luxury-paradise` | 0.15em | Brand name "Paradise" |

### Font Weight & Style Rules

**Consistent Weight**: `font-normal` (400)
- All text uses normal weight for elegant, refined appearance
- No bold or heavy weights in the luxury aesthetic

**Default Typography Classes**
```css
/* Apply to ALL text elements */
font-serif font-normal tracking-luxury-tight
```

### Heading Hierarchy

| Element | Classes | Usage |
|---------|---------|-------|
| `h1` | `text-luxury-5xl font-serif font-normal tracking-luxury-tight` | Page titles |
| `h2` | `text-luxury-4xl font-serif font-normal tracking-luxury-tight` | Section titles |
| `h3` | `text-luxury-2xl font-serif font-normal tracking-luxury-tight` | Subsection titles |
| `h4` | `text-luxury-xl font-serif font-normal tracking-luxury-tight` | Component titles |
| `h5` | `text-luxury-lg font-serif font-normal tracking-luxury-tight` | Small headings |
| `h6` | `text-luxury-base font-serif font-normal tracking-luxury-tight` | Micro headings |

---

## Color Palette

### Luxury Neutral Foundation

**Primary Neutrals**
- **Ivory**: `hsl(48 29% 96%)` - `#F9F7F4` - Primary background
- **Stone**: `hsl(42 14% 86%)` - `#DDD9D2` - Secondary surfaces
- **Dune**: `hsl(40 10% 70%)` - `#B8B3AB` - Muted elements
- **Onyx**: `hsl(210 10% 12%)` - `#1C1D1F` - Primary text

### Semantic Color System

**Primary Colors**
- **Primary**: `var(--onyx)` (Onyx) - Main actions, primary text
- **Primary Foreground**: `var(--ivory)` (Ivory) - Text on primary

**Secondary Colors**
- **Secondary**: `var(--stone)` (Stone) - Secondary surfaces
- **Secondary Foreground**: `var(--onyx)` (Onyx) - Text on secondary

**Accent & Utility Colors**
- **Accent**: `hsl(38 24% 48%)` - `#8B7355` - Highlights, links
- **Muted**: `hsl(42 12% 92%)` - `#EBEAE7` - Subtle backgrounds
- **Muted Foreground**: `hsl(40 8% 55%)` - `#8C887F` - Secondary text
- **Border**: `hsl(42 10% 88%)` - `#E2DFD9` - Borders, dividers
- **Destructive**: `hsl(0 70% 50%)` - `#CC3333` - Errors, warnings

### Bronze Metallic System (Luxury Accent)

**Bronze Scale (Light to Dark)**
| Shade | HSL | HEX | Usage |
|-------|-----|-----|-------|
| `bronze-50` | `hsl(38 18% 98%)` | `#FBF9F7` | Lightest highlights |
| `bronze-100` | `hsl(38 20% 95%)` | `#F4F1ED` | Subtle highlights |
| `bronze-200` | `hsl(38 22% 90%)` | `#E7E2DB` | Light accents |
| `bronze-300` | `hsl(38 24% 82%)` | `#D7CAB9` | Medium light accents |
| `bronze-400` | `hsl(38 26% 70%)` | `#C0AD94` | **Main accent color** |
| `bronze-500` | `hsl(38 24% 58%)` | `#A08B6F` | Standard bronze |
| `bronze-600` | `hsl(38 24% 48%)` | `#8B7355` | **Primary bronze** |
| `bronze-700` | `hsl(38 26% 38%)` | `#6F5D45` | **Icon color** |
| `bronze-800` | `hsl(38 28% 28%)` | `#524235` | Dark bronze |
| `bronze-900` | `hsl(38 30% 20%)` | `#3A2E24` | Darkest bronze |
| `bronze-950` | `hsl(38 32% 12%)` | `#241E17` | Deepest shadows |

**Bronze Scale - Dark Mode (Enhanced Saturation)**
| Shade | HSL | HEX | Usage |
|-------|-----|-----|-------|
| `bronze-50` | `hsl(46 90% 89%)` | `#F7F3E8` | Lightest highlights |
| `bronze-100` | `hsl(44 85% 81%)` | `#EFE6D2` | Subtle highlights |
| `bronze-200` | `hsl(42 80% 73%)` | `#E3D3B7` | Light accents |
| `bronze-300` | `hsl(40 75% 65%)` | `#D5BD97` | Medium light accents |
| `bronze-400` | `hsl(38 70% 57%)` | `#C5A476` | **Main accent color** |
| `bronze-500` | `hsl(36 65% 49%)` | `#B38A55` | Standard bronze |
| `bronze-600` | `hsl(34 60% 41%)` | `#9D7142` | **Primary bronze** |
| `bronze-700` | `hsl(32 55% 33%)` | `#825B35` | **Icon color** |
| `bronze-800` | `hsl(30 50% 25%)` | `#664729` | Dark bronze |
| `bronze-900` | `hsl(28 45% 18%)` | `#4A341F` | Darkest bronze |
| `bronze-950` | `hsl(28 40% 12%)` | `#332418` | Deepest shadows |

**Bronze Metallic Effects**
- **Bronze Base**: `var(--bronze-600)` - Primary metallic color
- **Bronze Light**: `var(--bronze-400)` - Highlight effects  
- **Bronze Dark**: `var(--bronze-800)` - Shadow effects
- **Bronze Sheen**: `var(--bronze-200)` - Shine overlay

**Bronze Specular Highlights**
- **Specular 1**: `hsl(50 95% 88%)` - `#F8F3DA` - Primary highlight
- **Specular 2**: `hsl(48 85% 82%)` - `#F0E6C8` - Secondary highlight
- **Hotspot**: `hsl(52 100% 92%)` - `#FEFBE6` - Brightest reflection
- **Rim Light**: `var(--bronze-300)` - Edge lighting

### Tropical Color Accents

**Coral Palette**
- Range: `hsl(5 84% 97%)` to `hsl(5 84% 32%)`
- HEX Range: `#FEF5F5` to `#8A2E2E`
- Usage: Warm accents, call-to-action elements

**Emerald Palette**
- Range: `hsl(167 85% 97%)` to `hsl(167 85% 18%)`
- HEX Range: `#F4FFFE` to `#0F4A47`
- Usage: Success states, nature elements

**Ocean Palette**
- Range: `hsl(187 85% 97%)` to `hsl(187 85% 20%)`
- HEX Range: `#F4FEFF` to `#0F424A`
- Usage: Cool accents, water elements

### Additional Design Tokens

**Wallpaper Colors (Light Mode)**
- **Bronze**: `hsl(43 65% 49%)` - `#C09A3A` - Accent bronze
- **Deep Green**: `hsl(195 100% 25%)` - `#00668A` - Deep ocean
- **Muted Teal**: `hsl(175 40% 50%)` - `#4D9999` - Calm teal
- **Soft Sage**: `hsl(80 20% 75%)` - `#BCC4B3` - Natural sage
- **Warm Wood**: `hsl(25 60% 45%)` - `#B87845` - Wood tone
- **Blush Accent**: `hsl(350 45% 85%)` - `#E8C2C2` - Soft blush
- **Off White**: `hsl(60 9% 98%)` - `#FDFCFA` - Warm white

**Glass Morphism Effects**
- **Glass Background**: `rgba(184, 134, 71, 0.1)` - Translucent bronze
- **Glass Border**: `rgba(184, 134, 71, 0.2)` - Bronze border  
- **Glass Highlight**: `rgba(254, 243, 199, 0.15)` - Light overlay
- **Glass Backdrop**: `blur(16px)` - Blur effect
- **Glass Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)` - Depth shadow

**Accessibility & Motion**
- **CTA Foreground**: `hsl(0 0% 100%)` - `#FFFFFF` - High contrast CTA text
- **Focus Ring Bronze**: Bronze-400 for focus indicators
- **Reduced Motion**: Respects user motion preferences
- **Forced Colors**: High contrast mode support

### Dark Mode Complete Specification

**Background & Surface (Dark)**
- **Background**: `hsl(24 9% 8%)` - `#151311`
- **Card**: `hsl(24 9% 8%)` - `#151311`
- **Secondary**: `hsl(210 8% 25%)` - `#3A3D42`
- **Muted**: `hsl(210 8% 18%)` - `#2B2E33`
- **Border**: `hsl(24 6% 20%)` - `#323028`
- **Input**: `hsl(24 6% 20%)` - `#323028`
- **Ring**: `var(--bronze-400)` - Focus ring color

**Text Colors (Dark Mode)**
- **Foreground**: `hsl(45 15% 95%)` - `#F2F0EB`
- **Muted Foreground**: `hsl(210 6% 65%)` - `#A1A6AB`
- **Accent**: `hsl(38 20% 55%)` - `#8C7B5F`
- **Destructive**: `hsl(0 75% 60%)` - `#E85555`

**Wallpaper Colors (Dark Mode)**
- **Bronze**: `hsl(43 65% 55%)` - `#D1A647`
- **Deep Green**: `hsl(175 40% 30%)` - `#2E7373`
- **Muted Teal**: `hsl(175 30% 40%)` - `#478080`
- **Soft Sage**: `hsl(80 20% 60%)` - `#9CA699`
- **Warm Wood**: `hsl(25 50% 35%)` - `#945D39`
- **Blush Accent**: `hsl(350 45% 70%)` - `#D19999`

**Glass Effects (Dark Mode)**
- **Glass Background**: `rgba(255, 255, 255, 0.05)` - Subtle light
- **Glass Border**: `rgba(255, 255, 255, 0.1)` - Light border
- **Glass Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)` - Enhanced depth
- **Glass Backdrop**: `blur(16px)` - Consistent blur

---

## Component Styling Rules

### Buttons

**Primary Bronze Button** (`.btn-bronze`)
```css
/* Base Styling */
background: linear-gradient(135deg, var(--bronze-600) 0%, var(--bronze-700) 100%);
border: 1px solid var(--bronze-500);
color: var(--cta-foreground);
padding: 0.5rem 1rem;
border-radius: 6px;
font-serif font-normal tracking-luxury-tight;
box-shadow: 
  0 4px 12px rgba(184, 134, 71, 0.25),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);

/* Hover State */
background: linear-gradient(135deg, var(--bronze-700) 0%, var(--bronze-800) 100%);
transform: translateY(-1px) scale(1.02);
box-shadow: 
  0 6px 20px rgba(184, 134, 71, 0.35),
  inset 0 1px 0 rgba(255, 255, 255, 0.15);

/* Focus State */
outline: 2px solid var(--bronze-400) !important;
outline-offset: 2px !important;
box-shadow: 
  0 0 0 calc(2px + 2px) rgba(215, 179, 137, 0.3),
  0 0 12px rgba(215, 179, 137, 0.4) !important;

/* Active State */
background: linear-gradient(135deg, var(--bronze-900) 0%, var(--bronze-800) 100%);
transform: translateY(0) scale(0.98);

/* Disabled State */
opacity: 0.6;
transform: none;
box-shadow: none;
cursor: not-allowed;

/* Forced Colors Mode (Accessibility) */
@media (forced-colors: active) {
  border: 2px solid ButtonText !important;
  background: ButtonFace !important;
  color: ButtonText !important;
}

@media (forced-colors: active) {
  &:hover, &:focus {
    background: Highlight !important;
    color: HighlightText !important;
    border-color: HighlightText !important;
  }
}
```

**Enhanced Bronze Button** (`.btn-bronze-enhanced`)
```css
/* Advanced bronze with shimmer effect */
position: relative;
overflow: hidden;
background: linear-gradient(135deg, var(--bronze-dk) 0%, var(--bronze) 25%, var(--bronze-md) 50%, var(--bronze-lt) 75%, var(--bronze) 100%);
box-shadow: 
  0 4px 12px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 var(--bronze-rim-light);

/* Shimmer overlay */
&::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  transition: all 1.2s ease;
  pointer-events: none;
}

&:hover::before {
  left: 100%;
}

&:hover {
  background: linear-gradient(130deg, var(--bronze-dk) 0%, var(--bronze) 20%, var(--bronze-md) 45%, var(--bronze-lt) 70%, var(--bronze-hi) 100%);
  transform: translateY(-1px) scale(1.02);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 20px hsla(from var(--bronze-edge-glow) h s l / 0.5),
    inset 0 1px 0 var(--bronze-rim-light);
}
```

**Button Sizes**
- **Small**: `h-9 px-3 text-luxury-sm`
- **Default**: `h-10 px-4 text-luxury-sm`
- **Large**: `h-11 px-8 text-luxury-base`

**Button Variants**
- **Default**: Primary onyx background
- **Outline**: Border with background on hover
- **Ghost**: No background, hover accent
- **Bronze**: Luxury metallic gradient
- **Destructive**: Error/warning actions

### Cards

**Luxury Card** (`.luxury-card`)
```css
background: var(--card);
border: 1px solid var(--bronze-300);
border-radius: 12px;
box-shadow: 0 4px 20px rgba(184, 134, 71, 0.1);
transition: all 0.3s ease;

/* Hover State */
border-color: var(--bronze-400);
box-shadow: 0 8px 32px rgba(184, 134, 71, 0.15);
transform: translateY(-2px);
```

**Card Components**
- **Card Header**: `p-6 space-y-1.5`
- **Card Title**: `text-luxury-2xl font-serif font-normal tracking-luxury-tight`
- **Card Description**: `text-luxury-sm text-muted-foreground`
- **Card Content**: `p-6 pt-0`
- **Card Footer**: `p-6 pt-0 flex items-center`

### Forms & Inputs

**Input Fields**
```css
/* Base Input */
border: 1px solid var(--input);
background: var(--background);
border-radius: 6px;
padding: 0.5rem 0.75rem;
font-serif font-normal tracking-luxury-tight;
height: 2.5rem;

/* Focus State */
outline: none;
border-color: var(--ring);
box-shadow: 0 0 0 2px var(--ring);
```

**Form Labels**
```css
font-serif font-normal tracking-luxury-tight;
color: var(--foreground);
font-size: var(--text-sm);
margin-bottom: 0.25rem;
```

### Navigation

**Navigation Links**
```css
font-serif font-normal tracking-luxury-tight;
color: var(--foreground);
text-decoration: none;
transition: color 0.2s ease;

/* Hover State */
color: var(--bronze-600);
```

**Active Navigation**
```css
color: var(--bronze-700);
position: relative;

/* Active Indicator */
&::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--bronze-600);
}
```

### Glass Morphism Cards

**Glass Card Components**
```css
/* Base Glass Card */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: calc(var(--radius) + 4px);
  transition: all var(--glass-transition) ease;
}

/* Hover State */
.glass-card:hover {
  background: var(--glass-bronze);
  border-color: var(--glass-bronze-border);
  box-shadow: var(--glass-shadow);
}

/* Forced Colors Override */
@media (forced-colors: active) {
  .glass-card {
    background: Canvas !important;
    border: 1px solid ButtonText !important;
    backdrop-filter: none !important;
  }
}
```

### Navigation Components

**Navigation Links**
```css
/* Base Navigation */
.nav-link {
  font-serif font-normal tracking-luxury-tight;
  color: var(--foreground);
  text-decoration: none;
  transition: color 0.2s ease;
}

/* Hover State */
.nav-link:hover {
  color: var(--bronze-600);
}

/* Active State */
.nav-link.active {
  color: var(--bronze-700);
  position: relative;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--bronze-600);
}

/* Forced Colors Override */
@media (forced-colors: active) {
  .nav-link {
    color: LinkText !important;
  }
  
  .nav-link:hover,
  .nav-link.active {
    color: VisitedText !important;
    text-decoration: underline !important;
  }
  
  .nav-link.active::after {
    background: VisitedText !important;
  }
}
```

### Icons

**Icon Styling**
```css
/* Standard Icons */
color: var(--bronze-700);
stroke-width: 1;
width: 1.5rem;
height: 1.5rem;

/* Small Icons */
width: 1rem;
height: 1rem;

/* Large Icons */
width: 2rem;
height: 2rem;

/* Forced Colors Override */
@media (forced-colors: active) {
  .icon {
    color: ButtonText !important;
  }
  
  .icon-interactive:hover {
    color: Highlight !important;
  }
}
```

**Icon Usage Rules**
- Use `bronze-700` for standard icon color
- Maintain consistent stroke width of 1
- Size according to context (sm/md/lg)

### Skeleton Loading States

**Bronze Skeleton Components**
```css
/* Base Skeleton */
.bronze-skeleton {
  background: linear-gradient(
    90deg,
    var(--bronze-100) 0%,
    var(--bronze-200) 50%,
    var(--bronze-100) 100%
  );
  background-size: 200% 100%;
  animation: bronzeSkeletonLoading 2s infinite ease-in-out;
  border-radius: 4px;
}

/* Dark Mode Skeleton */
.dark .bronze-skeleton {
  background: linear-gradient(
    90deg,
    var(--bronze-800) 0%,
    var(--bronze-600) 50%,
    var(--bronze-800) 100%
  );
  background-size: 200% 100%;
}

/* Forced Colors Override */
@media (forced-colors: active) {
  .bronze-skeleton {
    background: GrayText !important;
    animation: none !important;
  }
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  .bronze-skeleton {
    animation: none !important;
    background: var(--bronze-200);
  }
}
```

### High Contrast Mode Support

**High Contrast Variables**
```css
/* High Contrast Custom Properties */
--high-contrast-outline: 2px solid;
--high-contrast-bg: canvas;
--high-contrast-text: canvasText;

/* Focus Ring Enhancement for High Contrast */
--focus-ring-bronze: hsl(42 95% 75%);
--focus-ring-bronze-light: hsl(48 100% 85%);
```

**High Contrast Overrides**
```css
@media (prefers-contrast: high) {
  /* Enhanced Focus Indicators */
  .accessible-focus,
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible,
  [tabindex]:focus-visible {
    outline: var(--high-contrast-outline) !important;
    outline-color: Highlight !important;
    box-shadow: none !important;
  }
  
  /* Button Overrides */
  .btn-bronze {
    border: 2px solid ButtonText !important;
    background: ButtonFace !important;
    color: ButtonText !important;
  }
  
  .btn-bronze:hover,
  .btn-bronze:focus {
    background: Highlight !important;
    color: HighlightText !important;
    border-color: HighlightText !important;
  }
  
  /* Mobile High Contrast */
  .mobile-high-contrast {
    color: var(--foreground);
    background: var(--background);
  }
}
```

### Standard Cards

**Luxury Card Components**
```css
/* Base Luxury Card */
.luxury-card {
  background: var(--card);
  border: 1px solid var(--bronze-300);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(184, 134, 71, 0.1);
  transition: all 0.3s ease;
}

/* Hover State */
.luxury-card:hover {
  border-color: var(--bronze-400);
  box-shadow: 0 8px 32px rgba(184, 134, 71, 0.15);
  transform: translateY(-2px);
}

/* Dark Mode */
.dark .luxury-card {
  background: rgba(184, 134, 71, 0.05);
  border-color: rgba(184, 134, 71, 0.15);
}

/* Forced Colors Override */
@media (forced-colors: active) {
  .luxury-card {
    background: Canvas !important;
    border: 2px solid ButtonText !important;
    box-shadow: none !important;
  }
  
  .luxury-card:hover {
    border-color: Highlight !important;
    transform: none !important;
  }
}
```

### Form Components

**Form Input Styling**
```css
/* Base Input */
.form-input {
  border: 1px solid var(--input);
  background: var(--background);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-serif font-normal tracking-luxury-tight;
  height: 2.5rem;
}

/* Focus State */
.form-input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--ring);
}

/* Error State */
.form-input.error {
  border-color: var(--destructive);
  box-shadow: 0 0 0 2px rgba(204, 51, 51, 0.2);
}

/* Forced Colors Override */
@media (forced-colors: active) {
  .form-input {
    background: Field !important;
    border: 2px solid ButtonText !important;
    color: FieldText !important;
  }
  
  .form-input:focus {
    border-color: Highlight !important;
    box-shadow: none !important;
    outline: 2px solid Highlight !important;
  }
  
  .form-input.error {
    border-color: VisitedText !important;
    box-shadow: none !important;
  }
}
```

**Form Labels**
```css
/* Base Label */
.form-label {
  font-serif font-normal tracking-luxury-tight;
  color: var(--foreground);
  font-size: var(--text-sm);
  margin-bottom: 0.25rem;
}

/* Required Indicator */
.form-label.required::after {
  content: '*';
  color: var(--destructive);
  margin-left: 0.25rem;
}

/* Forced Colors Override */
@media (forced-colors: active) {
  .form-label {
    color: FieldText !important;
  }
  
  .form-label.required::after {
    color: VisitedText !important;
  }
}
```

### Alerts & Notifications

**Alert Components**
```css
/* Default Alert */
background: var(--background);
border: 1px solid var(--border);
border-radius: 8px;
padding: 1rem;

/* Destructive Alert */
border-color: var(--destructive);
color: var(--destructive);
background: rgba(204, 51, 51, 0.05);

/* Forced Colors Override */
@media (forced-colors: active) {
  .alert {
    background: Canvas !important;
    border: 1px solid ButtonText !important;
    color: CanvasText !important;
  }
  
  .alert-destructive {
    border-color: Highlight !important;
    color: Highlight !important;
  }
}
```

---

## Usage Guidelines

### Typography Guidelines

**✅ DO:**
- Always use `font-serif font-normal tracking-luxury-tight` for all text
- Use the luxury typography scale consistently
- Maintain proper heading hierarchy (h1 → h6)
- Apply consistent letter spacing across all elements

**❌ DON'T:**
- Use bold or heavy font weights
- Mix serif and sans-serif fonts inconsistently
- Skip heading levels in hierarchy
- Use default Tailwind text sizes

### Color Guidelines

**✅ DO:**
- Use bronze-700 for icons and accent elements
- Maintain high contrast ratios for accessibility
- Use semantic colors for their intended purpose
- Apply consistent hover states

**❌ DON'T:**
- Use bright, saturated colors that clash with luxury aesthetic
- Override semantic color meanings
- Use inconsistent bronze shades
- Ignore dark mode color variants

### Component Guidelines

**✅ DO:**
- Apply luxury styling classes consistently
- Use proper focus states for accessibility
- Maintain consistent spacing and sizing
- Follow established component patterns

**❌ DON'T:**
- Create custom components without following brand guidelines
- Skip accessibility considerations
- Use inconsistent hover/focus states
- Override component base styles arbitrarily

### Accessibility Requirements

**Focus States**
- All interactive elements must have visible focus indicators
- Focus outlines should use bronze-400 color with `!important`
- Minimum focus ring width: 2px
- Focus ring offset: 2px
- Bronze focus ring with glow: `0 0 12px rgba(215, 179, 137, 0.4)`

**Forced Colors Mode Support**
```css
@media (forced-colors: active) {
  .btn-bronze {
    border: 2px solid ButtonText !important;
    background: ButtonFace !important;
    color: ButtonText !important;
  }
  
  .btn-bronze:hover,
  .btn-bronze:focus {
    background: Highlight !important;
    color: HighlightText !important;
    border-color: HighlightText !important;
  }
}
```

**Motion Preferences**
```css
@media (prefers-reduced-motion: reduce) {
  .bronze-shimmer-overlay,
  .animate-shimmer,
  .btn-bronze::after,
  .btn-bronze-enhanced::before,
  .luxury-card::before {
    animation: none !important;
    display: none !important;
  }
  
  .btn-bronze:hover,
  .luxury-card:hover {
    transform: none !important;
  }
}
```

**Color Contrast**
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio
- CTA text uses pure white (`--cta-foreground`) for maximum contrast

**Touch Targets**
- Minimum touch target: 44px × 44px (`var(--touch-target-min)`)
- Optimal touch target: 48px × 48px (`var(--touch-target-optimal)`)
- Adequate spacing between touch targets

**Animation Performance**
- Hardware acceleration for smooth animations
- Bronze transition durations: Fast (0.15s), Medium (0.3s), Slow (0.6s)
- Shimmer animation duration: 2.5s for luxury effect

---

## Motion & Accessibility Controls

### Motion Preference Variables

**CSS Custom Properties for Motion Control**
```css
/* Motion System Variables */
--reduced-motion: 0;                    /* 0 = enabled, 1 = reduced */
--motion-safe-duration: 0.3s;           /* Safe animation duration */
--motion-safe-distance: 50px;           /* Safe transform distance */
--animation-play-state: running;        /* Animation state control */
--scroll-behavior: smooth;              /* Scroll behavior preference */

/* Bronze Animation Durations */
--bronze-transition-fast: 0.15s;        /* Quick interactions */
--bronze-transition-medium: 0.3s;       /* Standard transitions */
--bronze-transition-slow: 0.6s;         /* Dramatic effects */
--bronze-sheen-duration: 2.5s;          /* Shimmer effect timing */
--glass-transition: 0.2s;               /* Glass morphism transitions */
```

**Motion Preference Detection**
```css
/* System preference detection */
@media (prefers-reduced-motion: reduce) {
  :root {
    --reduced-motion: 1;
    --motion-safe-duration: 0.01ms;
    --motion-safe-distance: 0px;
    --animation-play-state: paused;
    --scroll-behavior: auto;
  }
}

/* User preference override via JavaScript */
[data-motion-preference="reduce"] {
  --reduced-motion: 1;
  --motion-safe-duration: 0.01ms;
  --motion-safe-distance: 0px;
  --animation-play-state: paused;
  --scroll-behavior: auto;
}
```

### Comprehensive Motion Reduction

**Global Animation Reset**
```css
@media (prefers-reduced-motion: reduce) {
  /* Reset all animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-play-state: paused !important;
    transition-duration: 0.1s !important;
    scroll-behavior: auto !important;
  }
  
  /* Disable specific luxury effects */
  .bronze-shimmer-overlay,
  .animate-shimmer,
  .btn-bronze::after,
  .btn-bronze-enhanced::before,
  .luxury-card::before,
  .bronze-gradient-enhanced::before {
    animation: none !important;
    display: none !important;
  }
  
  /* Remove hover transforms */
  .gallery-image:hover,
  .amenity-card:hover,
  .luxury-card-animation:hover,
  .btn-bronze:hover,
  .btn-bronze-enhanced:hover,
  .review-card-luxury:hover,
  .amenity-card-luxury:hover {
    transform: none !important;
  }
}
```

### Accessibility Control Implementation

**MotionPreferencesToggle Component Usage**
```tsx
import { MotionPreferencesToggle } from '@/components/ui/motion-preferences-toggle';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';

// Simple usage in settings or accessibility panel
<MotionPreferencesToggle />

// Advanced usage with different variants
<MotionPreferencesToggle variant="card" showLabel={true} />
<MotionPreferencesToggle variant="icon-only" />

// Using the hook for conditional logic in components
const { 
  preferReducedMotion, 
  userOverride, 
  setUserOverride, 
  toggleMotion 
} = useMotionPreferences();

// Conditional animation based on preference
const shouldAnimate = !preferReducedMotion;

// Component example with motion awareness
function AnimatedCard() {
  const { preferReducedMotion } = useMotionPreferences();
  
  return (
    <div className={cn(
      "transition-transform duration-300",
      !preferReducedMotion && "hover:scale-105"
    )}>
      {/* Card content */}
    </div>
  );
}
```

**Hook API Reference**
- `preferReducedMotion: boolean` - Final motion preference (system + user override)
- `userOverride: boolean | null` - User's manual override (null = follow system)
- `setUserOverride: (override: boolean | null) => void` - Manually set override
- `toggleMotion: () => void` - Toggle between reduce/allow motion

**Implementation Guidelines**
- Hook automatically applies `data-motion-preference="reduce"` to document root
- CSS responds to both system preferences and user toggle automatically
- Component persists user preference in localStorage automatically
- Use `preferReducedMotion` for conditional animations in components
- Hook manages all state and DOM updates - no manual intervention needed

**Usage Guidelines**
- Always respect user motion preferences
- Provide alternative feedback for disabled animations
- Use motion variables consistently across components
- Test with both system and manual motion reduction settings
- Ensure critical functionality works without motion
- Include MotionPreferencesToggle in accessibility settings

---

## Technical Implementation

### CSS Custom Properties

**Color Variables**
```css
:root {
  /* Luxury Neutrals */
  --ivory: hsl(48 29% 96%);
  --stone: hsl(42 14% 86%);
  --dune: hsl(40 10% 70%);
  --onyx: hsl(210 10% 12%);
  
  /* Semantic Colors */
  --background: var(--ivory);
  --foreground: var(--onyx);
  --primary: var(--onyx);
  --primary-foreground: var(--ivory);
  
  /* Bronze Scale */
  --bronze-50: hsl(38 18% 98%);
  --bronze-100: hsl(38 20% 95%);
  /* ... bronze-200 through bronze-950 */
  
  /* Typography */
  --font-serif: 'Playfair Display', serif;
  --text-luxury-base: 1rem;
  --tracking-luxury-tight: -0.02em;
}
```

**Dark Mode Override**
```css
.dark {
  --background: hsl(24 9% 8%);
  --foreground: hsl(45 15% 95%);
  --card: hsl(24 9% 8%);
  --border: hsl(24 6% 20%);
  /* Updated bronze values for dark mode */
}
```

### Tailwind Configuration

**Extended Theme**
```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bronze: {
          50: "var(--bronze-50)",
          // ... complete bronze scale
        }
      },
      fontSize: {
        'luxury-xs': ['0.75rem', '1.4'],
        'luxury-sm': ['0.875rem', '1.4'],
        // ... complete luxury scale
      },
      letterSpacing: {
        'luxury-tight': '-0.02em',
        // ... complete spacing scale
      }
    }
  }
}
```

### Implementation Checklist

**Typography Implementation**
- [ ] All text elements use `font-serif font-normal tracking-luxury-tight`
- [ ] Proper heading hierarchy with luxury typography scales
- [ ] Consistent letter spacing across all components
- [ ] Dark mode typography contrast verified

**Color Implementation**
- [ ] All components use semantic color variables
- [ ] Bronze accent system applied consistently
- [ ] Dark mode color variants implemented
- [ ] Accessibility contrast ratios verified

**Component Implementation**
- [ ] Button variants follow bronze styling guide
- [ ] Card components use luxury styling
- [ ] Form elements maintain consistent appearance
- [ ] Focus states implemented for accessibility

**Advanced Implementation**
- [ ] Glass morphism effects applied consistently
- [ ] Bronze metallic system with specular highlights
- [ ] Motion preference detection and reduced animation
- [ ] Forced colors mode support for accessibility
- [ ] Dark mode bronze scale variations implemented
- [ ] Shimmer and glow effects for luxury buttons

**Quality Assurance**
- [ ] Visual consistency across all pages
- [ ] Dark mode functionality with enhanced bronze scale
- [ ] Mobile responsiveness with touch-optimized targets
- [ ] Accessibility guidelines followed (WCAG 2.1 AA)
- [ ] High contrast mode support verified
- [ ] Motion reduction preferences respected
- [ ] Focus indicators visible and properly styled
- [ ] Glass effects working across all browsers

---

*This brand kit ensures visual consistency and luxury aesthetic across the VacationRentalOahu.co platform. All implementations should reference these guidelines to maintain brand integrity.*