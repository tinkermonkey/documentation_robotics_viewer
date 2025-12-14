# Icon Migration: react-icons → lucide-react

This document maps react-icons (HeroIcons) to lucide-react equivalents for standardizing icon usage across the Documentation Robotics Viewer.

## Icon Mapping

| react-icons (HeroIcons) | lucide-react | Notes |
|-------------------------|--------------|-------|
| `HiPlus` | `Plus` | Add/Create actions |
| `HiX` | `X` | Close/Cancel actions |
| `HiArrowUp` | `ArrowUp` | Upward navigation |
| `HiArrowDown` | `ArrowDown` | Downward navigation |
| `HiShare` | `Share2` | Share actions |
| `HiEye` | `Eye` | View/Preview actions |
| `HiZoomIn` | `ZoomIn` | Zoom controls |
| `HiHome` | `Home` | Home/Root navigation |
| `HiViewGrid` | `Grid` | Grid view toggle |
| `HiDownload` | `Download` | Download/Export actions |
| `HiDocumentReport` | `FileText` | Document/Report icons |

## Import Pattern

### Before (react-icons)
```tsx
import { HiPlus, HiX } from 'react-icons/hi';

<HiPlus className="w-5 h-5" />
<HiX className="w-4 h-4" />
```

### After (lucide-react)
```tsx
import { Plus, X } from 'lucide-react';

<Plus className="w-5 h-5" />
<X className="w-4 h-4" />
```

## Files to Update

1. `src/apps/embedded/components/AnnotationPanel.tsx` - HiPlus
2. `src/apps/embedded/components/C4ControlPanel.tsx` - HiViewGrid, HiDownload, HiX
3. `src/apps/embedded/components/C4FilterPanel.tsx` - HiX
4. `src/apps/embedded/components/MotivationControlPanel.tsx` - HiViewGrid, HiDownload, HiX, HiDocumentReport
5. `src/apps/embedded/components/MotivationFilterPanel.tsx` - HiX
6. `src/apps/embedded/components/C4BreadcrumbNav.tsx` - HiHome
7. `src/apps/embedded/components/C4InspectorPanel.tsx` - HiArrowUp, HiArrowDown, HiShare, HiEye, HiX
8. `src/apps/embedded/components/MotivationBreadcrumb.tsx` - HiHome
9. `src/apps/embedded/components/MotivationInspectorPanel.tsx` - HiArrowUp, HiArrowDown, HiZoomIn, HiX

## Migration Checklist

- [ ] Create icon mapping document
- [ ] Update AnnotationPanel.tsx
- [ ] Update C4ControlPanel.tsx
- [ ] Update C4FilterPanel.tsx
- [ ] Update MotivationControlPanel.tsx
- [ ] Update MotivationFilterPanel.tsx
- [ ] Update C4BreadcrumbNav.tsx
- [ ] Update C4InspectorPanel.tsx
- [ ] Update MotivationBreadcrumb.tsx
- [ ] Update MotivationInspectorPanel.tsx
- [ ] Build and test
- [ ] Remove react-icons from package.json (optional, if no other dependencies)

## Benefits

- **Consistency**: Single icon library across entire codebase
- **Bundle Size**: Lucide-react has better tree-shaking
- **Design Alignment**: Matches design prototype pattern
- **Maintenance**: Single source of truth for icons
