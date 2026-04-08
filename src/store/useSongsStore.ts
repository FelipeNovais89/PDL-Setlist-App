import { create } from 'zustand'
import type { Song } from '../types'

interface SongsState {
  songs: Song[]
  loading: boolean
  error: string | null
  setSongs: (songs: Song[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  addSong: (s: Song) => void
  updateSong: (index: number, patch: Partial<Song>) => void
  removeSong: (index: number) => void
}

export const useSongsStore = create<SongsState>((set) => ({
  songs: [],
  loading: false,
  error: null,
  setSongs: (songs) => set({ songs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  addSong: (s) => set(state => ({ songs: [...state.songs, s] })),
  updateSong: (index, patch) =>
    set(state => ({
      songs: state.songs.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    })),
  removeSong: (index) =>
    set(state => ({ songs: state.songs.filter((_, i) => i !== index) })),
}))
