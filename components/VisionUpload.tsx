import React, { useState } from 'react';
import { Upload, Search, Loader2, FileImage } from 'lucide-react';

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
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalysis(data.content);
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to analyze image.");
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
            <img src={image} alt="Preview" className="max-h-48 rounded-lg" />
          ) : (
            <div className="text-center space-y-2">
              <Upload className="w-10 h-10 text-zinc-500 mx-auto" />
              <p className="text-sm text-zinc-400">Click or drag to upload image</p>
            </div>
          )}
        </div>

        <button
          onClick={analyzeImage}
          disabled={!image || isLoading}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Image"}
        </button>

        {analysis && (
          <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-sm text-zinc-100 leading-relaxed">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileImage className="w-4 h-4 text-purple-400" />
              Analysis Result
            </h3>
            {analysis}
          </div>
        )}
      </div>
    </div>
  );
};
