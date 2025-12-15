# Backend API Documentation

**Base URL:** `http://localhost:5000` (development) or your deployed backend URL

---

## Free Assessment Content API

Base path: `/api/free-assessment-content`

### Get Active Content (FOR FRONTEND)

Fetches active test content to display to users.

```
GET /api/free-assessment-content/active/:type?examType=general
```

**Parameters:**
- `:type` - Section type: `listening` | `reading` | `writing`
- `examType` (query) - Exam type: `general` | `academic` (default: `general`)
  - Note: `general-education` maps to `general`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "sectionType": "listening",
    "examType": "general",
    "isActive": true,
    "totalQuestions": 40,
    "lastUpdatedAt": "2024-12-15T...",
    
    // For Listening:
    "listeningAudioUrl": "https://res.cloudinary.com/.../audio.mp3",
    "listeningAudioTitle": "IELTS Listening Test",
    "listeningParts": [
      {
        "partNumber": 1,
        "questions": [
          {
            "questionNumber": 1,
            "type": "fill-blank",
            "questionText": "The applicant's name is ___",
            "instruction": "Complete the form below",
            "options": [],
            "correctAnswer": "Smith"
          }
        ]
      }
    ],
    
    // For Reading:
    "readingPassages": [
      {
        "passageNumber": 1,
        "title": "Passage Title",
        "content": "<p>HTML content of the passage...</p>",
        "sectionLabels": ["A", "B", "C"],
        "questions": [...]
      }
    ],
    
    // For Writing:
    "writingTasks": [
      {
        "taskNumber": 1,
        "taskType": "task1",
        "title": "Writing Task 1",
        "prompt": "Describe the graph below...",
        "description": "Write at least 150 words",
        "imageUrl": "https://res.cloudinary.com/.../chart.png",
        "minWords": 150,
        "timeAllocation": 20
      }
    ]
  }
}
```

**Error Responses:**
- `400` - Invalid section type or exam type
- `404` - No active content found
- `500` - Server error

---

## Question Types

| Type | Description | Fields Used |
|------|-------------|-------------|
| `mcq` | Multiple choice (single answer) | `options[]`, `correctAnswer` |
| `fill-blank` | Fill in the blank | `correctAnswer` |
| `short-answer` | Short text answer | `correctAnswer` |
| `true-false-ng` | True/False/Not Given | `options[]`, `correctAnswer` |
| `matching` | Match left to right | `matchingPairs[]` |
| `matching-sections` | Match to labeled sections | `sectionOptions[]`, `correctAnswer` |
| `multiple-selection` | Select multiple answers | `options[]`, `selectCount`, `correctAnswer` (comma-separated) |
| `summary-completion` | Complete a summary | `summaryText`, `correctAnswer` |
| `instruction` | Instruction block (not a question) | `questionText` as instruction |

---

## Example API Calls

### Fetch Listening Test
```javascript
const response = await fetch('http://localhost:5000/api/free-assessment-content/active/listening?examType=general');
const { success, data } = await response.json();

// Audio URL
const audioUrl = data.listeningAudioUrl;

// Parts and questions
data.listeningParts.forEach(part => {
  console.log(`Part ${part.partNumber}`);
  part.questions.forEach(q => {
    console.log(`Q${q.questionNumber}: ${q.questionText}`);
  });
});
```

### Fetch Reading Test
```javascript
const response = await fetch('http://localhost:5000/api/free-assessment-content/active/reading?examType=academic');
const { success, data } = await response.json();

data.readingPassages.forEach(passage => {
  console.log(`Passage ${passage.passageNumber}: ${passage.title}`);
  console.log('Content:', passage.content); // HTML content
  passage.questions.forEach(q => {
    console.log(`Q${q.questionNumber}: ${q.questionText}`);
  });
});
```

### Fetch Writing Test
```javascript
const response = await fetch('http://localhost:5000/api/free-assessment-content/active/writing?examType=general');
const { success, data } = await response.json();

data.writingTasks.forEach(task => {
  console.log(`${task.title} (${task.minWords} words min)`);
  console.log('Prompt:', task.prompt);
  if (task.imageUrl) {
    console.log('Image:', task.imageUrl);
  }
});
```

---

## Other Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/admin/auth/login` | Admin login |

### Free Assessments (User Progress)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/free-assessments` | Create new assessment session |
| PUT | `/api/free-assessments/:id/progress` | Update progress |
| GET | `/api/free-assessments` | Get all (admin) |
| GET | `/api/free-assessments/stats` | Get stats (admin) |

### Content Management (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/free-assessment-content/:type` | Get content by type |
| POST | `/api/free-assessment-content/listening` | Save listening content |
| POST | `/api/free-assessment-content/reading` | Save reading content |
| POST | `/api/free-assessment-content/writing` | Save writing content |
| PATCH | `/api/free-assessment-content/:type/toggle` | Toggle active status |
| POST | `/api/free-assessment-content/upload/audio` | Upload audio file |
| POST | `/api/free-assessment-content/upload/image` | Upload image file |

---

## CORS Configuration

Allowed origins (add your frontend URL here):
```javascript
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "https://oneake.vercel.app"
];
```

---

## Data Structure Summary

```
FreeAssessmentContent {
  sectionType: "listening" | "reading" | "writing"
  examType: "general" | "academic"
  isActive: boolean
  
  // Listening specific
  listeningAudioUrl?: string
  listeningParts?: [{
    partNumber: number
    questions: Question[]
  }]
  
  // Reading specific
  readingPassages?: [{
    passageNumber: number
    title: string
    content: string (HTML)
    questions: Question[]
  }]
  
  // Writing specific
  writingTasks?: [{
    taskNumber: number
    taskType: "task1" | "task2"
    title: string
    prompt: string
    imageUrl?: string
    minWords: number
    timeAllocation: number
  }]
}

Question {
  questionNumber: number
  type: string
  questionText: string
  instruction?: string
  options?: string[]
  correctAnswer: string
}
```
