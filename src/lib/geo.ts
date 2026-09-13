export interface Coordinates {
  lat: number;
  lng: number;
}

/** Captura a localização atual usando o plugin @capacitor/geolocation quando
 * o app roda empacotado (Android via Capacitor) e cai para a Geolocation API
 * do navegador quando roda como web app. */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import("@capacitor/geolocation");
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    }
  } catch {
    // Capacitor indisponível (ex.: build web puro) — segue para o fallback.
  }

  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalização não suportada neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
