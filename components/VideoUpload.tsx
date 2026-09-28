import React, { useState } from 'react';
import { Video, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';

export const VideoUpload: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;
    analyzeVideo();
  };

  const analyzeVideo = async () => {
    if (!videoUrl || isLoading) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const result = await aiService.analyzeYouTube(videoUrl);
        setAnalysis(result.summary || "Video başarıyla analiz edildi.");
      } else {
        const result = await aiService.analyzeLink(videoUrl);
        setAnalysis(result.summary || "Video/bağlantı başarıyla analiz edildi.");
      }
    } catch (error: any) {
      console.error(error);
      setAnalysis("Video analizi gerçekleştirilemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-orange-500" />
        <h2 className="font-semibold text-zinc-100">Video Analysis</h2>
      </div>

      <form onSubmit={handleUrlSubmit} className="space-y-4">
        <div>
          <input
            type="url"
            placeholder="Enter YouTube or Video URL..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!videoUrl || isLoading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Video...
            </>
          ) : (
            'Analyze Video'
          )}
        </button>
      </form>

      {analysis && (
        <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl space-y-2">
          <h3 className="font-medium text-zinc-200 text-sm">Analysis Result:</h3>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
};
