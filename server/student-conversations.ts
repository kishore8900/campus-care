import type { KnowledgeDocument } from './knowledge.js'

// Reviewed adaptations of the ten user-supplied sample conversations.
// Reference data, not model training or claims of unavailable tools.
export const studentConversations: KnowledgeDocument[] = [
  {
    id: 'sample-stacks', title: 'Student examples · stacks and exam answers',
    keywords: ['stack', 'stacks', 'lifo', 'push', 'pop', 'peek', 'data structures'],
    content: 'Data structures topics include arrays, linked lists, stacks, queues, trees and graphs. A stack follows Last In, First Out (LIFO), like plates: the last plate added is the first removed. Push adds to the top; pop removes the top; peek views the top; isEmpty checks whether it is empty. Example 3-mark answer: A stack is a linear data structure following LIFO. Insertion and deletion happen at one end, called the top. Its main operations are push, pop and peek. Uses include function calls, expression evaluation and undo. The requested format is not a guarantee of a grade.'
  },
  {
    id: 'sample-c-loops', title: 'Student examples · C loops',
    keywords: ['c programming', 'c language', 'loop', 'loops', 'iteration', 'for loop', 'while loop'],
    content: 'In C, a loop repeats a block while its continuation condition holds. The three forms are for, while and do-while; do-while executes its body at least once. Example program:\n```c\n#include <stdio.h>\n\nint main(void) {\n    for (int i = 1; i <= 5; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}\n```\nExpected output: 1 through 5, each on a new line. i starts at 1, i <= 5 is checked before each iteration, and i++ increases it after each iteration. At 6 the condition is false. The chatbot has not executed this code.'
  },
  {
    id: 'sample-ai-assignment', title: 'Student examples · AI assignment',
    keywords: ['artificial intelligence', 'ai assignment', 'assignment about ai', 'introduction to ai'],
    content: 'An Artificial Intelligence assignment can cover an introduction, types of AI, applications, advantages, limitations, future directions and a conclusion. Example short introduction: Artificial Intelligence is a branch of computer science concerned with systems that perform tasks such as learning, problem-solving, decision-making, understanding language and recognizing images. A sample paragraph is a starting point; follow the instructor’s requirements and verify sources. No invented citations.'
  },
  {
    id: 'sample-exam-preparation', title: 'Student examples · two-hour revision and quizzes',
    keywords: ['exam', 'revision', 'revise', 'two hours', '2 hours', 'quiz', 'preparation'],
    content: 'Example two-hour revision plan: 40 minutes on priority definitions and concepts, 40 on practice problems or programs, 25 on previous questions the student actually has, and 15 reviewing formulas, keywords and gaps. Adjust to the subject; no guaranteed results or claims about upcoming exam questions. A quiz asks one question, waits for an answer, then gives brief feedback before the next question. For stacks: Q1 What does LIFO stand for? Answer: Last In, First Out. Q2 Which operation inserts an element? Answer: push. Ask for a subject if none has been discussed.'
  },
  {
    id: 'sample-student-project', title: 'Student examples · a beginner AI project',
    keywords: ['ai project', 'college project', 'study assistant', 'beginner project'],
    content: 'Example project: an AI Study Assistant for subject questions, explanations, quizzes and summaries of student-supplied text. Start with one useful flow, then add saved topics and plans. A possible stack is React, Node.js with Express, PostgreSQL such as Supabase, authentication, and a local LLM or server-side model API. Store provider secrets only on the server. Test the API and student flow. This is a project proposal, not a claim that CampusCare already has uploads or quiz tracking.'
  },
  {
    id: 'sample-study-stress', title: 'Student examples · coursework pressure',
    keywords: ['stressed', 'overwhelmed', 'assignments', 'exam pressure', 'many deadlines', 'too much work'],
    content: 'Example: That sounds like a lot to handle at once. Let’s choose one manageable next step. Useful planning inputs are exam dates, deadlines, difficult subjects and quick tasks. A possible rhythm is 25 minutes of work followed by a 5-minute break, adjusted to the student. For programming, maths and an assignment, check deadlines rather than assuming an order. If the assignment is due soon, start a small part, then reserve time for programming and maths practice. This is planning support, not treatment.'
  },
  {
    id: 'sample-full-stack', title: 'Student examples · full-stack learning path',
    keywords: ['full stack', 'fullstack', 'developer', 'web development', 'learning path'],
    content: 'Example full-stack path: HTML and CSS, JavaScript, Git and GitHub, React, Node.js and Express, SQL, REST APIs, authentication, testing and deployment. Learn by building small projects. A first Student Task Manager can include registration/login, adding/editing/deleting tasks, completion status, filters and database storage. Each student should access only their own tasks. Adapt to current skills; no guaranteed job or fixed learning time.'
  },
  {
    id: 'sample-class-notes', title: 'Student examples · working with pasted notes',
    keywords: ['notes', 'chapter', 'uploaded', 'document', 'flashcards', 'exam points'],
    content: 'CampusCare cannot open uploaded files or access class notes outside this chat. For Chapter 2 without its text, explain this and ask the student to paste the section. Supplied text can become a summary, definitions, formulas, key concepts, practice questions, flashcards or a brief explanation. Do not invent a chapter, claim a file was read, or claim questions are commonly examined without evidence. Break long notes into smaller excerpts.'
  },
  {
    id: 'sample-debugging', title: 'Student examples · programming errors',
    keywords: ['syntaxerror', 'syntax error', 'debugging', 'program error', 'error message'],
    content: 'For a failed program without code, ask for relevant code, exact error, language and expected behavior. SyntaxError means code does not follow the language’s grammar. Causes depend on the language: unmatched brackets or quotes, malformed keywords, or indentation in Python; semicolons are required in some languages, not all. An error name alone cannot locate the exact bug. Never claim execution or a particular broken line without evidence.'
  },
  {
    id: 'sample-conversation-close', title: 'Student examples · friendly conversation',
    keywords: ['hi', 'hello', 'hey', 'thanks', 'thank you', 'understood', 'okay'],
    content: 'Example greeting: Hi! What would you like a hand with today? After “Thanks, now I understand”: You’re welcome! If you’d like, try explaining it in your own words to check your understanding. After “Okay”, a short acknowledgement is enough. Friendly conversation does not need repeated praise, long menus, forced follow-ups or requests to create an account. CampusCare is AI, not a human teacher or staff member.'
  }
]
