import React, { useState } from 'react';
import { Video, Loader2, Play, FileText } from 'lucide-react';

export const VideoUpload: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
      // In a real app, we'd extract frames here using a canvas
    }
  };

  const analyzeVideo = async () => {
    if (!videoUrl || isLoading) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      // Simulation: In a real app, we'd extract frames from the <video> element
      // For this demo, we'll send a placeholder frame if we can't extract real ones
      // Or just simulate the API call with a mock frame
      const mockFrame = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames: [mockFrame] })
      });

      if (!response.ok) throw new Error('Video analysis failed');

      const data = await response.json();
      setAnalysis(data.summary);
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to analyze video.");
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

      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-8 hover:border-orange-500/50 transition-colors cursor-pointer relative overflow-hidden">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {videoUrl ? (
            <video src={videoUrl} className="max-h-48 rounded-lg" controls />
          ) : (
            <div className="text-center space-y-2">
              <Play className="w-10 h-10 text-zinc-500 mx-auto" />
              <p className="text-sm text-zinc-400">Upload video to analyze</p>
            </div>
          )}
        </div>

        <button
          onClick={analyzeVideo}
          disabled={!videoUrl || isLoading}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Video"}
        </button>

        {analysis && (
          <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-sm text-zinc-100 leading-relaxed">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              Video Summary
            </h3>
            {analysis}
          </div>
        )}
      </div>
    </div>
  );
};
