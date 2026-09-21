"use client";

import { useState, useEffect } from "react";
import { t, type Lang } from "@/lib/i18n";

interface GifPickerProps {
  lang: Lang;
  onGifSelected: (url: string) => void;
  onClose: () => void;
}

const FALLBACK_GIFS = [
  { id: "fallback-1", title: "Eco care", images: { fixed_height: { url: "https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif" } } },
  { id: "fallback-2", title: "Planet", images: { fixed_height: { url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" } } },
  { id: "fallback-3", title: "Reuse", images: { fixed_height: { url: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif" } } },
  { id: "fallback-4", title: "Cleanup", images: { fixed_height: { url: "https://media.giphy.com/media/3oEduLZ2Lmd9b9e6gQ/giphy.gif" } } },
  { id: "fallback-5", title: "Nature", images: { fixed_height: { url: "https://media.giphy.com/media/26AHG5KGFxSkUWw1i/giphy.gif" } } },
  { id: "fallback-6", title: "Sustainability", images: { fixed_height: { url: "https://media.giphy.com/media/3oFzmf7vV8mPhnP5AI/giphy.gif" } } },
];

export function GifPicker({ lang, onGifSelected, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const searchGifs = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(false);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
      const endpoint = apiKey
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchQuery)}&limit=10&offset=0&rating=g&lang=en`
        : null;

      if (!endpoint) {
        setGifs(FALLBACK_GIFS);
        return;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch GIFs");
      }

      const data = await response.json();
      setGifs(data.data?.length ? data.data : FALLBACK_GIFS);
    } catch (err) {
      console.error("GIF search error:", err);
      setGifs(FALLBACK_GIFS);
      setError(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      const timeout = setTimeout(() => searchGifs(query), 500);
      return () => clearTimeout(timeout);
    }
  }, [query]);

  const handleGifClick = (gif: any) => {
    const gifUrl = gif.images?.fixed_height?.url || gif.images?.original?.url;
    if (gifUrl) {
      onGifSelected(gifUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">{t(lang, "chat_search_gif")}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar GIFs..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 mb-4"
        />

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {t(lang, "chat_gif_error")}
            </div>
          )}

          {!loading && !error && gifs.length === 0 && query && (
            <div className="text-center py-8 text-slate-400">
              Nenhum GIF encontrado para &quot;{query}&quot;
            </div>
          )}

          {!loading && !error && gifs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifClick(gif)}
                  className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gif.images?.fixed_height?.url || gif.images?.original?.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {!loading && !error && gifs.length === 0 && !query && (
            <div className="text-center py-8 text-slate-400">
              Digite algo para buscar GIFs
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
