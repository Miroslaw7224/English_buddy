import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Modals
  modals: {
    words: boolean;
    settings: boolean;
  };
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Sidebar
  sidebar: {
    open: boolean;
  };
  
  // Loading states
  loading: {
    chat: boolean;
    words: boolean;
  };
  
  // Actions
  toggleModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  setModal: (modal: keyof UIState['modals'], open: boolean) => void;
  
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  setLoading: (key: keyof UIState['loading'], loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      modals: {
        words: false,
        settings: false,
      },
      
      theme: 'system',
      
      sidebar: {
        open: false,
      },
      
      loading: {
        chat: false,
        words: false,
      },
      
      // Actions
      toggleModal: (modal) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: !state.modals[modal],
          },
        })),
      
      closeModal: (modal) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: false,
          },
        })),
      
      openModal: (modal) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: true,
          },
        })),

      setModal: (modal, open) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: open,
          },
        })),
      
      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            open: !state.sidebar.open,
          },
        })),
      
      setSidebarOpen: (open) =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            open,
          },
        })),
      
      setLoading: (key, loading) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: loading,
          },
        })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebar: state.sidebar,
      }),
    }
  )
);
