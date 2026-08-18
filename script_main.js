const API_key = 'api_key=4b153b123319df27bb67fcbfe219537d';
const BASE_url = 'https://api.themoviedb.org/3';
const API_url = BASE_url + '/discover/movie?sort_by=popularity.desc&' + API_key;
const IMG_url = 'https://image.tmdb.org/t/p/w500'
const SEARCH_url = 'https://api.themoviedb.org/3/search/movie?api_key=4b153b123319df27bb67fcbfe219537d&query='
const TV_url = BASE_url + '/tv/popular?' + API_key + '&vote_count.gte=100';
const TV_Search_url = 'https://api.themoviedb.org/3/search/tv?' + API_key + '&query='

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
]

window.addEventListener("DOMContentLoaded", (ev) => {
    let main = document.querySelector('#main');

    setGenres();

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

    const prev = document.getElementById("prev")
    const current = document.getElementById("current")
    const next = document.getElementById("next")

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
});

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

let selectedGenre = []
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
                    })
                } else {
                    selectedGenre.push(genre.id);
                }
            }

            let newurl = API_url + '&with_genres=' + encodeURI(selectedGenre.join(','));
            let whichPage = localStorage.getItem('page');
            LoadMovieOrTv(whichPage, newurl)
            highlightSelection();
        })

        tags_el.append(t);
    })
}

const manageIcons = () => {
    const tagsEl = document.getElementById('tags');
    const leftArrowContainer = document.querySelector(".scrollable-tabs-container .left-arrow")
    const rightArrowContainer = document.querySelector(".scrollable-tabs-container .right-arrow")

    if (tagsEl.scrollLeft >= 20) {
        leftArrowContainer.classList.add("active")
    } else {
        leftArrowContainer.classList.remove("active")
    }
    let maxScrollValue = tagsEl.scrollWidth - tagsEl.clientWidth - 20;

    if (tagsEl.scrollLeft >= maxScrollValue) {
        rightArrowContainer.classList.remove("active")
    } else {
        rightArrowContainer.classList.add("active");
    }
}

function highlightSelection() {
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.classList.remove('active')
    })
    if (selectedGenre.length != 0) {
        selectedGenre.forEach(id => {
            const highlightedTag = document.getElementById(id);
            highlightedTag.classList.add('active');
        })
    }
}

var currentPage = 1;
var nextPage = 2;
var prevPage = 3;
var lastUrl = '';
var totalPages = 100;

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
        let url = urlSplit[0] + '?' + b
        let whichPage = localStorage.getItem('page');
        LoadMovieOrTv(whichPage, url);
    }
}

function LoadDataAndDisplay() {
    let whichPage = localStorage.getItem('page');
    let main = document.querySelector('#main');
    main.innerHTML = ' ';

    if (whichPage == 'movie') {
        LoadMovieOrTv(whichPage, API_url)
    } else if (whichPage == 'tv') {
        LoadMovieOrTv(whichPage, TV_url)
    }
}

async function LoadMovieOrTv(whichPage, url) {
    lastUrl = url;
    let main = document.querySelector('#main');
    let res = await fetch(url);
    let data = await res.json();

    if (data.results.length !== 0) {
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
            prev.classList.add('disabled')
            next.classList.remove('disabled')
        } else if (currentPage >= totalPages) {
            prev.classList.remove('disabled')
            next.classList.add('disabled')
        } else {
            prev.classList.remove('disabled')
            next.classList.remove('disabled')
        }
    } else {
        main.innerHTML = `
        <h1 style = "color: white;"> WOW! SUCH EMPTY 🙂 </h1>
        `
    }
}

function showMovies(data) {
    let main = document.querySelector('#main');
    main.innerHTML = ' ';

    data.forEach(movie => {
        const { title, poster_path, vote_average, overview, release_date, id } = movie;
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');

        movieEl.innerHTML = `
        <div>
        <span class="releaseDate"> ${release_date} </span>
        <img src="${poster_path ? IMG_url + poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'}" alt="${title}">
        </div>
        <div class="movie-info">
        <h3>${title}</h3>
      <span class="${getColor(vote_average)}">${vote_average}</span>
        </div>
        <div class="overview">
        <span>
      <h3>${title}</h3>
      <span class="overview-content">
      ${overview}
      </span>
      <br>
      <button class="watchnow" data-id='${JSON.stringify(movie).replace(/'/g, "&#39;")}'>Watch Now</button>
      </span>
    </div>
    `
        main.appendChild(movieEl)

        movieEl.querySelector('.watchnow').addEventListener('click', (e) => {
            e.stopPropagation();
            openStream(movie);
        })
    })
}

function showTvShows(data) {
    let main = document.querySelector('#main');
    main.innerHTML = ' ';

    data.forEach(tvshow => {
        const { name, overview, poster_path, vote_average, first_air_date, id } = tvshow;
        const tvEl = document.createElement('div');
        tvEl.classList.add('tvshow');

        tvEl.innerHTML = `
      <div>
      <span class="releaseDate"> ${first_air_date} </span>
      <img src="${poster_path ? IMG_url + poster_path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfpnrrw7q4mQEeICRY-v-Nx_hfzEwDLrUtog&usqp=CAU'}" alt="${name}">
      </div>
      <div class="movie-info">
      <h3>${name}</h3>
    <span class="${getColor(vote_average)}">${vote_average}</span>
      </div>
      <div class="overview">
    <h3>${name}</h3>
    <span class="overview-content">
    ${overview}
    </span>
    <br>
    <button class="watchnow" data-id='${JSON.stringify(tvshow).replace(/'/g, "&#39;")}'>Watch Now</button>
    </span>
   </div>
    `
        main.appendChild(tvEl)

        tvEl.querySelector('.watchnow').addEventListener('click', (e) => {
            e.stopPropagation();
            openStream(tvshow);
        })
    })
}

function getColor(vote) {
    if (vote >= 7) {
        return 'green'
    } else if (vote >= 5) {
        return 'orange'
    } else {
        return 'red'
    }
}

function searchResultsAndDisplayWrapper(ev) {
    let whichPage = localStorage.getItem('page');

    if (ev.target.value == '') {
        if (whichPage == 'movie') {
            LoadMovieOrTv(whichPage, API_url);
        } else if (whichPage == 'tv') {
            LoadMovieOrTv(whichPage, TV_url);
        }
    } else {
        if (whichPage == 'movie') {
            let url_search = SEARCH_url + ev.target.value;
            LoadMovieOrTv(whichPage, url_search);
        } else if (whichPage == 'tv') {
            let url_search = TV_Search_url + ev.target.value;
            LoadMovieOrTv(whichPage, url_search);
        }
    }
}

function searchAndDisplay(func, delay) {
    let timer;
    return function () {
        let context = this,
            arg = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, arguments);
        }, delay)
    }
}

const searchStart = searchAndDisplay(searchResultsAndDisplayWrapper, 900);

// Streaming servers configuration
const STREAMING_SERVERS = [
    {
        name: 'SuperEmbed (HD)',
        movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
        tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    {
        name: 'VidSrc',
        movie: (id) => `https://vidsrc.cc/embed/movie?tmdb=${id}`,
        tv: (id, s, e) => `https://vidsrc.cc/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    },
    {
        name: 'YapGrid (Ad-free)',
        movie: (id) => `https://yapgrid.com/embed/movie/${id}`,
        tv: (id, s, e) => `https://yapgrid.com/embed/tv/${id}/${s}/${e}`
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
    }
];

let currentStreamItem = null;
let currentServerIndex = 0;

// Open streaming modal
function openStream(item) {
    currentStreamItem = item;
    currentServerIndex = 0;
    const modal = document.getElementById('streamModal');
    const title = document.getElementById('streamTitle');
    const whichPage = localStorage.getItem('page');

    title.textContent = whichPage === 'movie' ? item.title || item.name : item.name;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    loadServer(0);
    loadTrailer(item);
}

// Load streaming server
function loadServer(index) {
    currentServerIndex = index;
    const frame = document.getElementById('streamFrame');
    const errorMsg = document.getElementById('serverError');
    const whichPage = localStorage.getItem('page');
    const server = STREAMING_SERVERS[index];

    let url;
    if (whichPage === 'movie') {
        url = server.movie(currentStreamItem.id);
    } else {
        url = server.tv(currentStreamItem.id, 1, 1);
    }

    frame.src = url;
    errorMsg.style.display = 'none';
    frame.style.display = 'block';

    // Hide error message when new server loads
    frame.onerror = () => {
        errorMsg.style.display = 'block';
    };

    // Update active tab
    document.querySelectorAll('.server-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
}

// Load trailer
async function loadTrailer(item) {
    const whichPage = localStorage.getItem('page');
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
        frame.src = `https://www.youtube.com/embed/${key}`;
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

    modal.classList.remove('active');
    streamFrame.src = '';
    streamFrame.style.display = 'block';
    trailerFrame.src = '';
    trailerPlayer.style.display = 'none';
    trailerBtn.textContent = 'Watch Trailer';
    errorMsg.style.display = 'none';
    document.body.style.overflow = '';
}

// Initialize server tab clicks
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.server-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const serverIndex = parseInt(tab.dataset.server);
            loadServer(serverIndex);
        });
    });

    // Language selector
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        const lang = e.target.value;
        const frame = document.getElementById('streamFrame');
        const currentSrc = frame.src;
        if (currentSrc) {
            frame.src = currentSrc + '&lang=' + lang;
        }
    });
});
