declare module 'expo-video' {
  import { ViewProps } from 'react-native';

  export interface VideoProps extends ViewProps {
    source: { uri: string } | number;
    shouldPlay?: boolean;
    isLooping?: boolean;
    resizeMode?: ResizeMode;
    onPlaybackStatusUpdate?: (status: VideoStatus) => void;
    onError?: (error: { message?: string }) => void;
  }

  export interface VideoStatus {
    isLoaded: boolean;
    error?: string;
  }

  export enum ResizeMode {
    CONTAIN = 'contain',
    COVER = 'cover',
    STRETCH = 'stretch',
  }

  export class Video extends React.Component<VideoProps> {
    unloadAsync(): Promise<void>;
    loadAsync(
      source: { uri: string } | number,
      initialStatus?: object,
      downloadFirst?: boolean
    ): Promise<void>;
  }
} 