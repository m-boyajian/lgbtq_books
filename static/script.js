// Main script and container for the genre-container

import { colorizeLetters } from './randomColor.js';
import { genres, icons, createSVGIcon } from './genre_tiles.js';
import { initializeGenreContainer } from './genreContainer.js';

colorizeLetters();

let userId;

$(document).ready(function () {
  // gnere tile container begins here
  // Clears genreName in session storage if user goes back to homepage
  if (window.location.pathname === '/') {
    sessionStorage.clear();
  }

  userId = document.getElementById('user-id').getAttribute('data-user-id');

  const genreContainer = document.getElementById("genre-container");

  if (genreContainer) {

    genres.forEach((genreItem, index) => {
      const tile = document.createElement("div");
      tile.classList.add("genre-tile");

      // Creates image element for the MDI icon
      const icon = createSVGIcon(icons[index]);
      icon.classList.add("icon");

      const link = document.createElement("a");
      link.classList.add("genre-link");
      // Set the value of the genre variable
      const genreName = genreItem.name;
      link.href = `/genre?genre=${encodeURIComponent(genreName.toLowerCase().replace('/', '_'))}`;

      // Creates image element for the genre image
      const genreImage = document.createElement("img");
      genreImage.src = genreItem.image;

      const name = document.createElement("p");
      name.textContent = genreName;

      tile.appendChild(icon);
      tile.appendChild(genreImage);
      tile.appendChild(name);
      tile.appendChild(link);

      genreContainer.appendChild(tile);

      link.addEventListener("click", async function (event) {
        event.preventDefault();
      
        let clickedGenre;  
          
        try {
          // Store the clicked genre information in sessionStorage
          clickedGenre = genreName.toLowerCase().replace(/\//g, "_");
          sessionStorage.setItem('clickedGenre', clickedGenre);
      
          // Dispatch the custom event with the clicked genre
          const genreClickEvent = new CustomEvent("genreClicked", { detail: { genre: clickedGenre } });
          document.dispatchEvent(genreClickEvent);
      
          // Redirect to the genre page
          window.location.href = `/genre/${encodeURIComponent(clickedGenre.toLowerCase().replace('/', '_'))}`;
        } catch (error) {
        } 
      });      
    });
  }
  // Book container logic begins here
  let currentPage = 1;
  const booksPerPage = 12;
  const maxResults = 40;
  let startIndex = 0;
  let searchData;
  let cachedSearchResults = {};

  const bookContainer = document.getElementById("book-container");
  if (bookContainer) {
    bookContainer.innerHTML = "";

    function formatCard(coverUrl, title, author, publisher, previewLink, isFavorite) {

      const cardContainer = document.createElement('div');
      cardContainer.classList.add('card');

      const img = document.createElement('img');
      img.src = coverUrl;
      img.classList.add('card-img-top');
      img.alt = 'Book Image';
      cardContainer.appendChild(img);

      const cardBody = document.createElement('div');
      cardBody.classList.add('card-body');

      const cardTitle = document.createElement('h5');
      cardTitle.classList.add('card-title');
      cardTitle.textContent = title;
      cardBody.appendChild(cardTitle);

      const authorText = document.createElement('p');
      authorText.classList.add('card-text', 'author-text');
      authorText.textContent = 'Author: ' + author;
      cardBody.appendChild(authorText);

      const publisherText = document.createElement('p');
      publisherText.classList.add('card-text');
      publisherText.textContent = 'Publisher: ' + publisher;
      cardBody.appendChild(publisherText);

      const readButton = document.createElement('a');
      readButton.href = previewLink;
      readButton.classList.add('read-button');
      readButton.textContent = 'Read Book';
      readButton.target = '_blank';
      cardBody.appendChild(readButton);

      const favoriteButton = document.createElement('button');
      favoriteButton.classList.add('favorite-button');
      favoriteButton.dataset.title = title;
      favoriteButton.dataset.favorite = isFavorite;

      const outlineStar = document.createElement('img');
      outlineStar.classList.add('outline-star');
      outlineStar.src = '/static/star-regular.svg';
      outlineStar.alt = 'Outline Star';
      outlineStar.style.display = isFavorite ? 'none' : 'block';

      const solidStar = document.createElement('img');
      solidStar.classList.add('solid-star');
      solidStar.src = '/static/star-solid.svg';
      solidStar.alt = 'Solid Star';
      solidStar.style.display = isFavorite ? 'block' : 'none';
      favoriteButton.appendChild(outlineStar);
      favoriteButton.appendChild(solidStar);
      cardBody.appendChild(favoriteButton);

      cardContainer.appendChild(cardBody);

      return cardContainer;
    } 

    let bookCards;

    // All event handlers for book search container
    $("#search").click(async function () {
      bookContainer.innerHTML = ""; 
      searchData = $("#search-box").val().trim();

      if (searchData === "") {
          displayError();
      } else {
          try {
              // Check if search results are already cached
              if (cachedSearchResults[searchData]) {
                  // Retrieve from cache
                  bookCards = cachedSearchResults[searchData];
              } else {
                  // Fetch new search results
                  const books = await fetchBooks(searchData, maxResults, startIndex);
                  bookCards = await createBookCards(books);
                  // Cache the search results
                  cachedSearchResults[searchData] = bookCards; 
              }
              
              // Display the first page of search results
              displayBooks(bookCards, 0, booksPerPage, currentPage);
              
              history.pushState(null, null, `?page=1`);
          } catch (error) {
          }

          $("#next-button").show();
      }
      $("#search-box").val("");
    });

    async function fetchBooks(query, maxResults, startIndex) {

      // Check if search results are already cached
      if (cachedSearchResults[query]) {
          const startIndexInCache = startIndex % booksPerPage; 
          const endIndexInCache = startIndexInCache + maxResults; 
          const cachedBooks = cachedSearchResults[query].slice(startIndexInCache, endIndexInCache);
          return cachedBooks;
      }

      const bookUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&max_results=${maxResults}&start_index=${startIndex}`;

      try {
          const response = await axios.get(bookUrl);

          if (response.data && response.data.items) {
              const books = response.data.items;
              return books;
          } else {
              return [];
          }
      } catch (error) {
          return [];
      }
    }

    async function createBookCards(books, userId) {
      // Check if the user is authenticated
      if (userId) {
          const favoriteStatuses = await getFavorites(userId);

          return books.map(book => {
              const title = book.volumeInfo.title;
              const author = book.volumeInfo.authors ? book.volumeInfo.authors[0] : "Unknown Author";
              const publisher = book.volumeInfo.publisher || "Unknown Publisher";
              const coverUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "";
              const isFavorite = favoriteStatuses.some(favBook => favBook.title === title);

              return formatCard(
                  coverUrl,
                  title,
                  author,
                  publisher,
                  book.volumeInfo.previewLink,
                  isFavorite
              );
          });
      } else {
          // User is not authenticated, return cards without checking favorites
          return books.map(book => {
              const title = book.volumeInfo.title;
              const author = book.volumeInfo.authors ? book.volumeInfo.authors[0] : "Unknown Author";
              const publisher = book.volumeInfo.publisher || "Unknown Publisher";
              const coverUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "";
              const isFavorite = false; 

              return formatCard(
                  coverUrl,
                  title,
                  author,
                  publisher,
                  book.volumeInfo.previewLink,
                  isFavorite
              );
          });
        }
    }


    function displayBooks(bookCards, startIndex, endIndex) {
      bookContainer.innerHTML = ""; 
    
      for (let i = startIndex; i < endIndex; i++) {
        bookContainer.appendChild(bookCards[i]);
      }
      $(".book-list").css("visibility", "visible");
    }   

    function getFavorites(userId) {
      return new Promise((resolve, reject) => {
          $.ajax({
              url: `/users/${userId}/favorites`,
              type: 'GET',
              success: function(response) {
                  resolve(response.favorite_books);
              },
              error: function(error) {
                  reject(error);
              }
          });
      });
    }

    function addFavorite(userId, title) {
      
      return new Promise((resolve, reject) => {
        $.ajax({
          url: `/users/${userId}/favorites/add`, 
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ title: title }),
          success: function (response) {
            alert("Book successfully added!");
            resolve(response);
          },
          error: function (error) {
            reject(error);
          }
        });
      });
    }

    function removeFavorite(userId, title) {
      return new Promise((resolve, reject) => {
          $.ajax({
              url: `/users/${userId}/favorites/remove`, 
              type: 'DELETE',  
              contentType: 'application/json',
              data: JSON.stringify({ title: title }),
              success: function (response) {
                  alert("Book successfully removed!");
                  resolve(response);
              },
              error: function (error) {
                  alert("Problem removing book!");
                  reject(error);
              }
          });
      });
    }

    // Attach a single event listener to the container for the favorite button
    document.querySelector("#book-container").addEventListener("click", async (event) => {
      const button = event.target.closest(".favorite-button");
      if (!button) return;  // Ignore clicks that aren't on buttons

      const title = button.dataset.title;
      let isFavorite = button.dataset.favorite === "true";

      try {
          if (isFavorite) {
              await removeFavorite(userId, title);
              const index = bookCards.findIndex(card => card.dataset.title === title);
              if (index !== -1) {
                // Remove the card from the bookCards array
                bookCards.splice(index, 1);
                // Update the display
                displayBooks(bookCards, startIndex, endIndex);
            }
              button.dataset.favorite = "false";
          } else {
              await addFavorite(userId, title);
              button.dataset.favorite = "true";
          }

          isFavorite = button.dataset.favorite === "true"; // Update isFavorite from the dataset

          // Toggle the display of the stars
          const outlineStar = button.querySelector(".outline-star");
          const solidStar = button.querySelector(".solid-star");
          outlineStar.style.display = isFavorite ? "none" : "block";
          solidStar.style.display = isFavorite ? "block" : "none";
      } catch (error) {
      }
    });

    const total_pages = parseInt($("#container").data("total-pages"));
    // Event listener for the "Next" button
    $("#next-button").click(function () {
      event.preventDefault();
      startIndex += booksPerPage; 
      currentPage++;
      
      const endIndex = Math.min(startIndex + booksPerPage, cachedSearchResults[searchData].length);
      displayBooks(cachedSearchResults[searchData], startIndex, endIndex);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('page', currentPage);
      history.pushState(null, null, newUrl);
      
      // Hide the "Next" button if we are on the last page
      if (currentPage >= total_pages) {
          $("#next-button").hide();
      }
      $("#prev-button").show();
    });

    // Event listener for the "Previous" button
    $("#prev-button").click(function () {
        event.preventDefault();
        startIndex -= booksPerPage;
        currentPage--;

        const endIndex = Math.min(startIndex + booksPerPage, cachedSearchResults[searchData].length);
        displayBooks(cachedSearchResults[searchData], startIndex, endIndex);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('page', currentPage);
        history.pushState(null, null, newUrl);

        // Hide the "Previous" button if we are on the first page
        if (currentPage <= 1) {
            $("#prev-button").hide();
        }

        $("#next-button").show();
    });
  }
});

initializeGenreContainer();
