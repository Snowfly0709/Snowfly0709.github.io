/// <reference types="astro/client" />

// Singleton flags/handlers set by inline component scripts so listeners
// survive ClientRouter navigations without being bound twice.
interface Window {
  __atelierSlash?: boolean;
  __pmBound?: boolean;
  __pmUpdate?: () => void;
}
