export const CELEBRATION_GIFS = [
  'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
  'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  'https://media.giphy.com/media/MOWPkhRAUbR7i/giphy.gif',
  'https://media.giphy.com/media/l4FGni1RBAR2OWsGk/giphy.gif',
  'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
  'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif',
  'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
];

export function getRandomCelebrationGif(): string {
  return CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)] ?? CELEBRATION_GIFS[0]!;
}
