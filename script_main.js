const API_key = 'api_key=4b153b123319df27bb67fcbfe219537d';
const BASE_url = 'https://api.themoviedb.org/3';
const API_url = BASE_url + '/discover/movie?sort_by=popularity.desc&' + API_key;
const IMG_url = 'https://image.tmdb.org/t/p/w500';
const SEARCH_url = 'https://api.themoviedb.org/3/search/movie?api_key=4b153b123319df27bb67fcbfe219537d&query=';
const TV_url = BASE_url + '/tv/popular?' + API_key + '&vote_count.gte=100';
const TV_Search_url = 'https://api.themoviedb.org/3/search/tv?' + API_key + '&query=';
const BOLLYWOOD_url = BASE_url + '/discover/movie?' + API_key + '&with_original_language=hi&sort_by=popularity.desc&vote_count.gte=50';
const ANIME_url = BASE_url + '/discover/tv?' + API_key + '&with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=50';
const ANIME_MOVIE_url = BASE_url + '/discover/movie?' + API_key + '&with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=50';

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

// Streaming servers configuration (verified working)
const STREAMING_SERVERS = [
    {
        name: 'VidSrc',
        movie: (id) => `https://vidsrc.cc/embed/movie?tmdb=${id}`,
        tv: (id, s, e) => `https://vidsrc.cc/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    },
    {
        name: 'EmbedMaster',
        movie: (id) => `https://embedmaster.link/movie/${id}`,
        tv: (id, s, e) => `https://embedmaster.link/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidCore',
        movie: (id) => `https://vidcore.org/embed/movie/${id}`,
        tv: (id, s, e) => `https://vidcore.org/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'ezvidapi',
        movie: (id) => `https://ezvidapi.com/embed/movie/${id}`,
        tv: (id, s, e) => `https://ezvidapi.com/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'CineSrc',
        movie: (id) => `https://cinesrc.st/embed/movie/${id}`,
        tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}`
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
let currentSection = 'home'; // home, bollywood, anime
var currentPage = 1;
var nextPage = 2;
var prevPage = 3;
var lastUrl = '';
var totalPages = 100;

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

    // Load appropriate content
    if (section === 'home') {
        let whichPage = localStorage.getItem('page');
        LoadDataAndDisplay();
    } else if (section === 'bollywood') {
        currentSection = 'bollywood';
        LoadMovieOrTv('movie', BOLLYWOOD_url);
    } else if (section === 'anime') {
        currentSection = 'anime';
        LoadMovieOrTv('tv', ANIME_url);
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
    let urlSplit = lastUrl.split('?');
    let queryParameter = urlSplit[1].split('&');
    let key = queryParameter[queryParameter.length - 1].split('=');
    if (key[0] != 'page') {
        let url = lastUrl + '&page=' + page;
        let whichPage = localStorage.getItem('page');
        LoadMovieOrTv(whichPage, url);
    } else {
        key[1] = page.toString();
        let a = key.join('=');
        queryParameter[queryParameter.length - 1] = a;
        let b = queryParameter.join('&');
        let url = urlSplit[0] + '?' + b;
        let whichPage = localStorage.getItem('page');
        LoadMovieOrTv(whichPage, url);
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
    let main = document.querySelector('#main');
    main.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        main.innerHTML += `
        <div class="skeleton-card">
            <div class="skeleton skeleton-poster"></div>
            <div class="skeleton-info">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-rating"></div>
            </div>
        </div>
        `;
    }
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
            main.innerHTML = `
            <h1 style="color: white; text-align: center; padding: 40px;"> WOW! SUCH EMPTY 🙂 </h1>
            `;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        main.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #fff;">
            <h2>⚠️ Failed to load content</h2>
            <p>${error.message}</p>
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

        movieEl.innerHTML = `
        <div>
        <span class="releaseDate">${release_date}</span>
        <img src="${poster_path ? IMG_url + poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'}" alt="${title}">
        </div>
        <div class="movie-info">
        <h3>${title}</h3>
        <span class="rating ${getColor(vote_average)}">${vote_average}</span>
        <button class="favorite-btn" data-id="${id}" data-type="movie" title="Add to favorites">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a4.97 4.97 0 0 0-7.14 0L12 6.01 9.3 3.3a4.97 4.97 0 0 0-7.14 0C.29 6.45 0 8.9 0 11.35c0 3.63 3.28 6.32 8.17 10.87L12 22.3l3.83-3.41c4.89-4.55 8.14-7.24 8.14-10.87 0-2.45-.29-4.9-1.93-6.54z"></path>
            </svg>
        </button>
        </div>
        <div class="overview">
        <span>
        <h3>${title}</h3>
        <span class="overview-content">${overview}</span>
        <br>
        <button class="watchnow" onclick="openStream(${JSON.stringify({...movie, media_type: 'movie'})})">Watch Now</button>
        </span>
        </div>
        `;
        main.appendChild(movieEl);
    });

    // Add favorite button listeners
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const type = btn.dataset.type;
            toggleFavorite(id, type);
        });
    });

    // Update favorite button states
    updateFavoriteButtons();
}

function showTvShows(data) {
    let main = document.querySelector('#main');
    main.innerHTML = '';

    data.forEach(tvshow => {
        const { name, overview, poster_path, vote_average, first_air_date, id } = tvshow;
        const tvEl = document.createElement('div');
        tvEl.classList.add('tvshow');

        tvEl.innerHTML = `
      <div>
      <span class="releaseDate">${first_air_date}</span>
      <img src="${poster_path ? IMG_url + poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'}" alt="${name}">
      </div>
      <div class="movie-info">
      <h3>${name}</h3>
      <span class="rating ${getColor(vote_average)}">${vote_average}</span>
      <button class="favorite-btn" data-id="${id}" data-type="tv" title="Add to favorites">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a4.97 4.97 0 0 0-7.14 0L12 6.01 9.3 3.3a4.97 4.97 0 0 0-7.14 0C.29 6.45 0 8.9 0 11.35c0 3.63 3.28 6.32 8.17 10.87L12 22.3l3.83-3.41c4.89-4.55 8.14-7.24 8.14-10.87 0-2.45-.29-4.9-1.93-6.54z"></path>
          </svg>
      </button>
      </div>
      <div class="overview">
    <h3>${name}</h3>
    <span class="overview-content">${overview}</span>
    <br>
    <button class="watchnow" onclick="openStream(${JSON.stringify({...tvshow, media_type: 'tv'})})">Watch Now</button>
    </span>
   </div>
    `;
        main.appendChild(tvEl);
    });

    // Add favorite button listeners
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

    if (ev.target.value == '') {
        if (currentSection === 'bollywood') {
            LoadMovieOrTv('movie', BOLLYWOOD_url);
        } else if (currentSection === 'anime') {
            LoadMovieOrTv('tv', ANIME_url);
        } else if (whichPage == 'movie') {
            LoadMovieOrTv(whichPage, API_url);
        } else if (whichPage == 'tv') {
            LoadMovieOrTv(whichPage, TV_url);
        }
    } else {
        let searchQuery = ev.target.value;
        if (currentSection === 'bollywood') {
            let url_search = SEARCH_url + searchQuery + '&with_original_language=hi';
            LoadMovieOrTv('movie', url_search);
        } else if (currentSection === 'anime') {
            let url_search = TV_Search_url + searchQuery + '&with_original_language=ja';
            LoadMovieOrTv('tv', url_search);
        } else if (whichPage == 'movie') {
            let url_search = SEARCH_url + searchQuery;
            LoadMovieOrTv(whichPage, url_search);
        } else if (whichPage == 'tv') {
            let url_search = TV_Search_url + searchQuery;
            LoadMovieOrTv(whichPage, url_search);
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
        grid.innerHTML += `
        <div class="movie" onclick="openStream(${JSON.stringify({...item, media_type: item.type})})">
            <img src="${item.poster ? IMG_url + item.poster : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'}" alt="${item.title}">
            <div class="movie-info"><h3>${item.title}</h3></div>
        </div>
        `;
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
        const url = whichPage === 'movie'
            ? BASE_url + '/movie/' + item.id + '?' + API_key
            : BASE_url + '/tv/' + item.id + '?' + API_key;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                grid.innerHTML += `
                <div class="movie" onclick="openStream(${JSON.stringify({...data, media_type: item.type})})">
                    <img src="${data.poster_path ? IMG_url + data.poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'}" alt="${data.title || data.name}">
                    <div class="movie-info"><h3>${data.title || data.name}</h3></div>
                </div>
                `;
                // Update favorite button states
                updateFavoriteButtons();
            })
            .catch(err => console.error('Error loading favorite:', err));
    });
}

// Open streaming modal
function openStream(item) {
    addToHistory(item);

    currentStreamItem = item;
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
        const detailsUrl = BASE_url + '/tv/' + tvId + '?' + API_key;
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
    }
}

async function loadEpisodes(tvId, seasonNum) {
    try {
        const seasonUrl = BASE_url + '/tv/' + tvId + '/season/' + seasonNum + '?' + API_key;
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
    let url;
    if (whichPage === 'movie') {
        url = BASE_url + '/movie/' + item.id + '/videos?' + API_key;
    } else {
        url = BASE_url + '/tv/' + item.id + '/videos?' + API_key;
    }

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

// Initialize after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
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