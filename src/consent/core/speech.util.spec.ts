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

import { canSpeak, speak, stopSpeaking } from './speech.util';

/** Chrome accepts only its own voice objects on a real utterance, so voice tests use this stand-in. */
class FakeUtterance {
  lang = '';
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

describe('speech.util (feature 003)', () => {
  let spoken: SpeechSynthesisUtterance[];
  let realUtterance: unknown;

  afterEach(() => {
    if (realUtterance) {
      (window as any).SpeechSynthesisUtterance = realUtterance;
      realUtterance = null;
    }
  });

  function fakeUtterances(): void {
    realUtterance = (window as any).SpeechSynthesisUtterance;
    (window as any).SpeechSynthesisUtterance = FakeUtterance;
  }

  beforeEach(() => {
    spoken = [];
    spyOn(window.speechSynthesis, 'speak').and.callFake(
      (u: SpeechSynthesisUtterance) => spoken.push(u)
    );
    spyOn(window.speechSynthesis, 'cancel');
  });

  it('knows the browser can speak', () => {
    expect(canSpeak()).toBeTrue();
  });

  it('speaks in the language with a matching voice and reports the end', () => {
    fakeUtterances();
    const hindi = { lang: 'hi-IN', name: 'Hindi' } as SpeechSynthesisVoice;
    spyOn(window.speechSynthesis, 'getVoices').and.returnValue([hindi]);
    const done = jasmine.createSpy('done');
    const u = speak('Namaste', 'hi', done);
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(spoken).toEqual([u]);
    expect(u.text).toBe('Namaste');
    expect(u.lang).toBe('hi-IN');
    expect(u.voice).toBe(hindi);
    (u as unknown as { onend: () => void }).onend();
    expect(done).toHaveBeenCalledWith(true);
    (u as unknown as { onerror: () => void }).onerror();
    expect(done).toHaveBeenCalledWith(false);
  });

  it('matches a voice by language prefix, or uses none', () => {
    fakeUtterances();
    const voices = spyOn(window.speechSynthesis, 'getVoices').and.returnValue([
      { lang: 'as', name: 'Assamese' } as SpeechSynthesisVoice,
    ]);
    expect(speak('x', 'as', () => undefined).voice!.name).toBe('Assamese');
    voices.and.returnValue([]);
    expect(speak('x', 'kn-IN', () => undefined).lang).toBe('kn-IN');
  });

  it('stopSpeaking cancels speech', () => {
    stopSpeaking();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
