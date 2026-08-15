import { javascriptFoundationLessons } from './lessons/phase1-foundations.js';
import { javascriptProgrammingLessons } from './lessons/phase2-programming.js';
import { javascriptBrowserLessons } from './lessons/phase3-browser.js';
import { javascriptIntermediateLessons } from './lessons/phase4-intermediate.js';
import { javascriptAdvancedLessons } from './lessons/phase5-advanced.js';

export const javascriptLessons = [
  ...javascriptFoundationLessons,
  ...javascriptProgrammingLessons,
  ...javascriptBrowserLessons,
  ...javascriptIntermediateLessons,
  ...javascriptAdvancedLessons
];
