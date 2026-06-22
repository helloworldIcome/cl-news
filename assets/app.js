import { getDefaultVoice, resolveAudioUrl, selectVoice } from './app-model.js';

const state = {
  briefing: null,
  selectedVoice: null,
};

const elements = {
  date: document.querySelector('#briefing-date'),
  title: document.querySelector('#briefing-title'),
  runState: document.querySelector('#run-state'),
  overview: document.querySelector('#briefing-overview'),
  voiceRow: document.querySelector('#voice-row'),
  playToggle: document.querySelector('#play-toggle'),
  progress: document.querySelector('#progress'),
  currentTime: document.querySelector('#current-time'),
  duration: document.querySelector('#duration'),
  audioState: document.querySelector('#audio-state'),
  audio: document.querySelector('#audio'),
  newsList: document.querySelector('#news-list'),
  sourceList: document.querySelector('#source-list'),
};

function formatSeconds(value) {
  if (!Number.isFinite(value) || value < 0) {
    return '--:--';
  }
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setAudioState(message) {
  elements.audioState.textContent = message;
}

function renderVoiceButtons() {
  elements.voiceRow.replaceChildren();

  for (const voice of state.briefing.voices) {
    const button = document.createElement('button');
    button.className = 'voice-button';
    button.type = 'button';
    button.textContent = voice.name;
    button.disabled = !voice.available || !voice.audioUrl;
    button.setAttribute('aria-pressed', String(state.selectedVoice?.id === voice.id));
    button.addEventListener('click', () => {
      setSelectedVoice(voice.id);
    });
    elements.voiceRow.append(button);
  }
}

function setSelectedVoice(voiceId) {
  const voice = selectVoice(state.briefing, voiceId);
  state.selectedVoice = voice;
  renderVoiceButtons();

  if (!voice) {
    elements.audio.removeAttribute('src');
    elements.playToggle.disabled = true;
    setAudioState('今日音频还没有生成。');
    return;
  }

  elements.playToggle.disabled = false;
  elements.audio.src = resolveAudioUrl(voice.audioUrl, window.location.href);
  elements.audio.load();
  elements.playToggle.textContent = '播放';
  setAudioState(`当前音色：${voice.name}`);
}

function renderNewsItems(items) {
  elements.newsList.replaceChildren();
  for (const item of items) {
    const entry = document.createElement('li');
    const title = document.createElement('span');
    const tag = document.createElement('span');
    const summary = document.createElement('p');

    title.className = 'news-title';
    tag.className = 'news-tag';
    summary.className = 'news-summary';
    title.textContent = item.title;
    tag.textContent = item.category;
    summary.textContent = item.summary;

    title.append(tag);
    entry.append(title, summary);
    elements.newsList.append(entry);
  }
}

function renderSources(sources) {
  elements.sourceList.replaceChildren();
  for (const source of sources) {
    const entry = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = source.name;
    entry.append(link);
    elements.sourceList.append(entry);
  }
}

async function togglePlayback() {
  if (!elements.audio.src) {
    setAudioState('今日音频还没有生成。');
    return;
  }

  if (elements.audio.paused) {
    try {
      await elements.audio.play();
      elements.playToggle.textContent = '暂停';
      setAudioState(`正在播放：${state.selectedVoice.name}`);
    } catch {
      setAudioState('音频文件暂不可播放，请确认当天 MP3 已发布。');
    }
  } else {
    elements.audio.pause();
    elements.playToggle.textContent = '播放';
    setAudioState(`已暂停：${state.selectedVoice.name}`);
  }
}

function bindPlayerEvents() {
  elements.playToggle.addEventListener('click', togglePlayback);
  elements.audio.addEventListener('timeupdate', () => {
    const duration = elements.audio.duration || 0;
    elements.progress.value = duration ? (elements.audio.currentTime / duration) * 100 : 0;
    elements.currentTime.textContent = formatSeconds(elements.audio.currentTime);
  });
  elements.audio.addEventListener('loadedmetadata', () => {
    elements.duration.textContent = formatSeconds(elements.audio.duration);
  });
  elements.audio.addEventListener('ended', () => {
    elements.playToggle.textContent = '播放';
    setAudioState('今日晨报已播放完。');
  });
  elements.audio.addEventListener('error', () => {
    elements.playToggle.textContent = '播放';
    setAudioState('音频文件暂不可播放，请确认当天 MP3 已发布。');
  });
}

function renderBriefing(briefing) {
  state.briefing = briefing;
  state.selectedVoice = getDefaultVoice(briefing);

  elements.date.textContent = `${briefing.date} · ${briefing.updatedAt}`;
  elements.title.textContent = briefing.title;
  elements.runState.textContent = briefing.state === 'published' ? '已发布' : briefing.state;
  elements.overview.textContent = briefing.overview;
  renderNewsItems(briefing.items);
  renderSources(briefing.sources);
  setSelectedVoice(state.selectedVoice?.id);
}

async function loadBriefing() {
  try {
    const response = await fetch('data/latest.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    renderBriefing(await response.json());
  } catch {
    elements.runState.textContent = '加载失败';
    elements.playToggle.disabled = true;
    setAudioState('没有读取到今日晨报数据。');
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

bindPlayerEvents();
loadBriefing();
