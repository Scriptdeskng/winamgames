// Lazy-loaded Lichess audio clips. SSR-safe.

interface AudioLike {
  play: () => Promise<void>;
}

const sounds: Record<string, AudioLike> = {};

const NOOP: AudioLike = { play: () => Promise.resolve() };

function getSound(name: string, url: string): AudioLike {
  if (typeof window === "undefined") return NOOP;
  if (!sounds[name]) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.6;
      sounds[name] = audio;
    } catch {
      sounds[name] = NOOP;
    }
  }
  return sounds[name];
}

export function playMove() {
  getSound("move", "https://lichess1.org/assets/sound/standard/Move.mp3")
    .play()
    .catch(() => {});
}

export function playCapture() {
  getSound("capture", "https://lichess1.org/assets/sound/standard/Capture.mp3")
    .play()
    .catch(() => {});
}

export function playCorrect() {
  getSound("correct", "https://lichess1.org/assets/sound/standard/GenericNotify.mp3")
    .play()
    .catch(() => {});
}

export function playIncorrect() {
  getSound("incorrect", "https://lichess1.org/assets/sound/standard/Error.mp3")
    .play()
    .catch(() => {});
}
