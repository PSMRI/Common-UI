/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

// Browser voice for the Read aloud declaration (feature 003, research R3). No Angular imports.
import { speechLang } from './ui/notice-step.base';

/** The browser can read text aloud (Web Speech API). */
export function canSpeak(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    typeof SpeechSynthesisUtterance === 'function'
  );
}

/**
 * Speaks the text in the language, with a matching voice when the browser has one. `onDone` gets
 * true when it was heard to the end, false on error. Returns the utterance so callers can ignore
 * late callbacks after stopping.
 */
export function speak(
  text: string,
  languageCode: string,
  onDone: (completed: boolean) => void
): SpeechSynthesisUtterance {
  const synth = window.speechSynthesis;
  synth.cancel();
  const lang = speechLang(languageCode);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const voices = synth.getVoices();
  const voice =
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.indexOf(languageCode) === 0);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.onend = () => onDone(true);
  utterance.onerror = () => onDone(false);
  synth.speak(utterance);
  return utterance;
}

export function stopSpeaking(): void {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
}
