export const STREAM_SERVER_URL = 'http://192.168.100.55:4000';
export const WS_SERVER_URL = 'ws://192.168.100.55:4000/frames';

// Local path to the frames directory
export const FRAMES_DIR = 'C:/Users/HP/Desktop/fyp/realtime/server/videos/ipcam';

export const CAMERAS = [
  { id: 1, name: 'Camera 1', active: true },
  { id: 2, name: 'Camera 2', active: false },
  { id: 3, name: 'Camera 3', active: false },
] as const; 