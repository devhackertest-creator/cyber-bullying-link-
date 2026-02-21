import bullyingData from '../data/bullying_words.json';

const BULLYING_WORDS: Record<string, number> = bullyingData;

const CATEGORIES: Record<string, string> = {
  // Insult
  "idiot": "Insult", "stupid": "Insult", "loser": "Insult", "dumb": "Insult", 
  "moron": "Insult", "pathetic": "Insult", "freak": "Insult", "weirdo": "Insult", 
  "lame": "Insult", "weak": "Insult", "coward": "Insult", "clown": "Insult", 
  "joke": "Insult", "nerd": "Insult", "geek": "Insult", "creep": "Insult", 
  "creepy": "Insult", "useless": "Insult", "waste": "Insult", "airhead": "Insult",
  "blockhead": "Insult", "bozo": "Insult", "brainless": "Insult", "dimwit": "Insult",
  "dingbat": "Insult", "dipstick": "Insult", "ditz": "Insult", "dolt": "Insult",
  "dope": "Insult", "dork": "Insult", "dorky": "Insult", "dummy": "Insult",
  "dunce": "Insult", "dweeb": "Insult", "fathead": "Insult", "fool": "Insult",
  "foolish": "Insult", "halfwit": "Insult", "imbecile": "Insult", "incompetent": "Insult",
  "inept": "Insult", "ignorant": "Insult",
  // Physical
  "ugly": "Physical Appearance", "fat": "Physical Appearance", "fatty": "Physical Appearance",
  "hideous": "Physical Appearance", "frumpy": "Physical Appearance", "gawk": "Physical Appearance",
  // Threat
  "kill": "Threat/Violence", "die": "Threat/Violence", "brute": "Threat/Violence",
  "criminal": "Threat/Violence", "fiend": "Threat/Violence", "goon": "Threat/Violence",
  "hoodlum": "Threat/Violence", "hooligan": "Threat/Violence", "hostile": "Threat/Violence",
  "injure": "Threat/Violence", "insurgent": "Threat/Violence", "insurrection": "Threat/Violence",
  // Profanity
  "bitch": "Profanity", "asshole": "Profanity", "fuck": "Profanity", 
  "bastard": "Profanity", "slut": "Profanity", "whore": "Profanity", "stfu": "Profanity",
  "douche": "Profanity", "douchebag": "Profanity", "foul": "Profanity", "harlot": "Profanity",
  // Hate/Degradation
  "hate": "Hate/Degradation", "worthless": "Hate/Degradation", "garbage": "Hate/Degradation", 
  "trash": "Hate/Degradation", "disgusting": "Hate/Degradation", "annoying": "Hate/Degradation", 
  "horrible": "Hate/Degradation", "terrible": "Hate/Degradation", "worst": "Hate/Degradation", 
  "suck": "Hate/Degradation", "sucks": "Hate/Degradation", "fake": "Hate/Degradation", 
  "liar": "Hate/Degradation", "gross": "Hate/Degradation", "nasty": "Hate/Degradation",
  "abomination": "Hate/Degradation", "animal": "Hate/Degradation", "ape": "Hate/Degradation",
  "arrogant": "Hate/Degradation", "awful": "Hate/Degradation", "backstabber": "Hate/Degradation",
  "barbarian": "Hate/Degradation", "beast": "Hate/Degradation", "beggar": "Hate/Degradation",
  "bigot": "Hate/Degradation", "brat": "Hate/Degradation", "bum": "Hate/Degradation",
  "burden": "Hate/Degradation", "cheat": "Hate/Degradation", "corrupt": "Hate/Degradation",
  "crooked": "Hate/Degradation", "cruel": "Hate/Degradation", "deadbeat": "Hate/Degradation",
  "degenerate": "Hate/Degradation", "demon": "Hate/Degradation", "despicable": "Hate/Degradation",
  "devil": "Hate/Degradation", "dirt": "Hate/Degradation", "dirty": "Hate/Degradation",
  "diseased": "Hate/Degradation", "dishonest": "Hate/Degradation", "evil": "Hate/Degradation",
  "failure": "Hate/Degradation", "filth": "Hate/Degradation", "filthy": "Hate/Degradation",
  "fraud": "Hate/Degradation", "ghastly": "Hate/Degradation", "ghetto": "Hate/Degradation",
  "glutton": "Hate/Degradation", "greedy": "Hate/Degradation", "grim": "Hate/Degradation",
  "gutter": "Hate/Degradation", "hag": "Hate/Degradation", "harpy": "Hate/Degradation",
  "hateful": "Hate/Degradation", "hell": "Hate/Degradation", "hopeless": "Hate/Degradation",
  "horrid": "Hate/Degradation", "humiliate": "Hate/Degradation", "hypocrite": "Hate/Degradation",
  "inferior": "Hate/Degradation", "inhuman": "Hate/Degradation", "insane": "Hate/Degradation",
  "insidious": "Hate/Degradation", "insolent": "Hate/Degradation", "insult": "Hate/Degradation"
};

export interface DetectionResult {
  isBullying: boolean;
  score: number;
  confidence: number;
  label: 'Bullying' | 'Non-Bullying';
  matchedWords: string[];
  primaryType?: string;
}

export function detectBullying(text: string): DetectionResult {
  // 1. Basic preprocessing
  const originalText = text;
  const lowerText = text.toLowerCase();
  
  // 2. Intensity Detection (Caps and Punctuation)
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const totalChars = text.length;
  const capsRatio = totalChars > 0 ? capsCount / totalChars : 0;
  const excessiveCaps = capsRatio > 0.4 && totalChars > 5;
  
  const exclamationCount = (text.match(/!/g) || []).length;
  const excessivePunctuation = exclamationCount > 2;

  // 3. Tokenize for word-based analysis
  const cleanText = lowerText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) {
    return {
      isBullying: false,
      score: 0,
      confidence: 100,
      label: 'Non-Bullying',
      matchedWords: []
    };
  }

  // 4. Pattern-based Contextual Analysis
  let contextualBonus = 0;
  const patterns = [
    { regex: /\byou\s+are\s+\w+/i, weight: 0.2, type: "Personal Attack" },
    { regex: /\bu\s+r\s+\w+/i, weight: 0.2, type: "Personal Attack" },
    { regex: /\bgo\s+(kill|die|jump)\b/i, weight: 0.5, type: "Threat/Violence" },
    { regex: /\bi\s+hope\s+you\b/i, weight: 0.15, type: "Hate/Degradation" },
    { regex: /\bno\s+one\s+likes\s+you\b/i, weight: 0.3, type: "Hate/Degradation" },
    { regex: /\beveryone\s+hates\s+you\b/i, weight: 0.3, type: "Hate/Degradation" },
    { regex: /\bwhy\s+do\s+you\s+even\b/i, weight: 0.1, type: "Harassment" },
    { regex: /\b\w+\s+is\s+(waste|garbage|trash|useless|worthless|pathetic|idiot|stupid)\b/i, weight: 0.25, type: "Personal Attack" },
    { regex: /\b(stop|don't)\s+post\b/i, weight: 0.15, type: "Harassment" }
  ];

  const matchedPatterns: string[] = [];
  patterns.forEach(p => {
    if (p.regex.test(originalText)) {
      contextualBonus += p.weight;
      matchedPatterns.push(p.type);
    }
  });

  // 5. Word-based analysis with repetition check
  let totalWeight = 0;
  const matchedWords: string[] = [];
  const typeCounts: Record<string, number> = {};

  words.forEach(word => {
    // Check for character repetition (e.g., "loooooser")
    const normalizedWord = word.replace(/(.)\1{2,}/g, "$1");
    
    const targetWord = BULLYING_WORDS[word] ? word : (BULLYING_WORDS[normalizedWord] ? normalizedWord : null);

    if (targetWord) {
      let weight = BULLYING_WORDS[targetWord];
      
      // Bonus for repetition
      if (word !== normalizedWord) weight *= 1.5;
      
      totalWeight += weight;
      matchedWords.push(word);
      
      const category = CATEGORIES[targetWord] || "General Harassment";
      typeCounts[category] = (typeCounts[category] || 0) + 1;
    }
  });

  // 6. Final Score Calculation
  // Base score from words
  let score = totalWeight / words.length;
  
  // Add contextual bonuses
  score += contextualBonus;
  
  // Add intensity bonuses
  if (excessiveCaps) score += 0.1;
  if (excessivePunctuation) score += 0.05;

  // 7. Classification
  const isBullying = score > 0.15;
  
  // 8. Confidence Calculation
  let confidence = 0;
  if (isBullying) {
    confidence = 50 + (Math.min(score, 1) - 0.15) * (50 / 0.85);
  } else {
    confidence = 100 - (score / 0.15) * 50;
  }

  // 9. Determine primary type
  let primaryType = undefined;
  if (isBullying) {
    if (matchedPatterns.length > 0) {
      primaryType = matchedPatterns[0];
    } else if (Object.keys(typeCounts).length > 0) {
      primaryType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
  }

  return {
    isBullying,
    score: Math.min(score, 1),
    confidence: Math.round(Math.min(Math.max(confidence, 0), 100)),
    label: isBullying ? 'Bullying' : 'Non-Bullying',
    matchedWords,
    primaryType
  };
}
