// ייבוא הפונקציות מ-grid.js
import { 
    GRID_SIZE,
    GRID_SNAP_THRESHOLD,
    snapToGrid,
    isPositionOccupied,
    findFreePositionCircular,
    findFreePositionDrag,
    drawGrid
} from './grid.js';

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

let currentEditId = null;
const modal = document.getElementById('editModal');
let isCreatingEdge = false;  // מצב יצירת קשרים
let firstSelectedNode = null;  // השמירה של הצומת הראשון שנבחר

// פונקציה להפעלת/כיבוי מצב יצירת קשרים
function toggleEdgeCreation() {
    isCreatingEdge = !isCreatingEdge;
    firstSelectedNode = null;  // איפוס הבחירה
    
    // עדכון הכפתור
    const btn = document.getElementById('createEdgeBtn');
    if (btn) {
        btn.classList.toggle('active', isCreatingEdge);
        btn.textContent = isCreatingEdge ? 'בטל יצירת קשר' : 'צור קשר';
    }
    
    // שינוי סמן העכבר בהתאם למצב
    cy.container().style.cursor = isCreatingEdge ? 'crosshair' : 'default';
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

function exportImage() {
    // הסתרת קווי הגריד זמנית
    cy.$('.grid-line').style('opacity', 0);
    
    // יצירת תמונה
    const png64 = cy.png({
        scale: 2,  // איכות גבוהה יותר
        full: true,  // כל העץ
        bg: '#ffffff'  // רקע לבן
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

// אירועים
cy.on('tap', 'node', function(evt) {
    if (isCreatingEdge) {
        const clickedNode = evt.target;
        
        if (!firstSelectedNode) {
            // בחירה ראשונה
            firstSelectedNode = clickedNode;
            firstSelectedNode.addClass('selected');
        } else if (firstSelectedNode.id() !== clickedNode.id()) {
            // בחירה שניה - יצירת הקשר
            cy.add({
                group: 'edges',
                data: {
                    id: 'edge-' + Date.now(),
                    source: firstSelectedNode.id(),
                    target: clickedNode.id()
                }
            });
            
            // איפוס המצב
            firstSelectedNode.removeClass('selected');
            firstSelectedNode = null;
            toggleEdgeCreation();
        }
    } else {
        openEditModal(evt.target);
    }
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

// הוספת סגנון לצמתים נבחרים
cy.style().selector('.selected').style({
    'border-width': 4,
    'border-color': '#ff0000'
}).update();

// ייצוא הפונקציות הנחוצות
export {
    addPerson,
    openEditModal,
    closeModal,
    savePerson,
    deletePerson,
    exportImage,
    toggleEdgeCreation
};

// חשיפת הפונקציות לחלון הגלובלי
window.addPerson = addPerson;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.savePerson = savePerson;
window.deletePerson = deletePerson;
window.exportImage = exportImage;
window.toggleEdgeCreation = toggleEdgeCreation;

// טעינת המידע בעת טעינת הדף
window.addEventListener('DOMContentLoaded', () => {
    loadPeopleFromStorage();
}); 