// Anime room backdrop: one camera frame of the empty room, stylized once by AnimeGANv2 (docker/anime), shown behind
// the streamer in OBS (Background Removal filter on the camera, the image below it). The room barely changes, so
// one picture beats a live per-frame filter: steady, no flicker, no GPU.
export const IMAGE = 'twitch-handler-anime';

export const roomPlan = (argv: string[], { data, camera }: { data: string; camera: string }) => {
  const [name = '', from] = argv;
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('usage: npm run room -- <name> [photo]   (name: lowercase letters, digits, dashes)');
  const photo = from ?? `${data}/room-${name}-photo.png`;
  return {
    photo,
    out: `${data}/room-${name}.png`,
    // -ss 2 drops the first frames: the camera's exposure is still settling when ffmpeg opens it.
    capture: from ? null : ['-y', '-f', 'avfoundation', '-framerate', '30', '-video_size', '1920x1080', '-i', camera, '-ss', '2', '-frames:v', '1', photo],
    // Photo in on stdin, picture out on stdout: works whatever folders Docker/Colima shares.
    stylize: ['run', '--rm', '-i', IMAGE],
  };
};
