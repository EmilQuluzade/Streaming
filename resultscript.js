let currentPage = 1;
let currentQuery = '';
let apiBaseUrl = '';

const loadConfig = async () => {
    try {
        const response = await fetch('config.json'); // Ensure this path is correct
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const config = await response.json();
        apiBaseUrl = config.apiBaseUrl;
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Fallback to a hardcoded URL if config.json cannot be loaded
        apiBaseUrl = 'https://animestreaming-d57dbedc63cf.herokuapp.com'; // Replace with your fallback URL
    }
};

const searchAnime = async (page = 1) => {
    const query = encodeURIComponent(document.getElementById('searchQuery').value.trim());
    if (!query) {
        document.getElementById('results').innerHTML = '<p>Please enter a search query.</p>';
        return;
    }

    currentQuery = query;
    currentPage = page;

    const url = `${apiBaseUrl}/anime/gogoanime/${query}?page=${page}`;
    console.log(`Fetching data from: ${url}`); // Debugging: Log the URL

    try {
        const response = await axios.get(url);
        console.log(response.data); // Debugging: Log response data

        const imageMain = document.querySelector('.imagemain');
        if (imageMain) {
            imageMain.style.display = 'none';
        }

        await displayResults(response.data.results); // await the displayResults
        await setupPagination(response.data.totalPages, page); // await the setupPagination
    } catch (err) {
        console.error('Error fetching data:'); // Enhanced error logging
        document.getElementById('results').innerHTML = '<p>Looks Like there was an error, please try again later</p>';
    }
};

const displayResults = async (results) => {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    results.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.className = 'anime-card';
        animeCard.innerHTML = `
            <button onclick="redirectToDetails('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}">
                <h5>${anime.title}</h5>
                <p>Release Date: ${anime.releaseDate}</p>
                <p>Sub or Dub: ${anime.subOrDub}</p>
            </button>
        `;
        fragment.appendChild(animeCard);
    });

    resultsContainer.appendChild(fragment);
};

const setupPagination = async (totalPages, currentPage) => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear previous pagination

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.className = 'pagination-button';
        if (i === currentPage) {
            button.classList.add('active');
            button.disabled = true;
        }
        button.onclick = () => searchAnime(i);
        paginationContainer.appendChild(button);
    }
};

// Function to handle the redirection
const redirectToDetails = async (animeId) => {
    window.location.href = `anime-details.html?anime=${animeId}`;
};

// Add an event listener to trigger the search on Enter key press
document.getElementById('searchQuery').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchAnime();
    }
});

// Auto-trigger the search on page load if a query is present
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig(); // Load configuration
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        document.getElementById('searchQuery').value = query;
        await searchAnime(); // await the searchAnime
    }
});
