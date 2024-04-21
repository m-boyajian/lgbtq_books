// genreCardContainer logic

import { currentPage, booksPerPage, maxResults, startIndex } from './common.js';
const cached_books_data = {};

export function initializeGenreContainer() {
  $(document).ready(function () {
    console.log("DOM is ready");
    
    // Container for the genre-card-container
    const genreCardContainer = document.getElementById("genre-card-container");
    console.log("Genre card container found.", genreCardContainer)

    // Get the clicked genre from session storage
    const clickedGenre = sessionStorage.getItem('clickedGenre');
    console.log("Genre name", clickedGenre);
    // Listen for the custom event 'genreClicked'
    document.addEventListener("genreClicked", async function(event) {
      const clickedGenre = event.detail.genre;
      console.log("Genre clicked:", clickedGenre);
      // Call the function to fetch and display books for the clicked genre
      await fetchAndDisplayBooks(clickedGenre);
    });

    // Function to fetch and display books for the clicked genre
    async function fetchAndDisplayBooks(clickedGenre) {
      // Make API request to fetch books for the clicked genre
      const books = await fetchBooks(clickedGenre, maxResults, startIndex, cached_books_data);
      // Display the fetched books
      displayGenreBooks(books);
    }

    // Function to make API request to fetch books for a genre
    async function fetchBooks(clickedGenre, maxResults, startIndex, cached_books_data, booksPerPage) {
      // API request URL
      const bookUrl = `/fetch_books_by_genre/${clickedGenre}?&max_results=${maxResults}&start_index=${startIndex}`;
      console.log("API Request URL:", bookUrl);

      try {
          const response = await axios.get(bookUrl);
          console.log("API Response:", response);

          console.log("Data retrieved from the API:", response.data);

          const books = response.data.items;
          console.log("Number of books received:", books.length);

          // Store the fetched data in the cached_books_data array
          cached_books_data[clickedGenre] = books;
          console.log("cached_books_data after storing:", cached_books_data);

          return books;
      } catch (error) {
          console.error("API Request Error:", error);
          return [];
      }
    }

    // Function to display books for the clicked genre
    async function displayGenreBooks(books) {
      // Check if genre card container exists
      if (!genreCardContainer) {
        console.error("Genre card container not found");
        return;
      }

      // Clear previous content before adding new content
      genreCardContainer.innerHTML = "";

      // Display each book in the container
      for (const book of books) {
        const title = book.volumeInfo.title;
        const author = book.volumeInfo.authors ? book.volumeInfo.authors[0] : "Unknown Author";
        const publisher = book.volumeInfo.publisher || "Unknown Publisher";
        const coverUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "";
        const isFavorite = await checkIfBookIsFavorite(title);

        // Create genre book card
        const genreBookCard = formatGenreCard(
          coverUrl,
          title,
          author,
          publisher,
          book.volumeInfo.previewLink,
          isFavorite
        );

        // Add book card to container
        genreCardContainer.appendChild(genreBookCard);
      }

      // Add event listeners for favorites
      addEventListenerForFavorites(user_id, genreCardContainer.querySelectorAll(".favorite-button"));
      // Make the genre card container visible
      genreCardContainer.style.visibility = "visible";
    }

    document.addEventListener("genreClicked", async function(event) {
      const clickedGenre = event.detail.genre;
      console.log("Genre clicked:", clickedGenre);
      const books = await fetchBooks(clickedGenre, maxResults, startIndex, cached_books_data);
      displayGenreBooks(books);
    });

    function formatGenreCard(coverUrl, title, author, publisher, previewLink, isFavorite) {
      console.log('Received parameters in formatGenreCard:', coverUrl, title, author, publisher, previewLink, isFavorite);
      
      const cardContainer = document.createElement('div');
      cardContainer.classList.add('card');

      const img = document.createElement('img');
      img.src = coverUrl;
      img.classList.add('card-img-top');
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

    // Event listener for the "Next" button
    $("#next-button").click(async function () {
      console.log("Next button clicked");
      console.log("Clicked Genre:", clickedGenre);
      console.log("Cached Books Data", cached_books_data);
      console.log("Start Index", startIndex);
      console.log("Books per page", booksPerPage);

      const books = cached_books_data[clickedGenre];

      // Check if there are more books to display on the next page
      if (books && startIndex + booksPerPage < books.length) {
        const nextStartIndex = startIndex + booksPerPage; 
        currentPage++; 

        // Fetch the next set of books
        const fetchedBooks = await fetchBooks(clickedGenre, booksPerPage, nextStartIndex, cached_books_data);

        // Display the next set of books
        await displayGenreBooks(fetchedBooks);
        console.log("Books passed to displayGenreBooks:", fetchedBooks);
      }
    });

    // Event listener for the "Previous" button
    $("#prev-button").click(async function () {
      console.log("Previous button clicked");
      console.log("Clicked Genre:", clickedGenre);

      // Retrieve the stored books for the current genre
      const books = cached_books_data[clickedGenre];

      // Check if there are previous books to display
      if (books && startIndex - booksPerPage >= 0) {
        const prevStartIndex = startIndex - booksPerPage;

        // Fetch the previous set of books
        const fetchedBooks = await fetchBooks(clickedGenre, booksPerPage, prevStartIndex, cached_books_data);

        // Update the startIndex for the previous page
        startIndex = prevStartIndex;

        // Display the previous set of books
        await displayGenreBooks(fetchedBooks);
        console.log("Books passed to displayGenreBooks:", fetchedBooks);
      }
    });

    async function addEventListenerForFavorites(user_id, genreBookCards) {
      for (const card of genreBookCards) {
        const button = card.querySelector(".favorite-button");
        button.addEventListener("click", async () => {
          const title = card.dataset.title;
          const isFavorite = button.dataset.favorite === "true";

          console.log("Star clicked for book:", title);
          console.log("Is favorite (before async operations):", isFavorite);
          console.log("User ID:", user_id);

          try {
              // Check if the book is currently a favorite
              const retrievedGenreBookCard = await getGenreBookCardByTitle(title, genreBookCards);

              // Toggle the favorite status asynchronously
              if (isFavorite) {
                  // Remove the book from favorites.
                  console.log("Removing from favorites - Title:", title, "User ID:", user_id, "Is Favorite:", isFavorite);
                  removeBookFromFavorites(user_id, retrievedGenreBookCard);
              } else {
                  // Add the book to favorites.
                  console.log("Adding to favorites - Title:", title, "User ID:", user_id, "Is Favorite:", isFavorite);
                  addBookToFavorites(user_id, retrievedGenreBookCard);
              }

              // Update the UI based on the updated favorite status
              const updatedIsFavorite = !isFavorite;
              button.dataset.favorite = updatedIsFavorite ? "true" : "false";
              const outlineStar = button.querySelector(".outline-star");
              const solidStar = button.querySelector(".solid-star");
              if (outlineStar && solidStar) {
                  outlineStar.style.display = updatedIsFavorite ? "inline-block" : "none";
                  solidStar.style.display = updatedIsFavorite ? "none" : "inline-block";
              }

              console.log("Is favorite (after async operations):", updatedIsFavorite);
              console.log("Current favorites after update:");
              checkCurrentFavorites();
          } catch (error) {
              console.error("Error updating favorite status:", error);
          }
        });
      }
    }

    function checkIfBookIsFavorite(title) {
      return new Promise((resolve, reject) => {
        console.log("Checking if book is a favorite:", title);
        // Use AJAX to send a request to the server to check if the book is a favorite
        $.ajax({
          url: `/check_favorite?title=${title}`, 
          type: 'GET',
          success: function (data) {
            // The server should return {'is_favorite': true} or {'is_favorite': false} as a response
            const isFavorite = data.is_favorite;
            resolve(isFavorite);
          },
          error: function () {
            
            reject();
          }
        });
      });
    }   
    
    // Make the AJAX request to add the book to favorites
    function addBookToFavorites(user_id, retrievedGenreBookCard) {
      if (!retrievedGenreBookCard) {
        console.error('genreBookCard is not defined');
        return;
      }
      // Debugging: Log the type of retrievedGenreBookCard
      console.log('Type of retrievedGenreBookCard:', typeof retrievedGenreBookCard);

      // Debugging: Log the keys and methods of retrievedGenreBookCard
      console.log('Keys and methods of retrievedGenreBookCard:', Object.keys(retrievedGenreBookCard));
      // Extract information from retrievedGenreBookCard
      const title = retrievedGenreBookCard.title;
      console.log("Title", title);
    
      // Create data object
      const data = {
        user_id: user_id,
        title: title || 'No Title',
      };
      console.log('Sending data:', data);
    
      const addFavoritesUrl = '/add_to_favorites';
      // Make the AJAX request
      $.ajax({
        url: addFavoritesUrl,
        type: 'POST',
        contentType: 'application/json',  // Set content type header
        data: JSON.stringify(data),  // Convert data to JSON string
        success: function (data) {
          console.log('Success response:', data);
          // Handle the success response
        },
        error: function (error) {
          console.error('Error:', error);
          // Handle the error or display an error message
        },
        complete: function () {
          console.log('AJAX request completed.');
        }
      });
    }    
    
    // AJAX function to remove a book from favorites
    function removeBookFromFavorites(user_id, retrievedGenreBookCard) {
      // Extract information from retrievedGenreBookCard
      const title = retrievedGenreBookCard.isBookFavorite();  

      $.ajax({
        url: '/remove_from_favorites',
        type: 'POST',
        data: {
          user_id: user_id,
          title: title,
        },
        success: function (data) {
          // Handle the success response (e.g., book removed from favorites)
        },
        error: function () {
          // Handle the error or display an error message
        }
      });
    }

    // Function to retrieve genreBookCard by title
    async function getGenreBookCardByTitle(title, genreBookCards) {
      // Simulate an asynchronous operation, replace this with your actual logic
      return new Promise((resolve, reject) => {
        // Simulate some delay
        setTimeout(() => {
          // Loop through the array to find the card with a matching title
          for (const genreBookCard of genreBookCards) {
            if (genreBookCard.getTitle() === title) {
              console.log("Resolved: ", genreBookCard);
              resolve(genreBookCard);
              return;
            }
          }
          console.log("Rejected: null"); 
          reject(null);
        }, 500); 
      });
    }
  });
}
//   // Function to log the current favorites
//   function fetchFavoriteBooks() {
//     // Use AJAX to get the current list of favorites from the server
//     $.ajax({
//       url: '/fetch_favorite_books',
//       type: 'GET',
//       success: function (data) {
//         console.log("Current Favorites:", data);
//       },
//       error: function () {
//         console.error("Error fetching current favorites");
//       }
//     });
//   } 
