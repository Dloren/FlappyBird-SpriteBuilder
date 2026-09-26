// Músicas originales. Cada token es una semicorchea (div=4):
//  nota (C4, F#3...) · "-" mantiene la anterior · "." silencio
//  batería: k bombo · s caja/palmada · h charles · o charles abierto
// Instrumentos por canal: lead/arp 'p25' | 'p12' | 'square' | 'sawtooth' | 'triangle'
//                         bass 'triangle' | 'square' | 'sawtooth' | 'p25'
export const SONGS = {
  // Título: misterioso, en menor
  title: {
    bpm: 108, loop: true, lead: 'p25', bass: 'triangle',
    leadTrack: [
      'A4 - - - C5 - E5 - D5 - - - C5 - B4 -',
      'A4 - - - E4 - - - G4 - A4 - - - . .',
      'F4 - - - A4 - C5 - B4 - - - G#4 - E4 -',
      'A4 - - - - - - - . . . . . . . .',
    ],
    bassTrack: [
      'A2 . A2 . A2 . A2 . A2 . A2 . G2 . G2 .',
      'F2 . F2 . F2 . F2 . E2 . E2 . E2 . E2 .',
    ],
    drums: ['k . . . s . . . k . k . s . . h'],
  },

  // Discoteca: techno oscuro 128 BPM, bajo ácido en semicorcheas
  disco: {
    bpm: 128, loop: true, lead: 'p12', bass: 'sawtooth', arp: 'p25', bassVol: 0.22,
    leadTrack: [
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . C5 . . . . .',
      '. . . . . . . . . . C5 . . D#5 . .',
      'F5 - . . . . . . D#5 - . . C5 - . .',
      '. . . . . . . . G#4 - - - G4 - - -',
      'F5 - . . . . . . D#5 - . . C5 - . .',
      '. . . . C5 . C#5 . C5 - - - . . . .',
    ],
    bassTrack: [
      'F2 F2 F3 F2 . F2 G#2 F2 F2 . F3 F2 C3 . D#3 F2',
      'F2 F2 F3 F2 . F2 G#2 F2 D#2 . D#3 D#2 C3 . C#3 C3',
    ],
    arpTrack: [
      '. . F4 . . . G#4 . . . C5 . . . G#4 .',
      '. . F4 . . . G#4 . . . C#5 . . . C5 .',
    ],
    drums: [
      'k . o . k . o . k . o . k . o .',
      'k . o . ks . o . k . o . ks . o h',
      'k . o . ks . o . k . o . ks . o h',
      'k . o . ks . o . k . o . ks s s s',
    ],
  },

  // Festival: electro-rock en mi menor, con empuje
  festival: {
    bpm: 136, loop: true, lead: 'square', bass: 'p25', arp: 'p12',
    leadTrack: [
      'E4 - G4 - B4 - A4 G4 E4 - - - D4 - E4 -',
      'E4 - G4 - B4 - D5 - C5 - B4 - A4 - - -',
      'E4 - G4 - B4 - A4 G4 E4 - - - D4 - B3 -',
      'C4 - D4 - E4 - - - . . . . . . . .',
    ],
    bassTrack: [
      'E2 . E2 E3 E2 . E2 E3 C2 . C2 C3 D2 . D2 D3',
      'E2 . E2 E3 E2 . E2 E3 A1 . A1 A2 B1 . B1 B2',
    ],
    arpTrack: ['E5 B4 G4 B4 E5 B4 G4 B4 C5 G4 E4 G4 D5 A4 F#4 A4'],
    drums: ['k . h . s . h k k . h . s . h h', 'k . h . s . h k k . h k s s s s'],
  },

  // Boda: vals en menor, melancólico (se nota que alguien va a acabar mal)
  boda: {
    bpm: 92, div: 4, loop: true, lead: 'p25', bass: 'triangle', arp: 'p12',
    leadTrack: [
      'A4 - - - C5 - B4 - A4 - - -',
      'E5 - - - D5 - C5 - B4 - - -',
      'C5 - - - B4 - A4 - G#4 - - -',
      'A4 - - - - - - - . . . .',
      'F5 - - - E5 - D5 - C5 - - -',
      'D5 - - - C5 - B4 - A4 - - -',
      'B4 - - - C5 - D5 - E5 - - -',
      'A4 - - - - - - - . . . .',
    ],
    bassTrack: [
      'A2 . . . . . E3 . . . . .',
      'E2 . . . . . B2 . . . . .',
      'F2 . . . . . C3 . . . . .',
      'A2 . . . . . E3 . . . . .',
      'D2 . . . . . A2 . . . . .',
      'F2 . . . . . C3 . . . . .',
      'E2 . . . . . B2 . . . . .',
      'A2 . . . . . E3 . . . . .',
    ],
    arpTrack: [
      '. . . . A3 C4 . . A3 C4 . .',
      '. . . . G#3 B3 . . G#3 B3 . .',
      '. . . . A3 C4 . . A3 C4 . .',
      '. . . . A3 C4 . . A3 C4 . .',
      '. . . . F3 A3 . . F3 A3 . .',
      '. . . . A3 C4 . . A3 C4 . .',
      '. . . . G#3 B3 . . G#3 B3 . .',
      '. . . . A3 C4 . . A3 C4 . .',
    ],
    drums: ['k . . . h . . . h . . .'],
  },

  // Fiestas del pueblo: pasodoble de verbena, en menor y algo borracho
  pueblo: {
    bpm: 112, loop: true, vib: true, lead: 'p25', bass: 'triangle',
    leadTrack: [
      'A4 - D5 - F5 - A5 - G5 F5 E5 F5 G5 - - .',
      'A5 - G5 F5 E5 - D5 - C#5 - D5 E5 A4 - - .',
      'D5 - F5 - A5 - D6 - C6 A#5 A5 G5 F5 - - .',
      'E5 - F5 - G5 - E5 - D5 - - - . . . .',
    ],
    bassTrack: [
      'D3 . A2 . D3 . A2 . A2 . E3 . A2 . E3 .',
      'A2 . E3 . A2 . E3 . D3 . A2 . D3 . A2 .',
      'D3 . A2 . D3 . A2 . G2 . D3 . G2 . D3 .',
      'A2 . E3 . A2 . E3 . D3 . A2 . D3 . . .',
    ],
    drums: ['k . s . k . s . k . s . k s s .'],
  },

  // Barbacoa: tensión de sigilo, lenta y en menor
  barbacoa: {
    bpm: 96, loop: true, lead: 'p12', bass: 'triangle', arp: 'p25',
    leadTrack: [
      '. . . . B4 . . C5 . . B4 . . . G4 .',
      '. . . . E4 . F#4 . G4 . A4 . B4 . . .',
      '. . . . B4 . . C5 . . D5 . . . E5 .',
      'D#5 . B4 . F#4 . D#4 . . . . . . . . .',
    ],
    bassTrack: [
      'E2 . . E2 G2 . . . A2 . . A2 B2 . A#2 .',
      'E2 . . E2 G2 . . . C3 . B2 . D#2 . . .',
    ],
    arpTrack: ['. . . . . . . . . . . . E5 . . .', '. . . . . . . . . . . . D#5 . . .'],
    drums: ['k . . h . . h . k . . h s . h .'],
  },

  // Nivel superado / victoria: alivio contenido
  victory: {
    bpm: 132, loop: true, lead: 'p25', bass: 'triangle',
    leadTrack: [
      'A4 C5 E5 A5 - E5 A5 - G5 - - - F5 E5 D5 E5',
      'F5 - - - C5 - - - E5 - D5 - C5 - - -',
      'A4 C5 E5 A5 - E5 A5 - G5 - - - F5 E5 D5 E5',
      'F5 - E5 - D5 - B4 - A4 - - - . . . .',
    ],
    bassTrack: [
      'A2 . E3 . A2 . E3 . G2 . D3 . G2 . D3 .',
      'F2 . C3 . F2 . C3 . E2 . B2 . E2 . B2 .',
    ],
    drums: ['k . h . s . h . k k h . s . h h'],
  },
};
