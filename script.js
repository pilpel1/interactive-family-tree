/*
הקובץ הזה פוצל לשני קבצים:
1. grid.js - מכיל את כל הלוגיקה של הגריד
2. main.js - מכיל את כל שאר הלוגיקה של האפליקציה

כדי להחזיר הכל לקובץ אחד:
1. העתק את כל התוכן של grid.js (חוץ מה-export בסוף)
2. העתק את כל התוכן של main.js (חוץ מה-import בהתחלה וה-export בסוף)
3. הדבק את שניהם לכאן לפי הסדר: קודם grid.js ואז main.js

שים לב: אין צורך בייבוא/ייצוא של פונקציות כשהכל נמצא באותו קובץ
*/

// הגדרות גריד
let GRID_SIZE = 100; // המרחק בין נקודות הגריד
let GRID_SNAP_THRESHOLD = GRID_SIZE / 2; // המרחק המקסימלי להצמדה

// אתחול המערכת
const cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
        {
            selector: 'node[gender = "male"]',
            style: {
                'label': 'data(name)',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 50,
                'height': 50,
                'shape': 'rectangle',
                'background-color': '#fff',
                'border-width': 2,
                'border-color': '#666',
                'z-index': 999
            }
        },
        {
            selector: 'node[gender = "female"]',
            style: {
                'label': 'data(name)',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 50,
                'height': 50,
                'shape': 'ellipse',
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
    
    // אם לא נמצא מיקום פנוי, נמצא מיקום אקראי בריבוע קטן יותר
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
        cy.edges().forEach(updateEdgeStyle);
    }
}

let isCreatingEdge = false;
let firstSelectedNode = null;
const relationshipModal = document.getElementById('relationshipModal');
let pendingRelationship = null;

function closeRelationshipModal() {
    relationshipModal.style.display = 'none';
    if (firstSelectedNode) {
        firstSelectedNode.removeClass('selected');
        firstSelectedNode = null;
    }
    pendingRelationship = null;
    isCreatingEdge = false;
}

function saveRelationship() {
    if (!pendingRelationship) return;
    
    const { source, target } = pendingRelationship;
    const relationshipType = document.getElementById('relationshipType').value;
    
    if (relationshipType === 'parent-child') {
        // בדיקה אם יש כבר קשר נישואין לצומת המקור
        const spouseEdge = source.connectedEdges().filter(edge => 
            edge.data('relationship') === 'spouse'
        )[0];
        
        if (spouseEdge) {
            // מצאנו בן/בת זוג - נוסיף קשר הורה-ילד משניהם
            const otherParent = spouseEdge.source().id() === source.id() 
                ? spouseEdge.target() 
                : spouseEdge.source();
            
            // יצירת צומת ביניים לקשר ההורות
            const parentageNode = {
                group: 'nodes',
                data: { 
                    id: 'parentage-' + Date.now(),
                    virtual: true  // סימון שזה צומת וירטואלי
                },
                position: {
                    x: (source.position().x + otherParent.position().x) / 2,
                    y: (source.position().y + target.position().y) / 2
                },
                classes: 'parentage-node'
            };
            
            // הוספת צומת הביניים
            cy.add(parentageNode);
            const parentageNodeId = parentageNode.data.id;
            
            // יצירת הקשרים
            cy.add([
                {
                    group: 'edges',
                    data: {
                        id: 'edge-parent1-' + Date.now(),
                        source: source.id(),
                        target: parentageNodeId,
                        relationship: 'parentage-connection'
                    }
                },
                {
                    group: 'edges',
                    data: {
                        id: 'edge-parent2-' + Date.now(),
                        source: otherParent.id(),
                        target: parentageNodeId,
                        relationship: 'parentage-connection'
                    }
                },
                {
                    group: 'edges',
                    data: {
                        id: 'edge-child-' + Date.now(),
                        source: parentageNodeId,
                        target: target.id(),
                        relationship: 'parent-child'
                    }
                }
            ]);
        } else {
            // אין בן/בת זוג - נוסיף קשר הורה-ילד רגיל
            cy.add({
                group: 'edges',
                data: {
                    id: 'edge-' + Date.now(),
                    source: source.id(),
                    target: target.id(),
                    relationship: 'parent-child'
                }
            });
        }
    } else {
        // קשר נישואין רגיל
        cy.add({
            group: 'edges',
            data: {
                id: 'edge-' + Date.now(),
                source: source.id(),
                target: target.id(),
                relationship: 'spouse'
            }
        });
    }
    
    // עדכון הסגנונות
    cy.edges().forEach(updateEdgeStyle);
    
    // שמירה ואיפוס
    savePeopleToStorage();
    closeRelationshipModal();
}

function updateEdgeStyle(edge) {
    const relationship = edge.data('relationship');
    
    switch (relationship) {
        case 'parent-child':
            edge.style({
                'line-style': 'solid',
                'target-arrow-shape': 'triangle',
                'line-color': '#666',
                'width': 2
            });
            break;
        case 'parentage-connection':
            edge.style({
                'line-style': 'solid',
                'target-arrow-shape': 'none',
                'line-color': '#666',
                'width': 1
            });
            break;
        case 'spouse':
            edge.style({
                'line-style': 'solid',
                'line-color': '#f00',
                'target-arrow-shape': 'none',
                'width': 2
            });
            break;
    }
}

// הוספת סגנון לצומת הביניים של ההורות
cy.style()
    .selector('.parentage-node')
    .style({
        'width': 10,
        'height': 10,
        'background-color': '#666',
        'label': '',
        'events': 'no'
    })
    .update();

// פונקציה להפעלת/כיבוי מצב יצירת קשרים
function toggleEdgeCreation() {
    isCreatingEdge = !isCreatingEdge;
    firstSelectedNode = null;  // איפוס הבחירה
    
    // עדכון הכפתור
    const btn = document.getElementById('createEdgeBtn');
    if (btn) {
        btn.classList.toggle('active', isCreatingEdge);
        btn.textContent = isCreatingEdge ? 'בטל חיבור' : 'חבר בין אנשים';
    }
    
    // שינוי סמן העכבר בתאם למצב
    cy.container().style.cursor = isCreatingEdge ? 'crosshair' : 'default';
}

// עדכון אירוע הלחיצה על צמתים
cy.on('tap', 'node', function(evt) {
    if (isCreatingEdge) {
        const clickedNode = evt.target;
        
        if (!firstSelectedNode) {
            // בחירה ראשונה
            firstSelectedNode = clickedNode;
            firstSelectedNode.addClass('selected');
        } else if (firstSelectedNode.id() !== clickedNode.id()) {
            // במירת המידע לקשר החדש
            pendingRelationship = {
                source: firstSelectedNode,
                target: clickedNode
            };
            
            // פתיחת הדיאלוג לבחירת סוג הקשר
            relationshipModal.style.display = 'block';
        }
    } else {
        openEditModal(evt.target);
    }
});

// הוספת סגנון לצמתים נבחרים
cy.style().selector('.selected').style({
    'border-width': 4,
    'border-color': '#ff0000'
}).update();

// אירועים
cy.on('drag', 'node', function(evt) {
    const node = evt.target;
    const pos = node.position();
    
    // הצג קווי עזר או נקודות גריד בזמן הגרירה
    // TODO: ��פשר להוסיף ויזואליזציה של הגריד בעתיד
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
    // הסתרת קווי הגריד זמנית
    cy.$('.grid-line').style('opacity', 0);
    
    // מציאת הגבולות של כל הצמתים
    const nodes = cy.nodes().not('.grid-line');
    if (nodes.length === 0) {
        alert('אין צמתים להצגה');
        return;
    }

    const positions = nodes.map(node => node.position());
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    // חישוב גודל האזור
    const width = maxX - minX;
    const height = maxY - minY;
    
    // חישוב ריווח יחסי - 15% מהצד הגדול יותר
    const padding = Math.max(width, height) * 0.15;
    
    // יצירת תמונה
    const png64 = cy.png({
        scale: 2,  // איכות גבוהה יותר
        bg: '#ffffff',  // רקע לבן
        clip: true,  // חיתוך לפי הגבולות
        bounds: [ // [x1, y1, x2, y2]
            minX - padding,
            minY - padding,
            maxX + padding,
            maxY + padding
        ],
        maxWidth: 2000,  // הגבלת רוחב מקסימלי
        maxHeight: 2000  // הגבלת גובה מקסימלי
    });
    
    // החזרת קווי הגריד
    cy.$('.grid-line').style('opacity', 0.8);
    
    // יצירת קישור להורדה
    const downloadLink = document.createElement('a');
    downloadLink.href = png64;
    downloadLink.download = 'family-tree.png';
    
    // הורדת הקובץ
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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

// הוספת תמיכה בגרירת אנשים חדשים
document.querySelectorAll('.draggable-person').forEach(element => {
    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('gender', e.target.dataset.gender);
    });
});

// הגדרת אזור הגרירה על הגרף
cy.container().addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

cy.container().addEventListener('drop', (e) => {
    e.preventDefault();
    
    const gender = e.dataTransfer.getData('gender');
    if (!gender) return;
    
    // המרת מיקום העכבר למיקום בגרף
    const containerBounds = cy.container().getBoundingClientRect();
    const position = {
        x: e.clientX - containerBounds.left,
        y: e.clientY - containerBounds.top
    };
    
    // המרה למיקום בגרף
    const graphPosition = cy.renderer().projectIntoViewport(position.x, position.y);
    const snappedPosition = snapToGrid({ x: graphPosition[0], y: graphPosition[1] });
    const freePosition = findFreePositionCircular(snappedPosition);
    
    // יצירת האדם החדש
    const person = {
        group: 'nodes',
        data: { 
            id: 'person-' + Date.now(),
            name: '',
            gender: gender,
            health: 'healthy',
            notes: ''
        },
        position: freePosition
    };
    
    cy.add(person);
    savePeopleToStorage();
}); 