// הגדרות גריד
let GRID_SIZE = 100; // המרחק בין נקודות הגריד
let GRID_SNAP_THRESHOLD = GRID_SIZE / 2; // המרחק המקסימלי להצמדה

// אתחול המערכת
const cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
        {
            selector: 'node',
            style: {
                'label': 'data(name)',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 50,
                'height': 50,
                'background-color': '#fff',
                'border-width': 2,
                'border-color': '#666',
                'z-index': 999
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#666',
                'curve-style': 'bezier',
                'z-index': 998
            }
        },
        {
            selector: '.grid-line',
            style: {
                'width': 2,
                'line-color': '#ddd',
                'opacity': 0.8,
                'z-index': 0,
                'curve-style': 'straight',
                'target-arrow-shape': 'none',
                'source-arrow-shape': 'none',
                'line-style': 'solid',
                'events': 'no'
            }
        }
    ]
});

// פונקציית עזר להצמדה לגריד
function snapToGrid(position) {
    return {
        x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
    };
}

let currentEditId = null;
const modal = document.getElementById('editModal');

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

// פונקציות בסיסיות
function addPerson() {
    const id = 'person-' + Date.now();
    const initialPosition = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };
    const snappedPosition = snapToGrid(initialPosition);
    const freePosition = findFreePositionCircular(snappedPosition);
    
    const person = {
        group: 'nodes',
        data: { 
            id: id,
            name: '',
            gender: 'male',
            health: 'healthy',
            notes: ''
        },
        position: freePosition
    };
    
    cy.add(person);
    savePeopleToStorage();
}

function openEditModal(node) {
    currentEditId = node.id();
    const data = node.data();
    
    document.getElementById('personName').value = data.name || '';
    document.getElementById('personGender').value = data.gender || 'male';
    document.getElementById('personHealth').value = data.health || 'healthy';
    document.getElementById('personNotes').value = data.notes || '';
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
    currentEditId = null;
}

function savePerson() {
    if (!currentEditId) return;
    
    const node = cy.getElementById(currentEditId);
    const newData = {
        name: document.getElementById('personName').value,
        gender: document.getElementById('personGender').value,
        health: document.getElementById('personHealth').value,
        notes: document.getElementById('personNotes').value
    };
    
    node.data(newData);
    updateNodeStyle(node);
    savePeopleToStorage();
    closeModal();
}

function deletePerson() {
    if (!currentEditId) return;
    
    cy.getElementById(currentEditId).remove();
    savePeopleToStorage();
    closeModal();
}

function updateNodeStyle(node) {
    const health = node.data('health');
    node.removeClass('healthy sick');
    if (health) {
        node.addClass(health);
    }
}

function savePeopleToStorage() {
    const people = cy.nodes().map(node => ({
        data: node.data(),
        position: node.position()
    }));
    localStorage.setItem('familyTreePeople', JSON.stringify(people));
}

function loadPeopleFromStorage() {
    const saved = localStorage.getItem('familyTreePeople');
    if (saved) {
        const people = JSON.parse(saved);
        cy.add(people);
        cy.nodes().forEach(updateNodeStyle);
    }
}

// אירועים
cy.on('tap', 'node', function(evt) {
    openEditModal(evt.target);
});

cy.on('drag', 'node', function(evt) {
    const node = evt.target;
    const pos = node.position();
    
    // הצג קווי עזר או נקודות גריד בזמן הגרירה
    // TODO: אפשר להוסיף ויזואליזציה של הגריד בעתיד
});

cy.on('dragfree', 'node', function(evt) {
    const node = evt.target;
    const originalPos = node.position(); // המיקום המקורי לפני ההצמדה
    const snappedPos = snapToGrid(originalPos);
    
    // בדיקה אם המיקום החדש תפוס על ידי מישהו אחר
    const currentId = node.id();
    const isOccupied = cy.nodes().some(otherNode => {
        const otherPos = otherNode.position();
        return otherNode.id() !== currentId && 
               otherPos.x === snappedPos.x && 
               otherPos.y === snappedPos.y;
    });
    
    // אם המיקום תפוס, מצא מיקום פנוי קרוב
    const finalPosition = isOccupied ? findFreePositionDrag(snappedPos, originalPos) : snappedPos;
    
    // הצמדה למיקום הסופי
    node.position(finalPosition);
    savePeopleToStorage();
});

// טעינת מידע בעת טעינת הדף
loadPeopleFromStorage();

function exportImage() {
    // TODO: להוסיף ייצוא לתמונה
    alert('בקרוב...');
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

// עדכון אירועי זום ופאן
cy.on('zoom', function() {
    drawGrid();
});

cy.on('pan', function() {
    drawGrid();
});

// קריאה ראשונית לציור הגריד
cy.ready(function() {
    console.log('Cytoscape is ready');
    setTimeout(drawGrid, 100);  // נותן לגרף להתייצב לפני יצירת הגריד
});

// הסרת הקוד הישן של הגריד
const existingGrid = document.querySelector('.grid-lines');
if (existingGrid) {
    existingGrid.remove();
} 