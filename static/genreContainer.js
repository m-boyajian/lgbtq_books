// genreCardContainer logic

const cached_books_data = {};
let userId;
let currentPage = 1;
const booksPerPage = 12;
const maxResults = 40;
let startIndex = 0;

export function initializeGenreContainer() {
  let genreCardContainer;
  $(document).ready(function () {
    // Logic for the genre-card-container begins here
    userId = document.getElementById('user-id').getAttribute('data-user-id');
    genreCardContainer = document.getElementById("genre-card-container");

    // Get the clicked genre from session storage
    const clickedGenre = sessionStorage.getItem('clickedGenre');
    
    document.addEventListener("genreClicked", async function(event) {
      // Get the clicked genre from the event
      const clickedGenre = event.detail.genre;
      await fetchBooks(clickedGenre, maxResults, startIndex, cached_books_data);
      await displayGenreBooks(books);
    });

    function formatGenreCard(coverUrl, title, author, publisher, previewLink, isFavorite) {   
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

    // Function to make API request to fetch books for a genre
    async function fetchBooks(clickedGenre, maxResults, startIndex, cached_books_data) {
      // API request URL
      const bookUrl = `/fetch_genre/${clickedGenre}?&max_results=${maxResults}&start_index=${startIndex}`;

      try {
        const response = await axios.get(bookUrl);

        if (response.data && response.data.items) {
          const books = response.data.items;

          // Store the fetched data in the cached_books_data array
          cached_books_data[clickedGenre] = books;

          await displayGenreBooks(books);
          
          return books;
        } else {
          return [];
        }
      } catch (error) {
        return [];
      }
    }

    let genreBookCards = [];

    // Function to display books for the clicked genre
    async function displayGenreBooks(books, genreCardContainer) {
      
      // Check if genre card container exists
      if (!genreCardContainer) {
        return;
      }
      
      // Clear previous content before adding new content
      genreCardContainer.innerHTML = "";
    
      // Fetch all favorite statuses for the user
      const favoriteStatuses = await getFavorites(userId);
      genreBookCards = [];
    
      // Display each book in the container
      for (const book of books) {
        const title = book.volumeInfo.title;
        const author = book.volumeInfo.authors ? book.volumeInfo.authors[0] : "Unknown Author";
        const publisher = book.volumeInfo.publisher || "Unknown Publisher";
        const coverUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "";
        const isFavorite = favoriteStatuses.some(favBook => favBook.title === title);
    
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
        // Push the genre book card to the array
        genreBookCards.push(genreBookCard);
      }
     
      // Make the genre card container visible
      genreCardContainer.style.visibility = "visible";
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
            reject([]);
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
                  resolve(response);
              },
              error: function (error) {
                alert("Book successfully removed!");
                reject(error);
              }
          });
      });
    }

    try{
      // Attach a single event listener to the container
      document.querySelector("#genre-card-container").addEventListener("click", async (event) => {
        const button = event.target.closest(".favorite-button");
        if (!button) return;  // Ignore clicks that aren't on buttons

        if (!userId) {
          // If user is not logged in, show alert message
          alert("You must create an account to favorite a book!");
          return;
        }

        const title = button.dataset.title;
        let isFavorite = button.dataset.favorite === "true";

        try {
            if (isFavorite) {
                await removeFavorite(userId, title);
                button.dataset.favorite = "false";
            } else {
                await addFavorite(userId, title);
                button.dataset.favorite = "true";
            }

            isFavorite = button.dataset.favorite === "true"; 

            // Toggle the display of the stars
            const outlineStar = button.querySelector(".outline-star");
            const solidStar = button.querySelector(".solid-star");
            outlineStar.style.display = isFavorite ? "none" : "block";
            solidStar.style.display = isFavorite ? "block" : "none";
        } catch (error) {
        }
      });
    } catch (error) {
  }
  
    // Event listener for the "Next" button
    $("#next-button").click(async function () {
      const books = cached_books_data[clickedGenre];

      // Check if there are more books to display on the next page
      if (books && startIndex + booksPerPage < books.length) {
        const nextStartIndex = startIndex + booksPerPage; 
        currentPage++; 

        // Fetch the next set of books
        const fetchedBooks = await fetchBooks(clickedGenre, booksPerPage, nextStartIndex, cached_books_data);

        // Display the next set of books
        await displayGenreBooks(fetchedBooks);
      }
    });

    // Event listener for the "Previous" button
    $("#prev-button").click(async function () {
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
      }
    });
  });
}


