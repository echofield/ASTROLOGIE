// Voice seam — provider-agnostic and dormant. The arrival ceremony calls speak()
// for each section; today it's a no-op so the ceremony ships silent-cinematic.
// Wire later behind one config: ElevenLabs streaming (product/French) or a
// self-hosted MisoTTS endpoint (English shorts). Same interface, no caller change.

export function ttsEnabled(): boolean {
  return false;
}

export async function speak(_text: string, _opts?: { lang?: string }): Promise<boolean> {
  // later: fetch /api/tts (ElevenLabs WebSocket stream) or a Miso GPU endpoint.
  return false;
}

export function cancelSpeech(): void {
  /* later: stop the active stream */
}
