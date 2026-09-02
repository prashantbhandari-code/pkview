const PROXY_BASE = '/api/tmdb';
const IMG_url = 'https://image.tmdb.org/t/p/w500';
const SPORTS_API = 'https://api.embedsportex.fun/api';
const NEPALI_FEATURED_ID = 1423966;

// --- XSS sanitization ---
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- Build proxied TMDB URLs ---
function tmdbUrl(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return `${PROXY_BASE}/${endpoint}${qs ? '?' + qs : ''}`;
}

function buildDiscoverUrl(mediaType, extraParams) {
    const base = mediaType === 'movie' ? 'discover/movie' : 'discover/tv';
    return tmdbUrl(base, { sort_by: 'popularity.desc', ...extraParams });
}

function buildSearchUrl(mediaType, query, extraParams) {
    const base = mediaType === 'movie' ? 'search/movie' : 'search/tv';
    return tmdbUrl(base, { query, ...extraParams });
}

const API_url = buildDiscoverUrl('movie', {});
const TV_url = tmdbUrl('tv/popular', { 'vote_count.gte': 100 });
const BOLLYWOOD_url = buildDiscoverUrl('movie', { with_original_language: 'hi', sort_by: 'primary_release_date.desc', 'vote_count.gte': 50 });
const ANIME_url = buildDiscoverUrl('tv', { with_genres: 16, with_original_language: 'ja', 'vote_count.gte': 50 });
const SPORTS_url = buildDiscoverUrl('tv', { with_genres: 10769, with_original_language: 'hi', sort_by: 'popularity.desc', 'vote_count.gte': 10 });
const NEPALI_url = buildDiscoverUrl('movie', { with_original_language: 'ne', 'vote_count.gte': 0 })

// Drama data
const DRAMA_DATA = [
    {
        id: 'mandap-main-masti',
        title: 'Mandap Main Masti',
        genre: 'Drama · Comedy · Romance',
        description: 'A fun-filled Hindi drama set in the lively atmosphere of a wedding mandap. With twists, turns, and lots of masti, this show keeps you entertained episode after episode.',
        poster: 'https://img.youtube.com/vi/bRbJYKuDPYE/maxresdefault.jpg',
        type: 'tv'
    },
    {
        id: 'boss-bangayi-baby',
        title: 'Boss Bangayi Baby',
        genre: 'Drama · Comedy · Family',
        description: 'When the boss becomes a baby, chaos and laughter follow! A unique Hindi drama blending comedy and family emotions in the most unexpected way.',
        poster: 'https://img.youtube.com/vi/qPGmIa-WQhA/maxresdefault.jpg',
        type: 'tv'
    }
];

function loadDramaSection() {
    const container = document.getElementById('dramaContainer');
    if (!container) return;
    container.innerHTML = '';

    DRAMA_DATA.forEach(drama => {
        const card = document.createElement('div');
        card.classList.add('drama-card');
        card.innerHTML = `
            <img class="drama-card-img" src="${drama.poster}" alt="${drama.title}" onerror="this.src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'">
            <div class="drama-card-body">
                <span class="drama-card-genre">${drama.genre}</span>
                <h3 class="drama-card-title">${drama.title}</h3>
                <p class="drama-card-desc">${drama.description}</p>
                <button class="drama-card-watch" onclick="openDramaStream('${drama.id}')">▶ Watch Now</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openDramaStream(dramaId) {
    const drama = DRAMA_DATA.find(d => d.id === dramaId);
    if (!drama) return;

    // Search TMDB for the drama
    fetch(buildSearchUrl('tv', drama.title))
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const item = data.results[0];
                item.media_type = 'tv';
                openStream(item);
            } else {
                // Not on TMDB — open first streaming server with search
                const serverUrl = STREAMING_SERVERS[0].tv('', 1, 1).replace(/\/tv\/\d+\/\d+\/\d+/, '/search/' + encodeURIComponent(drama.title));
                window.open(serverUrl, '_blank');
            }
        })
        .catch(() => {
            // Fallback — open first streaming server with search
            const serverUrl = STREAMING_SERVERS[0].tv('', 1, 1).replace(/\/tv\/\d+\/\d+\/\d+/, '/search/' + encodeURIComponent(drama.title));
            window.open(serverUrl, '_blank');
        });
}

// Live sports data and stream player
let liveSportsData = null;

async function loadLiveSports() {
    const container = document.getElementById('liveSportsContainer');
    if (!container) return;

    try {
        const res = await fetch(SPORTS_API);
        const data = await res.json();
        liveSportsData = data;
        renderLiveSports(container, data);
    } catch (e) {
        container.innerHTML = '<div class="live-sports-empty">No live matches right now</div>';
    }
}

function renderLiveSports(container, data) {
    const sports = ['cricket', 'football', 'basketball', 'tennis', 'hockey'];
    let matches = [];

    sports.forEach(sport => {
        if (data[sport] && Array.isArray(data[sport])) {
            data[sport].forEach(match => {
                if (match.iframes && match.iframes.length > 0) {
                    matches.push({ ...match, sport });
                }
            });
        }
    });

    if (matches.length === 0) {
        container.innerHTML = '<div class="live-sports-empty">No live matches right now. Check back later!</div>';
        return;
    }

    container.innerHTML = matches.map((match, i) => {
        const sportEmoji = { cricket: '🏏', football: '⚽', basketball: '🏀', tennis: '🎾', hockey: '🏒' }[match.sport] || '🏆';
        const safeTag = escapeHtml(match.tag || match.league || 'Live Match');
        const safeLeague = escapeHtml(match.league || '');
        return `
        <div class="live-match-card" onclick="openLiveMatch(${i})">
            <div class="live-match-emoji">${sportEmoji}</div>
            <div class="live-match-tag">${safeTag}</div>
            <div class="live-match-league">${safeLeague}</div>
            <div class="live-match-status">LIVE NOW</div>
        </div>`;
    }).join('');

    window._liveMatches = matches;
}

function openLiveMatch(index) {
    const match = window._liveMatches && window._liveMatches[index];
    if (!match || !match.iframes || match.iframes.length === 0) return;

    const streamUrl = match.iframes[0].url;
    const modal = document.getElementById('streamModal');
    const streamFrame = document.getElementById('streamFrame');
    const serverTabs = document.querySelector('.server-tabs');
    const errorMsg = document.getElementById('serverError');
    const seasonContainer = document.getElementById('seasonSelectContainer');
    const trailerBtn = document.getElementById('trailerBtn');
    const trailerPlayer = document.getElementById('trailerPlayer');

    if (serverTabs) serverTabs.style.display = 'none';
    if (seasonContainer) seasonContainer.style.display = 'none';
    if (trailerBtn) trailerBtn.style.display = 'none';
    if (trailerPlayer) trailerPlayer.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    streamFrame.src = streamUrl;
    streamFrame.style.display = 'block';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    window._sportsChannelClose = true;
}

const genres = [
    { "id": 28, "name": "Action" },
    { "id": 12, "name": "Adventure" },
    { "id": 16, "name": "Animation" },
    { "id": 35, "name": "Comedy" },
    { "id": 80, "name": "Crime" },
    { "id": 99, "name": "Documentary" },
    { "id": 18, "name": "Drama" },
    { "id": 10751, "name": "Family" },
    { "id": 14, "name": "Fantasy" },
    { "id": 36, "name": "History" },
    { "id": 27, "name": "Horror" },
    { "id": 10402, "name": "Music" },
    { "id": 9648, "name": "Mystery" },
    { "id": 10749, "name": "Romance" },
    { "id": 878, "name": "Science Fiction" },
    { "id": 10770, "name": "TV Movie" },
    { "id": 53, "name": "Thriller" },
    { "id": 10752, "name": "War" },
    { "id": 37, "name": "Western" }
];

// Streaming servers configuration (ad-free, 1080p - verified working)
const STREAMING_SERVERS = [
    {
        name: 'VidNest',
        movie: (id) => `https://vidnest.fun/movie/${id}`,
        tv: (id, s, e) => `https://vidnest.fun/tv/${id}/${s}/${e}`
    },
    {
        name: 'EmbedMaster',
        movie: (id) => `https://embedmaster.link/movie/${id}`,
        tv: (id, s, e) => `https://embedmaster.link/tv/${id}/${s}/${e}`
    },
    {
        name: 'YapGrid',
        movie: (id) => `https://yapgrid.com/embed/movie/${id}`,
        tv: (id, s, e) => `https://yapgrid.com/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidLink',
        movie: (id) => `https://vidlink.pro/movie/${id}`,
        tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidPhantom',
        movie: (id) => `https://vidphantom.com/movie/${id}`,
        tv: (id, s, e) => `https://vidphantom.com/tv/${id}/${s}/${e}`
    },
    {
        name: '2Embed',
        movie: (id) => `https://2embed.skin/embed/${id}`,
        tv: (id, s, e) => `https://2embed.skin/embed/${id}?s=${s}&e=${e}`
    }
];

// State management
let currentStreamItem = null;
let currentServerIndex = 0;
let currentTvSeasons = [];
let currentSeason = 1;
let currentEpisode = 1;
let watchHistory = JSON.parse(localStorage.getItem('pkview_history') || '[]');
let favorites = JSON.parse(localStorage.getItem('pkview_favorites') || '[]');
let selectedGenre = [];
let currentSection = 'home'; // home, bollywood, anime, sports
let currentPage = 1;
let nextPage = 2;
let prevPage = 3;
let lastUrl = '';
let totalPages = 100;

window.addEventListener("DOMContentLoaded", (ev) => {
    let main = document.querySelector('#main');

    setGenres();
    loadThemePreference();
    setupHeaderControls();
    setupNavigation();

    const rightArrow = document.querySelector(".scrollable-tabs-container .right-arrow svg");
    const leftArrow = document.querySelector(".scrollable-tabs-container .left-arrow svg");
    const tagsEl = document.getElementById('tags');

    rightArrow.addEventListener("click", () => {
        tagsEl.scrollLeft += 500;
        manageIcons();
    });
    leftArrow.addEventListener("click", () => {
        tagsEl.scrollLeft -= 500;
        manageIcons();
    });

    let onPage = null;
    let whichPage = localStorage.getItem('page');
    if (whichPage == null) {
        localStorage.setItem("page", "movie");
        onPage = "movie";
    } else {
        onPage = whichPage;
    }

    let pgChange = document.querySelector('.pageChange');
    pgChange.addEventListener('click', () => {
        let whichPage = localStorage.getItem('page');
        if (whichPage == 'movie') {
            localStorage.setItem('page', 'tv');
            let tv_svg = `<svg class="switch" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-movie" viewBox="0 0 24 24" stroke-width="2" stroke="#7378c5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
            <path d="M8 4l0 16"></path>
            <path d="M16 4l0 16"></path>
            <path d="M4 8l4 0"></path>
            <path d="M4 16l4 0"></path>
            <path d="M4 12l16 0"></path>
            <path d="M16 8l4 0"></path>
            <path d="M16 16l4 0"></path>
            </svg>`;
            pgChange.innerHTML = tv_svg;
            LoadDataAndDisplay();
        } else if (whichPage == 'tv') {
            localStorage.setItem('page', 'movie');
            let movie_svg = `<svg class="switch" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-device-desktop" viewBox="0 0 24 24" stroke-width="2" stroke="#7378c5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M3 4m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z"></path>
            <path d="M7 20l10 0"></path>
            <path d="M9 16l0 4"></path>
            <path d="M15 16l0 4"></path>
            </svg>`;
            pgChange.innerHTML = movie_svg;
            LoadDataAndDisplay();
        }
    });

    LoadDataAndDisplay();
    loadWatchHistory();
    loadFavorites();

    const prev = document.getElementById("prev");
    const current = document.getElementById("current");
    const next = document.getElementById("next");

    prev.addEventListener('click', () => {
        if (prevPage > 0) {
            pageCall(prevPage);
            main.scrollIntoView({ behavior: 'smooth' });
        }
    });

    next.addEventListener('click', () => {
        if (nextPage <= totalPages) {
            pageCall(nextPage);
            main.scrollIntoView({ behavior: 'smooth' });
        }
    });

    let searchBar = document.querySelector('.search');
    searchBar.addEventListener('input', searchStart);

    // Prevent form submit from reloading the page
    const searchForm = document.getElementById('form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => e.preventDefault());
    }

    let copyRightYear = document.getElementById("copyright-year");
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    copyRightYear.innerText = currentYear;

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeStream();
            closeSeasonModal();
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('streamModal')) {
            closeStream();
        }
        if (e.target === document.getElementById('seasonModal')) {
            closeSeasonModal();
        }
    });

    // Server tab clicks
    document.querySelectorAll('.server-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const serverIndex = parseInt(tab.dataset.server);
            loadServer(serverIndex);
        });
    });

    // Language selector
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            const frame = document.getElementById('streamFrame');
            if (frame.src) {
                frame.src = frame.src.split('&lang=')[0] + '&lang=' + lang;
            }
        });
    }

    // Season/Episode selectors
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', async (e) => {
            if (currentStreamItem) {
                const seasonNum = parseInt(e.target.value);
                await loadEpisodes(currentStreamItem.id, seasonNum);
            }
        });
    }
    if (episodeSelect) {
        episodeSelect.addEventListener('change', (e) => {
            currentEpisode = parseInt(e.target.value);
            loadServer(currentServerIndex);
        });
    }

    // Clear favorites button
    const clearBtn = document.getElementById('clearFavorites');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFavorites);
    }
});

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function setGenres() {
    let tags_el = document.querySelector('#tags');
    genres.forEach(genre => {
        const t = document.createElement('div');
        t.classList.add('tag');
        t.id = genre.id;
        t.innerText = genre.name;
        t.addEventListener('click', () => {
            if (selectedGenre.length == 0) {
                selectedGenre.push(genre.id);
            } else {
                if (selectedGenre.includes(genre.id)) {
                    selectedGenre.forEach((id, idx) => {
                        if (id == genre.id) {
                            selectedGenre.splice(idx, 1);
                        }
                    });
                } else {
                    selectedGenre.push(genre.id);
                }
            }
            let newurl = API_url + '&with_genres=' + encodeURI(selectedGenre.join(','));
            let whichPage = localStorage.getItem('page');
            LoadMovieOrTv(whichPage, newurl);
            highlightSelection();
        });
        tags_el.append(t);
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });

    // Sports channel click handlers
    document.querySelectorAll('.sports-channel-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Let the default link behavior work (opens YouTube)
        });
    });
}

function switchSection(section) {
    currentSection = section;
    selectedGenre = [];
    currentPage = 1;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });

    // Show/hide genre tags based on section
    const genreSection = document.querySelector('.scrollable-tabs-container');
    if (section === 'home') {
        genreSection.style.display = 'flex';
    } else {
        genreSection.style.display = 'none';
    }

    // Show/hide sports channels
    const sportsChannels = document.getElementById('sportsChannelsSection');
    if (sportsChannels) {
        sportsChannels.style.display = section === 'sports' ? 'block' : 'none';
    }

    // Show/hide drama section
    const dramaSection = document.getElementById('dramaSection');
    if (dramaSection) {
        dramaSection.style.display = section === 'drama' ? 'block' : 'none';
    }

    // Show/hide nepali featured
    const nepaliFeatured = document.getElementById('nepaliFeaturedSection');
    if (nepaliFeatured) {
        nepaliFeatured.style.display = section === 'nepali' ? 'block' : 'none';
    }

    // Load appropriate content
    if (section === 'home') {
        let whichPage = localStorage.getItem('page');
        LoadDataAndDisplay();
    } else if (section === 'bollywood') {
        currentSection = 'bollywood';
        LoadMovieOrTv('movie', BOLLYWOOD_url);
    } else if (section === 'nepali') {
        currentSection = 'nepali';
        loadNepaliFeatured();
        LoadMovieOrTv('movie', NEPALI_url);
    } else if (section === 'anime') {
        currentSection = 'anime';
        LoadMovieOrTv('tv', ANIME_url);
    } else if (section === 'drama') {
        currentSection = 'drama';
        loadDramaSection();
    } else if (section === 'sports') {
        currentSection = 'sports';
        LoadMovieOrTv('tv', SPORTS_url);
        loadLiveSports();
    }
}

const manageIcons = () => {
    const tagsEl = document.getElementById('tags');
    const leftArrowContainer = document.querySelector(".scrollable-tabs-container .left-arrow");
    const rightArrowContainer = document.querySelector(".scrollable-tabs-container .right-arrow");

    if (tagsEl.scrollLeft >= 20) {
        leftArrowContainer.classList.add("active");
    } else {
        leftArrowContainer.classList.remove("active");
    }
    let maxScrollValue = tagsEl.scrollWidth - tagsEl.clientWidth - 20;

    if (tagsEl.scrollLeft >= maxScrollValue) {
        rightArrowContainer.classList.remove("active");
    } else {
        rightArrowContainer.classList.add("active");
    }
}

function highlightSelection() {
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.classList.remove('active');
    });
    if (selectedGenre.length != 0) {
        selectedGenre.forEach(id => {
            const highlightedTag = document.getElementById(id);
            highlightedTag.classList.add('active');
        });
    }
}

function pageCall(page) {
    try {
        const url = new URL(lastUrl, window.location.origin);
        url.searchParams.set('page', page);
        const whichPage = localStorage.getItem('page');
        LoadMovieOrTv(whichPage, url.pathname + url.search);
    } catch (e) {
        console.error('pageCall URL parse error:', e);
    }
}

function LoadDataAndDisplay() {
    let whichPage = localStorage.getItem('page');
    let main = document.querySelector('#main');
    showSkeletons();

    if (whichPage == 'movie') {
        LoadMovieOrTv(whichPage, API_url);
    } else if (whichPage == 'tv') {
        LoadMovieOrTv(whichPage, TV_url);
    }
}

// Show skeleton loaders while content loads
function showSkeletons() {
    const main = document.querySelector('#main');
    main.innerHTML = '';
    const frag = document.createDocumentFragment();
    const tpl = document.createElement('template');
    tpl.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton skeleton-poster"></div>
            <div class="skeleton-info">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-rating"></div>
            </div>
        </div>
    `;
    for (let i = 0; i < 6; i++) {
        frag.appendChild(tpl.content.cloneNode(true));
    }
    main.appendChild(frag);
}

async function LoadMovieOrTv(whichPage, url) {
    lastUrl = url;
    let main = document.querySelector('#main');

    try {
        let res = await fetch(url);
        if (!res.ok) throw new Error('API request failed');
        let data = await res.json();

        if (data.results && data.results.length !== 0) {
            if (whichPage == 'movie') {
                showMovies(data.results);
            } else if (whichPage == 'tv') {
                showTvShows(data.results);
            }
            currentPage = data.page;
            nextPage = currentPage + 1;
            prevPage = currentPage - 1;
            totalPages = data.total_pages;
            current.innerText = currentPage;

            if (currentPage <= 1) {
                prev.classList.add('disabled');
                next.classList.remove('disabled');
            } else if (currentPage >= totalPages) {
                prev.classList.remove('disabled');
                next.classList.add('disabled');
            } else {
                prev.classList.remove('disabled');
                next.classList.remove('disabled');
            }
        } else {
            main.innerHTML = '<div class="empty-state">WOW! SUCH EMPTY 🙂</div>';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        main.innerHTML = `
        <div class="error-state">
            <h2>⚠️ Failed to load content</h2>
            <p>${escapeHtml(error.message || 'Unknown error')}</p>
            <button onclick="LoadDataAndDisplay()" class="knowmore">Retry</button>
        </div>
        `;
    }
}

function showMovies(data) {
    let main = document.querySelector('#main');
    main.innerHTML = '';

    data.forEach(movie => {
        const { title, poster_path, vote_average, overview, release_date, id } = movie;
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        movieEl.dataset.item = JSON.stringify({...movie, media_type: 'movie'});

        const safeTitle = escapeHtml(title);
        const safeOverview = escapeHtml(overview);
        const posterSrc = poster_path ? IMG_url + poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU';

        movieEl.innerHTML = `
        <div>
        <span class="releaseDate">${escapeHtml(release_date)}</span>
        <img src="${posterSrc}" alt="${safeTitle}">
        </div>
        <div class="movie-info">
        <h3>${safeTitle}</h3>
        <span class="rating ${getColor(vote_average)}">${vote_average}</span>
        <button class="favorite-btn" data-id="${id}" data-type="movie" title="Add to favorites">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a4.97 4.97 0 0 0-7.14 0L12 6.01 9.3 3.3a4.97 4.97 0 0 0-7.14 0C.29 6.45 0 8.9 0 11.35c0 3.63 3.28 6.32 8.17 10.87L12 22.3l3.83-3.41c4.89-4.55 8.14-7.24 8.14-10.87 0-2.45-.29-4.9-1.93-6.54z"></path>
            </svg>
        </button>
        </div>
        <div class="overview">
        <span>
        <h3>${safeTitle}</h3>
        <span class="overview-content">${safeOverview}</span>
        <br>
        <button class="watchnow">Watch Now</button>
        </span>
        </div>
        `;
        main.appendChild(movieEl);
    });

    setupWatchButtons();
    setupFavoriteButtons();
}

function showTvShows(data) {
    let main = document.querySelector('#main');
    main.innerHTML = '';

    data.forEach(tvshow => {
        const { name, overview, poster_path, vote_average, first_air_date, id } = tvshow;
        const tvEl = document.createElement('div');
        tvEl.classList.add('tvshow');
        tvEl.dataset.item = JSON.stringify({...tvshow, media_type: 'tv'});

        const safeName = escapeHtml(name);
        const safeOverview = escapeHtml(overview);
        const posterSrc = poster_path ? IMG_url + poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU';

        tvEl.innerHTML = `
      <div>
      <span class="releaseDate">${escapeHtml(first_air_date)}</span>
      <img src="${posterSrc}" alt="${safeName}">
      </div>
      <div class="movie-info">
      <h3>${safeName}</h3>
      <span class="rating ${getColor(vote_average)}">${vote_average}</span>
      <button class="favorite-btn" data-id="${id}" data-type="tv" title="Add to favorites">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a4.97 4.97 0 0 0-7.14 0L12 6.01 9.3 3.3a4.97 4.97 0 0 0-7.14 0C.29 6.45 0 8.9 0 11.35c0 3.63 3.28 6.32 8.17 10.87L12 22.3l3.83-3.41c4.89-4.55 8.14-7.24 8.14-10.87 0-2.45-.29-4.9-1.93-6.54z"></path>
          </svg>
      </button>
      </div>
      <div class="overview">
    <h3>${safeName}</h3>
    <span class="overview-content">${safeOverview}</span>
    <br>
    <button class="watchnow">Watch Now</button>
    </span>
   </div>
    `;
        main.appendChild(tvEl);
    });

    setupWatchButtons();
    setupFavoriteButtons();
}

function setupWatchButtons() {
    document.querySelectorAll('.watchnow').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.movie, .tvshow');
            if (card && card.dataset.item) {
                const item = JSON.parse(card.dataset.item);
                openStream(item);
            }
        });
    });
}

function setupFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const type = btn.dataset.type;
            toggleFavorite(id, type);
        });
    });
    updateFavoriteButtons();
}

function getColor(vote) {
    if (vote >= 7) {
        return 'green';
    } else if (vote >= 5) {
        return 'orange';
    } else {
        return 'red';
    }
}

function searchResultsAndDisplayWrapper(ev) {
    let whichPage = localStorage.getItem('page');
    const searchQuery = ev.target.value;

    if (!searchQuery) {
        if (currentSection === 'bollywood') {
            LoadMovieOrTv('movie', BOLLYWOOD_url);
        } else if (currentSection === 'nepali') {
            LoadMovieOrTv('movie', NEPALI_url);
        } else if (currentSection === 'anime') {
            LoadMovieOrTv('tv', ANIME_url);
        } else if (currentSection === 'drama') {
            loadDramaSection();
        } else if (currentSection === 'sports') {
            LoadMovieOrTv('tv', SPORTS_url);
        } else if (whichPage == 'movie') {
            LoadMovieOrTv(whichPage, API_url);
        } else if (whichPage == 'tv') {
            LoadMovieOrTv(whichPage, TV_url);
        }
    } else {
        const langMap = {
            bollywood: 'movie',
            nepali: 'movie',
            anime: 'tv',
            drama: 'tv',
            sports: 'tv'
        };
        const langCodeMap = {
            bollywood: 'hi',
            nepali: 'ne',
            anime: 'ja',
            drama: 'hi',
            sports: 'hi'
        };

        if (currentSection && langMap[currentSection]) {
            const type = langMap[currentSection];
            const lang = langCodeMap[currentSection];
            const url = buildSearchUrl(type, searchQuery, { with_original_language: lang });
            LoadMovieOrTv(type, url);
        } else if (whichPage == 'movie') {
            LoadMovieOrTv('movie', buildSearchUrl('movie', searchQuery));
        } else {
            LoadMovieOrTv('tv', buildSearchUrl('tv', searchQuery));
        }
    }
}

function searchAndDisplay(func, delay) {
    let timer;
    return function () {
        let context = this, arg = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, arguments);
        }, delay);
    };
}

const searchStart = searchAndDisplay(searchResultsAndDisplayWrapper, 900);

// Nepali featured movie banner
async function loadNepaliFeatured() {
    const container = document.getElementById('nepaliFeatured');
    if (!container) return;

    try {
        const res = await fetch(tmdbUrl('movie/' + NEPALI_FEATURED_ID));
        const movie = await res.json();
        const safeTitle = escapeHtml(movie.title || '');
        const safeOverview = escapeHtml(movie.overview ? movie.overview.substring(0, 200) + '...' : '');
        const backdropUrl = movie.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + movie.backdrop_path : '';
        const releaseDate = escapeHtml(movie.release_date || '');
        const rating = movie.vote_average ? ' · ⭐ ' + movie.vote_average.toFixed(1) : '';
        const movieJson = JSON.stringify(movie).replace(/"/g, '&quot;');

        container.innerHTML = `
            <div class="nepali-banner">
                <img src="${backdropUrl}" alt="${safeTitle}" class="nepali-banner-img">
                <div class="nepali-banner-content">
                    <span class="nepali-banner-tag">Featured Nepali Film</span>
                    <h1 class="nepali-banner-title">${safeTitle}</h1>
                    <p class="nepali-banner-meta">${releaseDate}${rating}</p>
                    <p class="nepali-banner-desc">${safeOverview}</p>
                    <button class="nepali-banner-btn" onclick="openStream(${movieJson}, 'movie')">
                        ▶ Watch Now
                    </button>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<div class="nepali-banner-empty">Featured movie unavailable</div>';
    }
}

// Theme toggle functionality
function loadThemePreference() {
    const savedTheme = localStorage.getItem('pkview_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

function setupHeaderControls() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('pkview_theme', isLight ? 'light' : 'dark');
        });
    }
}

// Watch History functionality
async function addToHistory(item) {
    const whichPage = localStorage.getItem('page');
    const historyItem = {
        id: item.id,
        title: item.title || item.name,
        poster: item.poster_path,
        type: whichPage === 'movie' ? 'movie' : 'tv',
        timestamp: Date.now()
    };

    // Remove existing entry if present
    watchHistory = watchHistory.filter(h => h.id !== item.id || h.type !== whichPage);
    watchHistory.unshift(historyItem);
    watchHistory = watchHistory.slice(0, 10); // Keep last 10
    localStorage.setItem('pkview_history', JSON.stringify(watchHistory));
}

function loadWatchHistory() {
    const section = document.getElementById('watchHistorySection');
    const grid = document.getElementById('watchHistoryGrid');

    if (!watchHistory.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = '';

    watchHistory.slice(0, 6).forEach(item => {
        const div = document.createElement('div');
        div.classList.add('movie');
        div.dataset.item = JSON.stringify({...item, media_type: item.type});
        const safeTitle = escapeHtml(item.title || '');
        const posterSrc = item.poster ? IMG_url + item.poster : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU';
        div.innerHTML = `
            <img src="${posterSrc}" alt="${safeTitle}">
            <div class="movie-info"><h3>${safeTitle}</h3></div>
        `;
        div.addEventListener('click', () => {
            const data = JSON.parse(div.dataset.item);
            openStream(data);
        });
        grid.appendChild(div);
    });
}

// Favorites functionality
function toggleFavorite(id, type) {
    const item = { id, type };
    const existingIndex = favorites.findIndex(f => f.id === id && f.type === type);

    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push(item);
    }

    localStorage.setItem('pkview_favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        const type = btn.dataset.type;
        const isFavorited = favorites.some(f => f.id === id && f.type === type);
        btn.innerHTML = isFavorited
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.34C5.41 15.74 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.41 7.24-8.55 14.21L12 21.35z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a4.97 4.97 0 0 0-7.14 0L12 6.01 9.3 3.3a4.97 4.97 0 0 0-7.14 0C.29 6.45 0 8.9 0 11.35c0 3.63 3.28 6.32 8.17 10.87L12 22.3l3.83-3.41c4.89-4.55 8.14-7.24 8.14-10.87 0-2.45-.29-4.9-1.93-6.54z"></path></svg>';
        btn.style.color = isFavorited ? '#ff1361' : '#aaa';
    });
}

function loadFavorites() {
    const section = document.getElementById('favoritesSection');
    const grid = document.getElementById('favoritesGrid');
    const clearBtn = document.getElementById('clearFavorites');

    if (!favorites.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    clearBtn.style.display = 'inline-block';
    grid.innerHTML = '';

    favorites.forEach(item => {
        const whichPage = item.type === 'movie' ? 'movie' : 'tv';
        const endpoint = whichPage === 'movie' ? 'movie/' + item.id : 'tv/' + item.id;
        const url = tmdbUrl(endpoint);

        fetch(url)
            .then(res => res.json())
            .then(data => {
                const div = document.createElement('div');
                div.classList.add('movie');
                div.dataset.item = JSON.stringify({...data, media_type: item.type});
                const displayName = escapeHtml(data.title || data.name || '');
                const posterSrc = data.poster_path ? IMG_url + data.poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU';
                div.innerHTML = `
                    <img src="${posterSrc}" alt="${displayName}">
                    <div class="movie-info"><h3>${displayName}</h3></div>
                `;
                div.addEventListener('click', () => {
                    const streamData = JSON.parse(div.dataset.item);
                    openStream(streamData);
                });
                grid.appendChild(div);
                updateFavoriteButtons();
            })
            .catch(err => console.error('Error loading favorite:', err));
    });
}

// Open streaming modal
function openStream(item, mediaType) {
    addToHistory(item);

    currentStreamItem = item;
    if (mediaType) currentStreamItem.media_type = mediaType;
    currentServerIndex = 0;
    const modal = document.getElementById('streamModal');
    const title = document.getElementById('streamTitle');

    title.textContent = item.title || item.name;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Handle TV show season/episode selection
    if (item.media_type === 'tv') {
        document.getElementById('seasonSelectContainer').style.display = 'flex';
        loadSeasonEpisode(item.id);
    } else {
        document.getElementById('seasonSelectContainer').style.display = 'none';
    }

    loadServer(0);
    loadTrailer(item);
}

// Load seasons and episodes for TV shows
async function loadSeasonEpisode(tvId) {
    try {
        const detailsUrl = tmdbUrl('tv/' + tvId);
        const res = await fetch(detailsUrl);
        const details = await res.json();

        currentTvSeasons = details.seasons || [];
        const seasonSelect = document.getElementById('seasonSelect');
        const episodeSelect = document.getElementById('episodeSelect');

        seasonSelect.innerHTML = '';
        if (currentTvSeasons.length > 0) {
            currentTvSeasons.forEach((season, idx) => {
                if (season.season_number > 0) { // Skip season 0
                    const option = document.createElement('option');
                    option.value = season.season_number;
                    option.textContent = `Season ${season.season_number} (${season.episode_count} episodes)`;
                    seasonSelect.appendChild(option);
                }
            });

            currentSeason = currentTvSeasons.find(s => s.season_number > 0)?.season_number || 1;
            await loadEpisodes(tvId, currentSeason);
        }
    } catch (error) {
        console.error('Error loading seasons:', error);
        const seasonSelect = document.getElementById('seasonSelect');
        if (seasonSelect) {
            seasonSelect.innerHTML = '<option value="">Failed to load seasons</option>';
        }
    }
}

async function loadEpisodes(tvId, seasonNum) {
    try {
        const seasonUrl = tmdbUrl('tv/' + tvId + '/season/' + seasonNum);
        const res = await fetch(seasonUrl);
        const data = await res.json();

        const episodeSelect = document.getElementById('episodeSelect');
        episodeSelect.innerHTML = '';

        data.episodes?.forEach(ep => {
            const option = document.createElement('option');
            option.value = ep.episode_number;
            option.textContent = `S${seasonNum}E${ep.episode_number} - ${ep.name || ''}`;
            episodeSelect.appendChild(option);
        });

        currentSeason = seasonNum;
        currentEpisode = data.episodes?.[0]?.episode_number || 1;
        loadServer(currentServerIndex);
    } catch (error) {
        console.error('Error loading episodes:', error);
        const episodeSelect = document.getElementById('episodeSelect');
        if (episodeSelect) {
            episodeSelect.innerHTML = '<option value="">Failed to load episodes</option>';
        }
    }
}

// Load streaming server
function loadServer(index) {
    currentServerIndex = index;
    const frame = document.getElementById('streamFrame');
    const errorMsg = document.getElementById('serverError');
    if (!currentStreamItem) return;

    let url;
    if (currentStreamItem.media_type === 'tv') {
        url = STREAMING_SERVERS[index].tv(currentStreamItem.id, currentSeason, currentEpisode);
    } else {
        url = STREAMING_SERVERS[index].movie(currentStreamItem.id);
    }

    frame.src = url;
    errorMsg.style.display = 'none';
    frame.style.display = 'block';

    // Update active tab
    document.querySelectorAll('.server-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
}

// Load trailer
async function loadTrailer(item) {
    const whichPage = item.media_type === 'tv' ? 'tv' : 'movie';
    const endpoint = whichPage === 'movie' ? 'movie/' + item.id + '/videos' : 'tv/' + item.id + '/videos';
    const url = tmdbUrl(endpoint);

    try {
        const res = await fetch(url);
        const data = await res.json();
        const trailerBtn = document.getElementById('trailerBtn');

        if (data.results && data.results.length > 0) {
            const trailer = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') || data.results[0];
            if (trailer && trailer.key) {
                trailerBtn.onclick = () => toggleTrailer(trailer.key);
                trailerBtn.style.display = 'inline-block';
            } else {
                trailerBtn.style.display = 'none';
            }
        } else {
            trailerBtn.style.display = 'none';
        }
    } catch (e) {
        document.getElementById('trailerBtn').style.display = 'none';
    }
}

// Toggle trailer visibility
function toggleTrailer(key) {
    const player = document.getElementById('trailerPlayer');
    const frame = document.getElementById('trailerFrame');
    const btn = document.getElementById('trailerBtn');

    if (player.style.display === 'none') {
        frame.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
        player.style.display = 'block';
        btn.textContent = 'Hide Trailer';
    } else {
        frame.src = '';
        player.style.display = 'none';
        btn.textContent = 'Watch Trailer';
    }
}

// Close streaming modal
function closeStream() {
    const modal = document.getElementById('streamModal');
    const streamFrame = document.getElementById('streamFrame');
    const trailerFrame = document.getElementById('trailerFrame');
    const trailerPlayer = document.getElementById('trailerPlayer');
    const trailerBtn = document.getElementById('trailerBtn');
    const errorMsg = document.getElementById('serverError');
    const seasonContainer = document.getElementById('seasonSelectContainer');

    modal.classList.remove('active');
    streamFrame.src = '';
    streamFrame.style.display = 'block';
    trailerFrame.src = '';
    trailerPlayer.style.display = 'none';
    trailerBtn.textContent = 'Watch Trailer';
    errorMsg.style.display = 'none';
    seasonContainer.style.display = 'none';
    document.body.style.overflow = '';

    // Restore server tabs if hidden by sports live match
    const serverTabs = document.querySelector('.server-tabs');
    if (serverTabs && window._sportsChannelClose) {
        serverTabs.style.display = 'flex';
        window._sportsChannelClose = false;
    }
}

// Close season modal
function closeSeasonModal() {
    const modal = document.getElementById('seasonModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Clear favorites
function clearFavorites() {
    favorites = [];
    localStorage.removeItem('pkview_favorites');
    document.getElementById('favoritesSection').style.display = 'none';
    updateFavoriteButtons();
}
