import type { CreatorProfile } from '../types';

export interface YouTubeChannelStats {
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;
}

export interface YouTubeVideoMetric {
  id: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export class YouTubeApiService {
  private static BASE_URL = 'https://www.googleapis.com/youtube/v3';

  static async getChannelStats(profile: CreatorProfile): Promise<YouTubeChannelStats | null> {
    const { youtubeApiKey, youtubeChannelId } = profile;
    if (!youtubeApiKey || !youtubeChannelId) return null;

    try {
      const url = `${this.BASE_URL}/channels?part=statistics&id=${youtubeChannelId}&key=${youtubeApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const stats = data.items[0].statistics;
        return {
          subscriberCount: parseInt(stats.subscriberCount),
          viewCount: parseInt(stats.viewCount),
          videoCount: parseInt(stats.videoCount),
          hiddenSubscriberCount: stats.hiddenSubscriberCount,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching YouTube channel stats:', error);
      return null;
    }
  }

  static async getRecentVideos(profile: CreatorProfile, maxResults: number = 5): Promise<YouTubeVideoMetric[]> {
    const { youtubeApiKey, youtubeChannelId } = profile;
    if (!youtubeApiKey || !youtubeChannelId) return [];

    try {
      // First, get the uploads playlist ID
      const channelUrl = `${this.BASE_URL}/channels?part=contentDetails&id=${youtubeChannelId}&key=${youtubeApiKey}`;
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json();

      if (!channelData.items || channelData.items.length === 0) return [];

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // Then, get videos from that playlist
      const playlistUrl = `${this.BASE_URL}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${youtubeApiKey}`;
      const playlistResponse = await fetch(playlistUrl);
      const playlistData = await playlistResponse.json();

      if (!playlistData.items || playlistData.items.length === 0) return [];

      const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');

      // Finally, get statistics for those videos
      const videoUrl = `${this.BASE_URL}/videos?part=snippet,statistics&id=${videoIds}&key=${youtubeApiKey}`;
      const videoResponse = await fetch(videoUrl);
      const videoData = await videoResponse.json();

      return videoData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount),
        likeCount: parseInt(item.statistics.likeCount),
        commentCount: parseInt(item.statistics.commentCount),
      }));
    } catch (error) {
      console.error('Error fetching YouTube recent videos:', error);
      return [];
    }
  }

  static async publishVideo(profile: CreatorProfile, title: string, description: string): Promise<{ success: boolean; id?: string; error?: string; publishedAt?: string }> {
    const { youtubeApiKey } = profile;
    if (!youtubeApiKey) {
      return { success: false, error: 'YouTube API Key missing' };
    }

    try {
      // NOTE: In a real production environment, uploading videos requires OAuth2 
      // with the 'https://www.googleapis.com/auth/youtube.upload' scope.
      // This simulation follows the structure of the YouTube Data API v3 'videos.insert' method.
      
      console.log(`Simulating YouTube upload: ${title} - ${description.substring(0, 20)}...`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success response
      return { 
        success: true, 
        id: 'mock_video_id_' + Math.random().toString(36).substr(2, 9),
        publishedAt: new Date().toISOString() 
      };
    } catch (error: any) {
      console.error('Error publishing to YouTube:', error);
      return { success: false, error: error.message };
    }
  }
}
