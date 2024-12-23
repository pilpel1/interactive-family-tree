
## 1. סקירה כללית

### 1.1 מטרת המערכת
פיתוח כלי עזר לייעוץ גנטי המאפשר יצירה ועריכה ויזואלית של עצי משפחה, תוך התמקדות בפשטות שימוש ועבודה ללא תלות באינטרנט.

### 1.2 דרישות ליבה
- עבודה ללא צורך בחיבור לאינטרנט
- ממשק משתמש אינטואיטיבי
- יכולת ייצוא לתמונה
- עלות אפס (שימוש בכלים חינמיים בלבד)
- התקנה והפעלה פשוטות

### 1.3 משתמשי המערכת
- יועצים גנטיים
- רופאים
- חוקרים בתחום הגנטיקה

## 2. ארכיטקטורה טכנית

### 2.1 טכנולוגיות ליבה
- **Frontend Framework**: Vanilla JavaScript (ללא framework)
- **ספריות עיקריות**:
  - Cytoscape.js לניהול הגרף והאינטראקציות
  - html2canvas לייצוא תמונה
- **אחסון**: localStorage (אופציונלי, לשמירת עבודה זמנית)
- **פורמט קבצים**: HTML יחיד (self-contained)

### 2.2 מבנה הקוד
```
project/
│
├── index.html          # קובץ ראשי המכיל את כל הקוד
├── lib/               # ספריות חיצוניות מקומיות
│   ├── cytoscape.min.js
│   └── html2canvas.min.js
│
└── README.md          # הוראות התקנה והפעלה
```

## 3. פונקציונליות מפורטת

### 3.1 ניהול אנשים במשפחה
- **הוספת אדם**:
  - שם (אופציונלי, ברירת מחדל: ריק)
  - מין (אופציונלי, ברירת מחדל: זכר)
  - סטטוס בריאותי (אופציונלי, ברירת מחדל: בריא)
  - הערות נוספות (אופציונלי, ברירת מחדל: ריק)

### 3.2 ניהול קשרים משפחתיים
- **סוגי קשרים**:
  - הורה-ילד (כולל משפחות מרובות ילדים)
  - נישואין/זוגיות
  - אחאים (תמיכה במספר לא מוגבל של אחים במשפחה)

- **יצירת קשרים**:
  - גרירה למעלה: יצירת הורים
  - גרירה לצד: יצירת בן/בת זוג
  - גרירה למטה: יצירת ילדים
  - קישור אחים: אפשרות לסמן מספר אנשים ולהגדירם כאחים

### 3.3 ממשק משתמש
- **סרגל כלים**:
  - כפתורי פעולות מרכזיות
  - אפשרויות ייצוא
  - ביטול פעולה אחרונה

- **תצוגת עץ**:
  - זום (הגדלה/הקטנה)
  - גרירת העץ כולו
  - סימון צבעוני לפי סטטוס בריאותי

### 3.4 ייצוא ושיתוף
- ייצוא לתמונה (PNG/JPG)
- שמירה זמנית בדפדפן
- אפשרות להדפסה

## 4. שלבי פיתוח

### 4.1 שלב 1: תשתית בסיסית (שבוע 1)
- [x] הקמת פרויקט בסיסי
- [x] אינטגרציה עם Cytoscape.js
- [x] יצירת ממשק משתמש בסיסי
- [x] הוספת/עריכת אנשים בסיסית

### 4.2 שלב 2: קשרים ואינטראקציות (שבוע 2)
- [ ] מימוש גרירה ליצירת קשרים
- [ ] עריכת קשרים קיימים
- [ ] הוספת אנימציות וויזואליזציה
- [ ] שיפור UX/UI

### 4.3 שלב 3: פונקציונליות מורחבת (שבוע 3)
- [ ] ייצוא לתמונה
- [ ] שמירה זמנית
- [ ] הוספת Undo/Redo
- [ ] טיפול במקרים מיוחדים

### 4.4 שלב 4: בדיקות וליטוש (שבוע 4)
- [ ] בדיקות מקיפות
- [ ] תיקון באגים
- [ ] אופטימיזציה
- [ ] תיעוד


## 5. מפרט טכני מפורט

### 5.1 מבנה נתונים
```javascript
// מבנה נתונים לאדם
Person = {
    id: string,
    name: string = "איש",              // ברירת מחדל
    gender: 'male' | 'female' = 'male', // ברירת מחדל
    healthStatus: 'healthy' | 'sick' = 'healthy', // ברירת מחדל
    notes: string = "",                 // ברירת מחדל
    position: { x: number, y: number }
}

// מבנה נתונים לקשר
Relationship = {
    id: string,
    type: 'parent-child' | 'partner' | 'sibling',
    source: string,      // Person ID
    target: string,      // Person ID
    properties: {
        siblingGroup?: string  // מזהה קבוצת אחים
    }
}

// מבנה נתונים לקבוצת אחים
SiblingGroup = {
    id: string,
    memberIds: string[], // מערך של Person IDs
    parentIds: string[]  // מערך של Person IDs של ההורים
}
```

### 5.2 לוגיקת קשרי משפחה
```javascript
// דוגמה לפונקציות טיפול באחים
const familyLogic = {
    // הוספת אח/ות לקבוצת אחים קיימת
    addSibling(siblingGroupId: string, newPersonId: string) {
        const group = getSiblingGroup(siblingGroupId);
        group.memberIds.push(newPersonId);
        // עדכון קשרים עם ההורים אוטומטית
        group.parentIds.forEach(parentId => {
            createParentChildRelationship(parentId, newPersonId);
        });
    },

    // יצירת קבוצת אחים חדשה
    createSiblingGroup(personIds: string[], parentIds: string[] = []) {
        const groupId = generateId();
        const group = {
            id: groupId,
            memberIds: personIds,
            parentIds: parentIds
        };
        // יצירת כל הקשרים הנדרשים
        createSiblingRelationships(group);
        return groupId;
    }
};
```

### 5.3 פונקציות עזר לוויזואליזציה
```javascript
// פונקציות לסידור אוטומטי של העץ
const layoutUtils = {
    // סידור אחים בשורה
    arrangeSublings(siblingGroupId: string) {
        const group = getSiblingGroup(siblingGroupId);
        const spacing = 120; // מרווח בין אחים
        // סידור אופקי של כל האחים
        group.memberIds.forEach((memberId, index) => {
            const baseX = getBasePosition(group.parentIds);
            setNodePosition(memberId, {
                x: baseX + (index - (group.memberIds.length - 1) / 2) * spacing,
                y: getParentY(group.parentIds) + 100
            });
        });
    }
};
```

## 6. סיכוני פיתוח וטיפול

### 6.1 סיכונים טכניים
1. **ביצועים**:
   - מעקב אחר צריכת זיכרון
   - אופטימיזציה לעצים גדולים
   
2. **תאימות דפדפנים**:
   - בדיקות ב-Chrome/Firefox/Safari
   - טיפול בהבדלי תצוגה

### 6.2 סיכונים פונקציונליים
1. **מקרי קצה**:
   - נישואין מרובים
   - קשרי משפחה מורכבים
   - מחזוריות בעץ

2. **UX**:
   - פשטות מול גמישות
   - משוב למשתמש
   - התמודדות עם טעויות

3. **מורכבות קשרי משפחה**:
   - טיפול במשפחות מרובות ילדים
   - שמירה על סדר ויזואלי בעץ גדול
   - טיפול במקרים של נישואין מרובים עם ילדים משותפים

## 7. קריטריונים להצלחה

### 7.1 מדדים טכניים
- עבודה חלקה עם עד 100 אנשים בעץ
- תמיכה במשפחות עם עד 15 אחים
- סידור אוטומטי יעיל של עצים מורכבים
- טעינה מהירה (פחות מ-2 שניות)
- עבודה חלקה עם עד 100 אנשים בעץ
- תמיכה בכל הדפדפנים המודרניים

### 7.2 מדדי משתמש
- יכולת ליצור עץ בסיסי תוך 5 דקות
- זמן לימוד קצר (פחות מ-15 דקות)
- שביעות רצון משתמשים

## 8. המלצות להמשך פיתוח

### 8.1 שיפורים עתידיים
- תמיכה בייבוא/ייצוא GEDCOM
- הוספת תבניות מוכנות
- אפשרות לשיתוף עצים
- סטטיסטיקות ודוחות

### 8.2 תחזוקה
- עדכוני ספריות
- גיבוי תקופתי
- מעקב אחר משוב משתמשים