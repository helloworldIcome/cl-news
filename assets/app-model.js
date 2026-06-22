export function getPlayableVoices(briefing) {
  return (briefing.voices || []).filter((voice) => voice.available && voice.audioUrl);
}

export function getDefaultVoice(briefing) {
  const playableVoices = getPlayableVoices(briefing);
  return playableVoices.find((voice) => voice.id === briefing.defaultVoiceId) || playableVoices[0] || null;
}

export function selectVoice(briefing, voiceId) {
  const playableVoices = getPlayableVoices(briefing);
  return playableVoices.find((voice) => voice.id === voiceId) || getDefaultVoice(briefing);
}

export function resolveAudioUrl(audioUrl, pageUrl = globalThis.location?.href || '') {
  return new URL(audioUrl, pageUrl).toString();
}
