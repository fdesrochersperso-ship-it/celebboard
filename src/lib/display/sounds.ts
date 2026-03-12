export const RINGTONE_OPTIONS = [
  { label: 'Victory Fanfare', url: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3' },
  { label: 'Achievement Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
  { label: 'Cash Register', url: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3' },
  { label: 'Success Chime', url: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3' },
  { label: 'Restaurant Bell', url: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3' },
  { label: 'Arcade Win', url: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3' },
  { label: 'Level Up', url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' },
  { label: 'Bonus Points', url: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3' },
  { label: 'Celebration', url: 'https://assets.mixkit.co/active_storage/sfx/1978/1978-preview.mp3' },
  { label: 'Happy Notification', url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' },
  { label: 'Video Game Win', url: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' },
  { label: 'Retro Game Collect', url: 'https://assets.mixkit.co/active_storage/sfx/2071/2071-preview.mp3' },
  { label: 'Game Power Up', url: 'https://assets.mixkit.co/active_storage/sfx/2045/2045-preview.mp3' },
  { label: 'Trumpet Fanfare', url: 'https://assets.mixkit.co/active_storage/sfx/2021/2021-preview.mp3' },
  { label: 'Orchestra Tusch', url: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3' },
  { label: 'Short Trumpet Fanfare', url: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3' },
  { label: 'Winning Chimes', url: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3' },
  { label: 'Epic Orchestra Hit', url: 'https://assets.mixkit.co/active_storage/sfx/2025/2025-preview.mp3' },
  { label: 'Dramatic Win', url: 'https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3' },
  { label: 'Applause', url: 'https://assets.mixkit.co/active_storage/sfx/566/566-preview.mp3' },
  { label: 'Crowd Cheering', url: 'https://assets.mixkit.co/active_storage/sfx/1957/1957-preview.mp3' },
] as const;

const SOUND_MAP: Record<string, string> = {
  victory: RINGTONE_OPTIONS[0].url,
  bell: RINGTONE_OPTIONS[1].url,
  cash_register: RINGTONE_OPTIONS[2].url,
  success: RINGTONE_OPTIONS[3].url,
  restaurant: RINGTONE_OPTIONS[4].url,
  arcade: RINGTONE_OPTIONS[5].url,
  level_up: RINGTONE_OPTIONS[6].url,
  drumroll: RINGTONE_OPTIONS[6].url,
  bonus: RINGTONE_OPTIONS[7].url,
  celebration: RINGTONE_OPTIONS[8].url,
  notification: RINGTONE_OPTIONS[9].url,
  applause: RINGTONE_OPTIONS[20].url,
  none: '',
};

let audioContextUnlocked = false;

function unlockAudio(): void {
  if (audioContextUnlocked) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // ignore
  }
  audioContextUnlocked = true;
}

export function playCelebrationSound(soundName: string, volume = 0.6): void {
  if (!soundName || soundName === 'none') return;
  const url = SOUND_MAP[soundName] ?? SOUND_MAP.victory;
  if (!url) return;
  try {
    unlockAudio();
    const audio = new Audio(url);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.play().catch((err) => console.warn('Audio play failed:', err));
  } catch (err) {
    console.warn('Sound playback error:', err);
  }
}
