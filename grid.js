// הגדרות גריד
let GRID_SIZE = 100; // המרחק בין נקודות הגריד
let GRID_SNAP_THRESHOLD = GRID_SIZE / 2; // המרחק המקסימלי להצמדה

// פונקציית עזר להצמדה לגריד
function snapToGrid(position) {
    return {
        x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
    };
}

// פונקציית עזר לבדיקה אם מיקום פנוי
function isPositionOccupied(position) {
    return cy.nodes().some(node => {
        const nodePos = node.position();
        return nodePos.x === position.x && nodePos.y === position.y;
    });
}

// פונקציית עזר למציאת מיקום פנוי בצורה מעגלית (לאנשים חדשים)
function findFreePositionCircular(startPosition) {
    // בדיקת המיקום ההתחלתי
    if (!isPositionOccupied(startPosition)) {
        return startPosition;
    }
    
    // חיפוש במעגלים מתרחבים
    for (let radius = 1; radius < 5; radius++) {
        // מספר הנקודות במעגל גדל ככל שהרדיוס גדל
        const pointsInCircle = Math.max(8 * radius, 8);
        
        for (let i = 0; i < pointsInCircle; i++) {
            // חישוב זווית בין 0 ל-2π
            const angle = (i * 2 * Math.PI) / pointsInCircle;
            
            // חישוב המיקום על המעגל
            const position = {
                x: startPosition.x + Math.cos(angle) * (GRID_SIZE * radius),
                y: startPosition.y + Math.sin(angle) * (GRID_SIZE * radius)
            };
            
            // הצמדה לגריד
            const snappedPosition = snapToGrid(position);
            
            if (!isPositionOccupied(snappedPosition)) {
                return snappedPosition;
            }
        }
    }
    
    // אם לא נמצא מיקום פנוי, נחזיר מיקום אקראי בריבוע קטן יותר
    return {
        x: startPosition.x + (Math.random() * 300 - 150),
        y: startPosition.y + (Math.random() * 300 - 150)
    };
}

// פונקציית עזר למציאת מיקום פנוי באותה שורה (לגרירה)
function findFreePositionDrag(startPosition, originalPosition) {
    // בדיקת המיקום ההתחלתי
    if (!isPositionOccupied(startPosition)) {
        return startPosition;
    }
    
    // קביעת כיוון החיפוש הראשוני לפי המיקום המקורי
    const searchRight = originalPosition.x > startPosition.x;
    
    // חיפוש מיקום פנוי באותה שורה
    for (let offset = 1; offset <= 4; offset++) {
        // בודקים קודם בכיוון המועדף
        const preferredPos = {
            x: startPosition.x + (GRID_SIZE * offset * (searchRight ? 1 : -1)),
            y: startPosition.y
        };
        if (!isPositionOccupied(preferredPos)) {
            return preferredPos;
        }
        
        // בודקים בכיוון הנגדי
        const oppositePos = {
            x: startPosition.x + (GRID_SIZE * offset * (searchRight ? -1 : 1)),
            y: startPosition.y
        };
        if (!isPositionOccupied(oppositePos)) {
            return oppositePos;
        }
    }
    
    // אם לא נמצא מקום באותה שורה, מחפשים במעגלים
    return findFreePositionCircular(startPosition);
}

// עונקציה ליצירת קווי גריד
function drawGrid() {
    console.log('Drawing grid...');
    
    // מחיקת קווי גריד קיימים
    cy.remove('.grid-line');
    
    // חישוב גבולות הגריד
    const extent = cy.extent();
    console.log('Extent:', extent);
    
    // הוספת קווים אופקיים
    const startY = Math.floor(extent.y1 / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil(extent.y2 / GRID_SIZE) * GRID_SIZE;
    
    console.log(`Creating lines from ${startY} to ${endY} with step ${GRID_SIZE}`);
    
    for (let y = startY; y <= endY; y += GRID_SIZE) {
        // יצירת נקודות קצה
        const startNode = {
            group: 'nodes',
            data: { id: `grid-start-${y}` },
            position: { x: extent.x1, y: y },
            classes: 'grid-line',
            selectable: false,
            style: { 'opacity': 0, 'width': 1, 'height': 1 }
        };
        
        const endNode = {
            group: 'nodes',
            data: { id: `grid-end-${y}` },
            position: { x: extent.x2, y: y },
            classes: 'grid-line',
            selectable: false,
            style: { 'opacity': 0, 'width': 1, 'height': 1 }
        };
        
        // יצירת הקו
        const line = {
            group: 'edges',
            data: { 
                id: `grid-h-${y}`,
                source: `grid-start-${y}`,
                target: `grid-end-${y}`
            },
            classes: 'grid-line',
            selectable: false
        };
        
        // הוספה לגרף
        cy.add([startNode, endNode, line]);
    }
    
    console.log('Grid elements:', cy.$('.grid-line').length);
}

// ייצוא הפונקציות הנחוצות
export {
    GRID_SIZE,
    GRID_SNAP_THRESHOLD,
    snapToGrid,
    isPositionOccupied,
    findFreePositionCircular,
    findFreePositionDrag,
    drawGrid
}; 