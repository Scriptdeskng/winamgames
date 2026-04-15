// 20 African proverbs — correct answer index NEVER sent to client

export interface ProverbPuzzle {
  id: string;
  /** The proverb with a blank indicated by "___" */
  proverb: string;
  /** 4 options, one is correct */
  options: string[];
  /** Index of correct option (0-3) — server-side only */
  correctIndex: number;
  /** Origin country/culture */
  origin: string;
  difficulty: 1 | 2 | 3;
}

export const WISDOMDROP_PUZZLES: ProverbPuzzle[] = [
  {
    id: "wd-001",
    proverb: "It takes a ___ to raise a child.",
    options: ["village", "family", "father", "teacher"],
    correctIndex: 0,
    origin: "Igbo/Yoruba",
    difficulty: 1,
  },
  {
    id: "wd-002",
    proverb: "A ___ that has no teeth cannot bite.",
    options: ["child", "snake", "dog", "elder"],
    correctIndex: 2,
    origin: "Hausa",
    difficulty: 1,
  },
  {
    id: "wd-003",
    proverb: "When the ___ rises, it does not ask permission.",
    options: ["moon", "sun", "river", "wind"],
    correctIndex: 1,
    origin: "Zulu",
    difficulty: 1,
  },
  {
    id: "wd-004",
    proverb: "The ___ does not fall far from the tree.",
    options: ["leaf", "branch", "apple", "fruit"],
    correctIndex: 3,
    origin: "West African",
    difficulty: 1,
  },
  {
    id: "wd-005",
    proverb: "However long the night, the ___ will appear.",
    options: ["moon", "dawn", "stars", "light"],
    correctIndex: 1,
    origin: "Nigerian",
    difficulty: 2,
  },
  {
    id: "wd-006",
    proverb: "A ___ person is the one who listens to advice.",
    options: ["strong", "wise", "rich", "brave"],
    correctIndex: 1,
    origin: "Swahili",
    difficulty: 1,
  },
  {
    id: "wd-007",
    proverb: "When you follow the path of your ___, you learn to walk like your father.",
    options: ["heart", "brother", "father", "dreams"],
    correctIndex: 2,
    origin: "Ashanti",
    difficulty: 2,
  },
  {
    id: "wd-008",
    proverb: "The ___ that would grow full must first endure the rain.",
    options: ["seed", "flower", "tree", "harvest"],
    correctIndex: 0,
    origin: "Kenyan",
    difficulty: 2,
  },
  {
    id: "wd-009",
    proverb: "Do not look where you ___, look where you stumbled.",
    options: ["walked", "ran", "fell", "stood"],
    correctIndex: 2,
    origin: "Yoruba",
    difficulty: 2,
  },
  {
    id: "wd-010",
    proverb: "A ___ running from a lion doesn't stop to pick up a coin.",
    options: ["man", "child", "warrior", "hunter"],
    correctIndex: 0,
    origin: "Igbo",
    difficulty: 2,
  },
  {
    id: "wd-011",
    proverb: "If you want to go ___, go alone. If you want to go far, go together.",
    options: ["fast", "high", "ahead", "first"],
    correctIndex: 0,
    origin: "East African",
    difficulty: 1,
  },
  {
    id: "wd-012",
    proverb: "The ___ forgets but the axe remembers.",
    options: ["tree", "forest", "root", "wood"],
    correctIndex: 0,
    origin: "Shona",
    difficulty: 2,
  },
  {
    id: "wd-013",
    proverb: "He who learns, ___.",
    options: ["teaches", "grows", "leads", "wins"],
    correctIndex: 0,
    origin: "Ethiopian",
    difficulty: 2,
  },
  {
    id: "wd-014",
    proverb: "The ___ is mightier than the elephant when it comes to destroying a wooden house.",
    options: ["termite", "mouse", "ant", "goat"],
    correctIndex: 0,
    origin: "Hausa",
    difficulty: 3,
  },
  {
    id: "wd-015",
    proverb: "Rain does not fall on one ___ only.",
    options: ["house", "roof", "field", "tree"],
    correctIndex: 1,
    origin: "Cameroonian",
    difficulty: 2,
  },
  {
    id: "wd-016",
    proverb: "The ___ of a dead fish can still hurt you.",
    options: ["tail", "scales", "bones", "smell"],
    correctIndex: 2,
    origin: "Tanzanian",
    difficulty: 3,
  },
  {
    id: "wd-017",
    proverb: "A beautiful thing is never ___.",
    options: ["forgotten", "perfect", "cheap", "common"],
    correctIndex: 1,
    origin: "Egyptian",
    difficulty: 3,
  },
  {
    id: "wd-018",
    proverb: "Until the ___ tells his side of the story, the tale of the hunt will always glorify the hunter.",
    options: ["prey", "lion", "forest", "witness"],
    correctIndex: 1,
    origin: "Igbo",
    difficulty: 2,
  },
  {
    id: "wd-019",
    proverb: "Smooth ___ do not make a skillful sailor.",
    options: ["seas", "winds", "tides", "boats"],
    correctIndex: 0,
    origin: "West African",
    difficulty: 1,
  },
  {
    id: "wd-020",
    proverb: "No matter how hot your ___ is, it will still not cook your food.",
    options: ["anger", "pot", "fire", "heart"],
    correctIndex: 0,
    origin: "Nigerian",
    difficulty: 3,
  },
];
