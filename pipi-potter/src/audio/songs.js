// Músicas originales. Cada token es una semicorchea (div=4):
//  nota (C4, F#3...) · "-" mantiene la anterior · "." silencio
//  batería: k bombo · s caja · h charles · o charles abierto
export const SONGS = {
  title: {
    bpm: 140, loop: true,
    lead: [
      'E5 - G5 - C6 - - . B5 - A5 - G5 - E5 -',
      'F5 - A5 - G5 - E5 - D5 - - - . . . .',
      'E5 - G5 - C6 - - . D6 - C6 - B5 - G5 -',
      'A5 - B5 - C6 - - - . . . . . . . .',
    ],
    bass: [
      'C3 . G3 . C3 . G3 . C3 . G3 . C3 . G3 .',
      'F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 .',
      'C3 . G3 . C3 . G3 . E3 . B3 . E3 . B3 .',
      'A2 . E3 . A2 . E3 . G2 . D3 . C3 . . .',
    ],
    drums: ['k . h . s . h . k . h k s . h .'],
  },
  disco: {
    bpm: 122, loop: true,
    lead: [
      '. . A4 . C5 . E5 - D5 . C5 . A4 - - .',
      '. . G4 . A4 . C5 - E5 . D5 . C5 . B4 .',
      '. . A4 . C5 . E5 - A5 . G5 . E5 - - .',
      'E5 - - . D5 - - . C5 - B4 - A4 - - -',
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
    ],
    arp: [
      'A4 C5 E5 A5 A4 C5 E5 A5 F4 A4 C5 F5 G4 B4 D5 G5',
      'C5 E5 G5 C6 C5 E5 G5 C6 E4 G#4 B4 E5 E4 G#4 B4 E5',
    ],
    bass: [
      'A2 A3 . A2 A3 . A2 A3 F2 F3 . F2 G2 G3 . G2',
      'C3 C4 . C3 C4 . C3 C4 E2 E3 . E2 E3 . G#2 .',
    ],
    drums: ['k . h . ks . h . k . h . ks . h o'],
  },
  festival: {
    bpm: 150, loop: true,
    lead: [
      'E5 - . E5 G5 - E5 . A5 - G5 . E5 - D5 -',
      'E5 - . . . . . . C5 D5 E5 - D5 - B4 -',
      'E5 - . E5 G5 - E5 . B5 - A5 . G5 - A5 -',
      'B5 - - - A5 - G5 - E5 - - - . . . .',
    ],
    bass: [
      'E2 E2 E3 E2 E2 E2 D3 E2 E2 E2 E3 E2 G2 . A2 .',
      'C3 C3 C4 C3 C3 C3 B2 C3 D3 D3 D4 D3 B2 . A2 .',
    ],
    drums: ['k . h . s . h k k . h . s . h h'],
  },
  boda: {
    bpm: 100, loop: true,
    lead: [
      'C5 - - - F5 - - - A5 - - -',
      'G5 - - - F5 - E5 - F5 - - -',
      'A5 - - - C6 - - - A5 - - -',
      'G5 - - - - - - - . . . .',
      'A#5 - - - A5 - - - G5 - - -',
      'F5 - - - E5 - D5 - C5 - - -',
      'D5 - - - E5 - F5 - G5 - - -',
      'F5 - - - - - - - . . . .',
    ],
    bass: [
      'F2 . . . . . C3 . . . . .',
      'C2 . . . . . G2 . . . . .',
      'F2 . . . . . C3 . . . . .',
      'C2 . . . . . G2 . . . . .',
      'A#2 . . . . . F3 . . . . .',
      'F2 . . . . . C3 . . . . .',
      'C2 . . . . . G2 . . . . .',
      'F2 . . . . . C3 . . . . .',
    ],
    arp: [
      '. . . . F4 A4 . . F4 A4 . .',
      '. . . . E4 G4 . . E4 G4 . .',
      '. . . . F4 A4 . . F4 A4 . .',
      '. . . . E4 G4 . . E4 G4 . .',
      '. . . . D4 F4 . . D4 F4 . .',
      '. . . . F4 A4 . . F4 A4 . .',
      '. . . . E4 G4 . . E4 G4 . .',
      '. . . . F4 A4 . . F4 A4 . .',
    ],
    drums: ['k . . . h . . . h . . .'],
  },
  pueblo: {
    bpm: 118, loop: true, vib: true,
    lead: [
      'A4 - D5 - F5 - A5 - G5 F5 E5 F5 G5 - - .',
      'A5 - G5 F5 E5 - D5 - C#5 - D5 E5 A4 - - .',
      'D5 - F5 - A5 - D6 - C6 A#5 A5 G5 F5 - - .',
      'E5 - F5 - G5 - E5 - D5 - - - . . . .',
    ],
    bass: [
      'D3 . A2 . D3 . A2 . A2 . E3 . A2 . E3 .',
      'A2 . E3 . A2 . E3 . D3 . A2 . D3 . A2 .',
      'D3 . A2 . D3 . A2 . G2 . D3 . G2 . D3 .',
      'A2 . E3 . A2 . E3 . D3 . A2 . D3 . . .',
    ],
    drums: ['k . s . k . s . k . s . k s s .'],
  },
  barbacoa: {
    bpm: 104, loop: true,
    lead: [
      '. . . . B4 . . C5 . . B4 . . . G4 .',
      '. . . . E4 . F#4 . G4 . A4 . B4 . . .',
      '. . . . B4 . . C5 . . D5 . . . E5 .',
      'D5 . B4 . G4 . E4 . . . . . . . . .',
    ],
    bass: [
      'E2 . . E2 G2 . . . A2 . . A2 B2 . A#2 .',
      'E2 . . E2 G2 . . . D3 . C3 . B2 . . .',
    ],
    drums: ['k . . h . . h . k . . h s . h .'],
  },
  victory: {
    bpm: 150, loop: true,
    lead: [
      'C5 E5 G5 C6 - G5 C6 - E6 - - - D6 C6 B5 C6',
      'D6 - - - G5 - - - B5 - D6 - C6 - - -',
    ],
    bass: [
      'C3 . G3 . C3 . G3 . A2 . E3 . A2 . E3 .',
      'F2 . C3 . G2 . D3 . C3 . G2 . C3 . . .',
    ],
    drums: ['k . h . s . h . k k h . s . h h'],
  },
};
