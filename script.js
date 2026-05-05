const defaultChannels = [
  { name: 'TRT 1', description: 'National public broadcaster', mediaType: 'video', url: '' },
  { name: 'Kanal D', description: 'General entertainment', mediaType: 'video', url: '' },
  { name: 'Show TV', description: 'Entertainment and drama', mediaType: 'video', url: '' },
  { name: 'CNN Türk', description: 'News and current affairs', mediaType: 'video', url: '' },
  { name: 'TRT Radyo 1', description: 'News, culture and music radio', mediaType: 'audio', url: '' },
  { name: 'TRT Radyo Haber', description: 'News radio', mediaType: 'audio', url: '' }
];

const channelSearch = document.getElementById('channel-search');
const channelSelect = document.getElementById('channel-select');
const playButton = document.getElementById('play-button');
const customUrlInput = document.getElementById('custom-url');
const loadCustomButton = document.getElementById('load-custom-button');
const channelFileInput = document.getElementById('channel-file');
const loadFileButton = document.getElementById('load-file-button');
const channelCount = document.getElementById('channel-count');
const showFavoritesOnlyCheckbox = document.getElementById('show-favorites-only');
const favoriteButton = document.getElementById('favorite-button');
const resetDefaultButton = document.getElementById('reset-default-button');
const clearStorageButton = document.getElementById('clear-storage-button');
const addNameInput = document.getElementById('add-name');
const addDescInput = document.getElementById('add-description');
const addTypeSelect = document.getElementById('add-type');
const addUrlInput = document.getElementById('add-url');
const addChannelButton = document.getElementById('add-channel-button');
const player = document.getElementById('tv-player');
const radioPlayer = document.getElementById('radio-player');
const channelInfo = document.getElementById('channel-info');

let channels = defaultChannels.slice();
let filteredChannels = channels.slice();
let showFavoritesOnly = false;
let hlsInstance = null;

let channels = defaultChannels.slice();
let filteredChannels = channels.slice();
let hlsInstance = null;

function saveChannelsToStorage() {
  try {
    localStorage.setItem('savedChannels', JSON.stringify(channels));
  } catch (error) {
    console.warn('Unable to save channels to localStorage.', error);
  }
}

function normalizeChannel(channel) {
  return {
    name: channel.name || 'Unnamed channel',
    description: channel.description || '',
    mediaType: channel.mediaType === 'audio' ? 'audio' : 'video',
    url: channel.url || '',
    isFavorite: !!channel.isFavorite
  };
}

function loadChannelsFromStorage() {
  try {
    const saved = localStorage.getItem('savedChannels');
    const list = saved ? JSON.parse(saved) : null;
    if (Array.isArray(list) && list.length > 0) {
      channels = list.map(normalizeChannel);
      populateChannels(channels);
      return true;
    }
  } catch (error) {
    console.warn('Unable to load saved channels from localStorage.', error);
  }
  return false;
}

async function loadChannels() {
  const loadedFromStorage = loadChannelsFromStorage();
  if (loadedFromStorage) {
    return;
  }

  try {
    const response = await fetch('channels.json');
    if (!response.ok) {
      throw new Error('Channels file not found');
    }
    const list = await response.json();
    channels = Array.isArray(list) ? list.map(normalizeChannel) : defaultChannels.slice();
  } catch (error) {
    console.warn('Unable to load channels.json, using default channel list.', error);
    channels = defaultChannels.slice();
  }

  populateChannels(channels);
}

function resetToDefaultChannels() {
  channels = defaultChannels.slice();
  saveChannelsToStorage();
  populateChannels(channels);
  alert('Channel list reset to default channels.');
}

function clearSavedChannels() {
  localStorage.removeItem('savedChannels');
  alert('Saved channel list cleared. Reloading default channels.');
  resetToDefaultChannels();
}

function populateChannels(list = channels) {
  let displayList = list.slice();
  if (showFavoritesOnly) {
    displayList = displayList.filter(channel => channel.isFavorite);
  }

  filteredChannels = displayList;
  channelSelect.innerHTML = '';
  channelCount.textContent = `Channels: ${filteredChannels.length}`;

  if (filteredChannels.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'No channels matched your search';
    option.disabled = true;
    channelSelect.appendChild(option);
    return;
  }

  const groups = filteredChannels.reduce((acc, channel) => {
    const groupName = channel.mediaType === 'audio' ? 'Radio' : 'TV';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(channel);
    return acc;
  }, {});

  let optionIndex = 0;
  Object.entries(groups).forEach(([groupName, groupChannels]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupName;

    groupChannels.forEach(channel => {
      const option = document.createElement('option');
      option.value = optionIndex;
      option.textContent = `${channel.isFavorite ? '★ ' : ''}${channel.name} — ${channel.description}`;
      optgroup.appendChild(option);
      optionIndex += 1;
    });

    channelSelect.appendChild(optgroup);
  });
}

function filterChannels() {
  const query = channelSearch.value.trim().toLowerCase();
  let results = channels;

  if (query) {
    results = results.filter(channel => {
      return (
        channel.name.toLowerCase().includes(query) ||
        channel.description.toLowerCase().includes(query)
      );
    });
  }

  if (showFavoritesOnly) {
    results = results.filter(channel => channel.isFavorite);
  }

  populateChannels(results);
}

function updateChannelInfo(channel, streamUrl) {
  const mediaType = channel.mediaType || 'video';
  channelInfo.innerHTML = `
    <strong>Channel:</strong> ${channel.name || 'Custom stream'}<br />
    <strong>Description:</strong> ${channel.description || 'Direct stream URL'}<br />
    <strong>Type:</strong> ${mediaType.toUpperCase()}<br />
    <strong>Stream URL:</strong> ${streamUrl}<br />
    <strong>Status:</strong> Playing or waiting for stream data...
  `;
}

function getSelectedChannel() {
  const index = parseInt(channelSelect.value, 10);
  return filteredChannels[index];
}

function playStream(streamUrl, mediaType = 'video') {
  if (!streamUrl) {
    alert('A valid HLS/DASH stream URL is required.');
    return;
  }

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  player.hidden = mediaType === 'audio';
  radioPlayer.hidden = mediaType !== 'audio';

  if (mediaType === 'audio') {
    radioPlayer.src = streamUrl;
    radioPlayer.play().catch(() => {});
    return;
  }

  radioPlayer.pause();
  radioPlayer.src = '';

  if (Hls.isSupported()) {
    hlsInstance = new Hls();
    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(player);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => player.play().catch(() => {}));
    hlsInstance.on(Hls.Events.ERROR, (_, data) => {
      console.warn('HLS error', data);
    });
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = streamUrl;
    player.play().catch(() => {});
  } else {
    alert('Your browser does not support HLS playback.');
  }
}

function loadLocalChannelFile() {
  const file = channelFileInput.files[0];
  if (!file) {
    alert('Please choose a local JSON channel file to load.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const list = JSON.parse(reader.result);
      if (!Array.isArray(list)) {
        throw new Error('Channel file must be a JSON array.');
      }
      channels = list.map(channel => ({
        name: channel.name || 'Unnamed channel',
        description: channel.description || '',
        mediaType: channel.mediaType || 'video',
        url: channel.url || ''
      }));
      saveChannelsToStorage();
      populateChannels(channels);
      channelFileInput.value = '';
      alert('Channels loaded from the selected file.');
    } catch (error) {
      alert('Could not load the channels file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

function addChannelEntry() {
  const name = addNameInput.value.trim();
  const description = addDescInput.value.trim();
  const mediaType = addTypeSelect.value;
  const url = addUrlInput.value.trim();

  if (!name || !url) {
    alert('A channel name and stream URL are required.');
    return;
  }

  const channel = { name, description, mediaType, url };
  channels.push(channel);
  saveChannelsToStorage();
  populateChannels(channels);
  addNameInput.value = '';
  addDescInput.value = '';
  addUrlInput.value = '';
  addTypeSelect.value = 'video';
  alert('Channel added successfully.');
}

function playSelectedChannel() {
  const channel = getSelectedChannel();
  if (!channel) {
    alert('No channel is selected.');
    return;
  }

  if (!channel.url) {
    alert('This channel does not yet have a stream URL. Paste a direct stream URL to play it.');
    updateChannelInfo(channel, 'No stream URL set');
    return;
  }

  updateChannelInfo(channel, channel.url);
  playStream(channel.url, channel.mediaType || 'video');
}

function loadCustomUrl() {
  const url = customUrlInput.value.trim();
  if (!url) {
    alert('Enter a direct stream URL before loading.');
    return;
  }

  updateChannelInfo({ name: 'Custom stream', description: 'User-provided URL', mediaType: 'video', isFavorite: false }, url);
  playStream(url, 'video');
}

function toggleFavoriteChannel() {
  const channel = getSelectedChannel();
  if (!channel) {
    alert('Please select a channel to favorite.');
    return;
  }

  channel.isFavorite = !channel.isFavorite;
  saveChannelsToStorage();
  populateChannels(channels);
}

loadChannels();
channelSearch.addEventListener('input', filterChannels);
playButton.addEventListener('click', playSelectedChannel);
loadCustomButton.addEventListener('click', loadCustomUrl);
loadFileButton.addEventListener('click', loadLocalChannelFile);
favoriteButton.addEventListener('click', toggleFavoriteChannel);
showFavoritesOnlyCheckbox.addEventListener('change', event => {
  showFavoritesOnly = event.target.checked;
  filterChannels();
});
resetDefaultButton.addEventListener('click', resetToDefaultChannels);
clearStorageButton.addEventListener('click', clearSavedChannels);
addChannelButton.addEventListener('click', addChannelEntry);
