import type { CreatorProfile } from '../types';

export interface InstagramAccountStats {
  followersCount: number;
  mediaCount: number;
  website?: string;
}

export interface InstagramMediaStats {
  id: string;
  caption: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  likeCount: number;
  commentsCount: number;
  timestamp: string;
}

export class InstagramApiService {
  private static BASE_URL = 'https://graph.facebook.com/v19.0';

  static async getAccountStats(profile: CreatorProfile): Promise<InstagramAccountStats | null> {
    if (!profile.instagramAccessToken || !profile.instagramBusinessAccountId) return null;

    try {
      const url = `${this.BASE_URL}/${profile.instagramBusinessAccountId}?fields=followers_count,media_count,website&access_token=${profile.instagramAccessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      return {
        followersCount: data.followers_count,
        mediaCount: data.media_count,
        website: data.website,
      };
    } catch (error) {
      console.error('Error fetching Instagram account stats:', error);
      return null;
    }
  }

  static async getRecentMedia(profile: CreatorProfile, limit: number = 5): Promise<InstagramMediaStats[]> {
    if (!profile.instagramAccessToken || !profile.instagramBusinessAccountId) return [];

    try {
      const url = `${this.BASE_URL}/${profile.instagramBusinessAccountId}/media?fields=id,caption,media_type,like_count,comments_count,timestamp&limit=${limit}&access_token=${profile.instagramAccessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      return data.data.map((item: any) => ({
        id: item.id,
        caption: item.caption,
        mediaType: item.media_type,
        likeCount: item.like_count,
        commentsCount: item.comments_count,
        timestamp: item.timestamp,
      }));
    } catch (error) {
      console.error('Error fetching Instagram media metrics:', error);
      return [];
    }
  }

  static async publishMedia(profile: CreatorProfile, imageUrl: string, caption: string): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!profile.instagramAccessToken || !profile.instagramBusinessAccountId) {
      return { success: false, error: 'Instagram credentials missing' };
    }

    try {
      // Step 1: Create media container
      const containerUrl = `${this.BASE_URL}/${profile.instagramBusinessAccountId}/media`;
      const containerRes = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: profile.instagramAccessToken,
        }),
      });
      const containerData = await containerRes.json();

      if (containerData.error) throw new Error(containerData.error.message);

      const creationId = containerData.id;

      // Step 2: Publish media container
      const publishUrl = `${this.BASE_URL}/${profile.instagramBusinessAccountId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: profile.instagramAccessToken,
        }),
      });
      const publishData = await publishRes.json();

      if (publishData.error) throw new Error(publishData.error.message);

      return { success: true, id: publishData.id };
    } catch (error: any) {
      console.error('Error publishing to Instagram:', error);
      return { success: false, error: error.message };
    }
  }
}
