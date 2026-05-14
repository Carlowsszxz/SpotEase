# SVG Seat Reservation System - AI Edit Guide

## Purpose
Create an interactive seat reservation system with an SVG floorplan visualization. Users can click on seats to toggle between free/occupied status, with real-time statistics and a live table display.

## Current Setup (testing-final.html)
- **Total Elements**: 9 (1 structural + 8 clickable seats)
- **Clickable Seats**: seat-002 through seat-009 (all with class="seat")
- **Structural Element**: seat-001 (class="structural-element" - gray, non-interactive)
- **Seat Statuses**: free (green), occupied (red), reserved (orange)

## SVG Structure Inspection Checklist

### Step 1: Analyze the SVG File
When given a new SVG file, immediately check:
1. **Wrapper Elements**: Look for `<g>` tags, `<clipPath>` elements
2. **Background**: Should have a `<rect>` with `fill="white"` for the background
3. **Room Border**: Identify the room boundary (could be `<rect>` or `<path>`)
4. **Seat Elements**: 
   - Can be `<rect>` or `<path>` elements
   - Count how many actual seats exist
   - Identify which is structural (e.g., a table, counter)

### Step 2: Seat Classification
**Clickable Seats** - These are the interactive seats users can toggle:
- Should have `id="seat-XXX"` format
- Should have `class="seat status-free"` (or initial status)
- These WILL appear in the table and statistics

**Structural Elements** - These are NOT clickable:
- Examples: tables, counters, waiting areas, fixtures
- Should have `id="seat-XXX"` (for clarity) but `class="structural-element"`
- Should NOT appear in the table
- Color: Gray (#9e9e9e)
- Cursor: default
- No hover effects

## HTML Template Updates

### SVG Section
```html
<svg width="VIEWBOX_WIDTH" height="VIEWBOX_HEIGHT" viewBox="0 0 WIDTH HEIGHT" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clipPath)">
        <!-- Background -->
        <rect width="WIDTH" height="HEIGHT" fill="white"/>
        
        <!-- Room border (path or rect) -->
        <!-- Copy EXACTLY as provided in source SVG -->
        
        <!-- Clickable seats -->
        <path id="seat-002" class="seat status-free" ... />
        <path id="seat-003" class="seat status-free" ... />
        <!-- etc -->
        
        <!-- Structural elements -->
        <rect id="seat-001" class="structural-element" ... />
    </g>
    <defs>
        <clipPath id="clipPath">
            <!-- Copy EXACTLY as provided -->
        </clipPath>
    </defs>
</svg>
```

### Statistics Section
Update the initial counts to match actual clickable seats (exclude structural elements):
```html
<div id="count-free">X</div>      <!-- Total clickable seats minus occupied/reserved -->
<div id="count-occupied">Y</div>  <!-- Usually starts at 0 -->
<div id="count-reserved">Z</div>  <!-- Usually starts at 0 -->
```

### Info Section
Update with correct seat counts:
```html
<p>• X total clickable seats in this layout</p>
<p>• seat-001 is a structural [ELEMENT TYPE] (gray) - not clickable</p>
```

## CSS Styling Rules

### For Clickable Seats
```css
.seat.status-free {
    fill: #4caf50 !important;      /* Green */
    stroke: #388e3c !important;
}

.seat.status-occupied {
    fill: #f44336 !important;      /* Red */
    stroke: #c62828 !important;
}

.seat.status-reserved {
    fill: #ff9800 !important;      /* Orange */
    stroke: #e65100 !important;
}

.seat {
    cursor: pointer;
    transition: all 0.2s ease;
}

.seat:hover {
    filter: brightness(0.85);
    stroke-width: 2 !important;
}
```

### For Structural Elements
```css
.structural-element {
    fill: #9e9e9e !important;      /* Gray */
    stroke: #757575 !important;
    cursor: default;
}

.structural-element:hover {
    filter: none;                  /* No hover effect */
}
```

## JavaScript Functions (No Changes Needed)

The JavaScript is already configured to:

1. **Query only `.seat` elements** - Automatically excludes structural elements from:
   - Table generation
   - Statistics calculation
   - Click handlers

2. **updateSeat(seatId, status)** - Updates individual seat status
3. **generateSeatsTable()** - Creates table from `.seat` elements only
4. **updateStats()** - Counts only `.seat` elements
5. **initializePage()** - Adds click handlers only to `.seat` elements

**Note**: If structural element statuses need to be set (for visual purposes), manually call `updateSeat('seat-001', 'free')` but the seat will NOT appear in the table.

## Common Tasks

### Task: Add a New Seat
1. Copy the format of an existing seat in the SVG
2. Assign `id="seat-XXX"`
3. Assign `class="seat status-free"`
4. Paste the SVG path or rect data
5. Update statistics initial counts

### Task: Mark a Seat as Structural
1. Change `class="seat status-free"` to `class="structural-element"`
2. Update documentation in the info section
3. Update statistics counts to exclude this seat

### Task: Set Initial Seat Status
In the `initializePage()` function, add:
```javascript
updateSeat('seat-003', 'occupied');  // Makes it red
updateSeat('seat-006', 'reserved');  // Makes it orange
```

### Task: Scale to More Seats (e.g., 63 seats)
1. Get the new SVG with all 63 seat elements
2. Identify structural elements vs clickable seats
3. Apply the same HTML template with all seats
4. Update the statistics initial counts
5. Test to ensure all seats render and are clickable

## Validation Checklist

After making changes:

- [ ] SVG renders with white background visible
- [ ] Room border is visible and black
- [ ] All clickable seats are displayed in correct colors
- [ ] Structural elements are gray
- [ ] Table appears below SVG with correct seat list
- [ ] Statistics match table row count
- [ ] Clicking seats toggles between free/occupied
- [ ] Reserved seats don't toggle
- [ ] Table updates in real-time when seats are clicked

## Critical Notes

1. **!important flags**: CSS uses `!important` to override inline SVG fill/stroke attributes
2. **No nested selectors for seats**: Use `.seat` directly, NOT `.seat path` or `.seat > g`
3. **Structural elements excluded**: Only elements with `class="seat"` appear in table/stats
4. **Browser cache**: Always hard refresh (Ctrl+F5) to see changes
5. **SVG coordinates**: Copy SVG paths/rects EXACTLY as provided; don't modify coordinates

## Troubleshooting

**Issue**: Seats not visible
- Solution: Check CSS has `!important` flags
- Check SVG viewBox matches actual content area

**Issue**: Background transparent
- Solution: Ensure `<rect width="WIDTH" height="HEIGHT" fill="white"/>` is inside clip-path group

**Issue**: Table doesn't show
- Solution: Check `.seats-table` CSS has `width: 100%`
- Verify `generateSeatsTable()` is called in `initializePage()`

**Issue**: Structural element appears in table
- Solution: Verify `class="structural-element"` is used, NOT `class="seat ..."`
- JavaScript only queries `.seat` elements

## File References
- **Main file**: testing-final.html
- **Source SVG**: test ulit.svg (or latest provided SVG)
- **Documentation**: This file (svg-edit.md)
