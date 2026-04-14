export interface Answer {
  text: string;
  points: number;
}

export interface Question {
  id: number;
  question: string;
  answers: Answer[];
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Name something students do the night before a big exam",
    answers: [
      { text: "Cram / Study", points: 42 },
      { text: "Panic / Cry", points: 25 },
      { text: "Drink Coffee / Energy Drinks", points: 15 },
      { text: "Pull an All-Nighter", points: 10 },
      { text: "Pray", points: 5 },
      { text: "Sleep (Finally)", points: 3 }
    ]
  },
  {
    id: 2,
    question: "Name a common excuse for missing a 9 AM lecture",
    answers: [
      { text: "Overslept / Alarm didn't go off", points: 55 },
      { text: "Sick / Hangover", points: 20 },
      { text: "Bus/Train was late", points: 12 },
      { text: "Forgot I had class", points: 8 },
      { text: "Internet was down", points: 5 }
    ]
  },
  {
    id: 3,
    question: "Name something you'd find in a college student's fridge",
    answers: [
      { text: "Leftover Pizza", points: 38 },
      { text: "Expired Milk", points: 22 },
      { text: "Condiments (Ketchup/Mayo)", points: 18 },
      { text: "Beer / Alcohol", points: 12 },
      { text: "Nothing / Just Water", points: 10 }
    ]
  },
  {
    id: 4,
    question: "Name a place on campus where students go to 'study' but actually just socialize",
    answers: [
      { text: "The Library", points: 45 },
      { text: "Student Union / Lounge", points: 30 },
      { text: "Campus Cafe / Starbucks", points: 15 },
      { text: "The Quad / Park", points: 10 }
    ]
  },
  {
    id: 5,
    question: "Name something a professor says that makes students groan",
    answers: [
      { text: "Pop Quiz!", points: 40 },
      { text: "Cumulative Final", points: 25 },
      { text: "Group Project", points: 20 },
      { text: "Not on the slides", points: 10 },
      { text: "I'll post it later", points: 5 }
    ]
  }
];
