import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';

export const VisionUpload: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || isLoading) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      const result = await aiService.analyzeVision("Bu görseli analiz et ve açıkla.", [
        {
          type: 'image',
          name: 'uploaded-image.jpg',
          data: image,
          mimeType: 'image/jpeg'
        }
      ]);

      setAnalysis(result.analysis || "Görsel analizi başarıyla tamamlandı.");
    } catch (error: any) {
      console.error("Vision Analysis Error:", error);
      setAnalysis(error.message || "Görsel analizi yapılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-purple-500" />
        <h2 className="font-semibold text-zinc-100">Vision Analysis</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-8 hover:border-purple-500/50 transition-colors cursor-pointer relative overflow-hidden">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {image ? (
            <img
              src={image}
              alt="Uploaded preview"
              className="max-h-64 object-contain rounded-lg"
            />
          ) : (
            <div className="text-center space-y-2">
              <Search className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-sm text-zinc-400">
                Click or drag and drop an image to analyze
              </p>
            </div>
          )}
        </div>

        <button
          onClick={analyzeImage}
          disabled={!image || isLoading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Image'
          )}
        </button>

        {analysis && (
          <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl space-y-2">
            <h3 className="font-medium text-zinc-200 text-sm">Analysis Result:</h3>
            <p className="text-sm text-zinc-400 whitespace-pre-wrap">{analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
};
