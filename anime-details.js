const animeTitleElement = document.getElementById('anime-title');
const animeInfoElement = document.getElementById('anime-info');
const episodeSelectorElement = document.getElementById('episode-selector');
const episodeContainerElement = document.getElementById('episode-container');
const videoPlayer = document.getElementById('videoplayer'); // Corrected ID

const animeId = new URLSearchParams(window.location.search).get('anime');
const apiUrl = `https://animestreaming-d57dbedc63cf.herokuapp.com/anime/gogoanime/info/${animeId}`; // No proxy

// Detect if the user is on iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Set playsinline attribute for iOS devices to prevent automatic fullscreen
if (isIOS) {
    videoPlayer.setAttribute('playsinline', 'true');
}

// Fetch anime info
fetch(apiUrl)
    .then(async (response) => {
        const data = await response.json();
        animeTitleElement.textContent = data.title;
        animeInfoElement.textContent = data.description;

        const episodes = data.episodes;
        const episodesPerGroup = 100;
        const totalEpisodes = episodes.length;
        const groupCount = Math.ceil(totalEpisodes / episodesPerGroup);

        if (totalEpisodes > episodesPerGroup) {
            const dropdown = document.createElement('select');
            dropdown.id = 'episode-range-dropdown';
            dropdown.addEventListener('change', (event) => {
                const selectedRange = event.target.value;
                showEpisodes(parseInt(selectedRange));
            });

            for (let i = 0; i < groupCount; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Episodes ${i * episodesPerGroup + 1} - ${Math.min((i + 1) * episodesPerGroup, totalEpisodes)}`;
                dropdown.appendChild(option);
            }

            episodeSelectorElement.appendChild(dropdown);

            // Display the first 100 episodes by default
            showEpisodes(0);
        } else {
            showEpisodes(0);
        }

        function showEpisodes(groupIndex) {
            episodeContainerElement.innerHTML = '';

            const startEpisode = groupIndex * episodesPerGroup;
            const endEpisode = Math.min(startEpisode + episodesPerGroup, totalEpisodes);

            const episodeListElement = document.createElement('div');
            episodeListElement.classList.add('episode-list');

            for (let j = startEpisode; j < endEpisode; j++) {
                const episodeBtn = document.createElement('a');
                episodeBtn.href = "#";
                episodeBtn.textContent = `Ep ${episodes[j].number}`;
                episodeBtn.classList.add('episode-btn');
                episodeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    playEpisode(episodes[j].id, j);
                });
                episodeListElement.appendChild(episodeBtn);
            }

            episodeContainerElement.appendChild(episodeListElement);

            // Automatically play the first episode
            if (episodes.length > 0) {
                playEpisode(episodes[0].id, 0);
            }
        }

        let player = null; // Declare player globally

        async function playEpisode(episodeId, episodeIndex) {
            const episodeUrl = `https://animestreaming-d57dbedc63cf.herokuapp.com/anime/gogoanime/watch/${episodeId}`;
            const errorMessageElement = document.getElementById('error-message');
            
            try {
                const response = await fetch(episodeUrl);
                const data = await response.json();
                const referer = data.headers.Referer;
        
                const videoResponse = await fetch(episodeUrl, {
                    headers: {
                        'Referer': referer
                    }
                });
                const videoData = await videoResponse.json();
        
                if (videoData.sources.length > 0) {
                    errorMessageElement.style.display = 'none';  // Hide error message if video is found
                    const videoSrc = videoData.sources[4].url;
        
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(videoSrc);
                        hls.attachMedia(videoPlayer);
        
                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            const qualityOptions = hls.levels.map((level, index) => ({
                                label: `${level.height}p`,
                                value: index
                            }));

                            if (!player) {
                                player = new Plyr(videoPlayer, {
                                    fullscreen: { fallback: true, iosNative: true }, // Plyr fullscreen configuration
                                    controls: [
                                        'play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration',
                                        'settings', 'speed', 'pip', 'airplay', 'fullscreen', 'next' // Added next button
                                    ],
                                    settings: ['quality', 'speed'],
                                    quality: {
                                        default: qualityOptions[2].value,
                                        options: qualityOptions.map(q => q.value),
                                        forced: true,
                                        onChange: (newQuality) => {
                                            hls.currentLevel = newQuality;
                                        }
                                    },
                                    tooltips: { controls: true } // Enable tooltips for better user experience
                                });

                                player.on('ended', () => {
                                    // Play the next episode automatically
                                    const nextEpisodeIndex = episodeIndex + 1;
                                    if (nextEpisodeIndex < episodes.length) {
                                        playEpisode(episodes[nextEpisodeIndex].id, nextEpisodeIndex);
                                    }
                                });

                                player.on('click', () => {
                                    // Skip 10 seconds forward
                                    player.forward(10);
                                });

                                player.on('click', () => {
                                    // Skip 10 seconds backward
                                    player.rewind(10);
                                });

                            }

                            player.play();
                        });
                    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                        videoPlayer.src = videoSrc;
                        videoPlayer.play();
                    } else {
                        console.error('Your browser does not support M3U8 streams');
                        errorMessageElement.style.display = 'block';
                    }
                } else {
                    console.error('No video sources found');
                }
            } catch (error) {
                errorMessageElement.style.display = 'block';
                console.error('Error fetching video sources:', error);
            }
        }
    })
    .catch(error => {
        console.error('Error fetching the anime data:', error);
    });
