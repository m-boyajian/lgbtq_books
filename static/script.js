// Script for h1 title animation

function randomRGB() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
  }
  
  const letters = document.querySelectorAll('.letter');

  console.log("Letters selected:", letters);
  
  setInterval(function () {
    for (let letter of letters) {
      letter.style.color = randomRGB();
    }
  }, 1000);

const apiKey = "AIzaSyABwXgHtTnZQ0Y4eZcNuknYiLAL7Epynyw";
const baseBookUrl = `https://www.googleapis.com/books/v1/volumes?key=${apiKey}`;

// Function to create an SVG icon element
function createSVGIcon(iconPath) {
  const svgIcon = document.createElement("img");
  svgIcon.src = iconPath;
  return svgIcon;
}

// Array of genres with corresponding images and icons
const genres = [  
  { name: "Romance", image: staticUrl + "romance.png" },
  { name: "Sci-Fi", image: staticUrl + "fantasy.png" },
  { name: "History", image: staticUrl + "history.png" },
  { name: "Self-Help", image: staticUrl + "self-care.png" },
  { name: "Mystery", image: staticUrl + "mystery.png" },
  { name: "Fiction", image: staticUrl + "fiction.png" },
];
// svg icon imports
const icons = [
  "/static/svg-icons/fire.svg",
  "/static/svg-icons/ufo-outline.svg",
  "/static/svg-icons/bullhorn-variant-outline.svg",
  "/static/svg-icons/handshake-outline.svg",
  "/static/svg-icons/magnify.svg",
  "/static/svg-icons/book-open-blank-variant.svg",
];

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOMContentLoaded event fired");

  const genreCardContainer = document.getElementById("genre-card-container");
  console.log("Genre card container found", genreCardContainer);
  const genreContainer = document.getElementById("genre-container");
  console.log("After genreContainer creation", genreContainer);

  let genreName; 

  if (genreContainer) {
    console.log("Genre container found: ", genreContainer);

    genres.forEach((genreItem, index) => {
      const tile = document.createElement("div");
      tile.classList.add("genre-tile");

      // Creates image element for the MDI icon
      const icon = createSVGIcon(icons[index]);
      icon.classList.add("icon");

      const link = document.createElement("a");
      link.classList.add("genre-link");
      link.href = `${genreItem.name.toLowerCase().replace(/\//g, "_")}`;

      // Creates image element for the genre image
      const genreImage = document.createElement("img");
      genreImage.src = genreItem.image;

      // Set the value of the genre variable
      genreName = genreItem.name;

      const name = document.createElement("p");
      name.textContent = genreItem.name;

      tile.appendChild(icon);
      tile.appendChild(genreImage);
      tile.appendChild(name);
      tile.appendChild(link);

      genreContainer.appendChild(tile);

      link.addEventListener("click", async function (event) {
        event.preventDefault();
        console.log("Clicked on genre: " + genreItem.name);

        let clickedGenre;  
        try {
          clickedGenre = genreItem.name.toLowerCase().replace(/\//g, "_");
          startIndex = 0;
      
          // Add event listeners for favorites
          addEventListenersForFavorites(user_id, genreBookCards);
          console.log("Calling displayGenreBooks function...");
      
          // Fetch and display books for the clicked genre
          const books = await fetchBooks(genreItem.name, maxResults, startIndex);
          console.log("Books fetched:", books);

          await displayGenreBooks(books);
      
        } catch (error) {
          console.error("Error fetching and displaying books:", error);
        } finally {
          window.location.href = `/genre/${clickedGenre.toLowerCase().replace(/\//g, "_")}`;
        }
      });      
    });
  }

  let currentPage = 1;
  const booksPerPage = 12;
  const genreBookCards = [];
  const user_id = document.getElementById("user-id").dataset.userId;
  console.log("User ID:", user_id);
 
  async function displayGenreBooks(books) {
    console.log("Displaying genre books with:", books);
    console.log("Genre card container found:", genreCardContainer);
  
    if (!genreCardContainer) {
      console.error("Genre card container not found");
      return;
    }

    // Clear previous content before adding new content
    genreCardContainer.innerHTML = "";
  
    const startIndex = (currentPage - 1) * booksPerPage;
    console.log("Current Page:", currentPage)
    const endIdx = startIndex + booksPerPage;
    console.log("Start Index:", startIndex);

    if (books.length === 0) {
      // Handle case where there are no books to display
      console.log("No books to display.");
      return;
    }
  
    for (const book of books.slice(startIndex, endIdx)) {
      const title = book.volumeInfo.title;
      const author = book.volumeInfo.authors ? book.volumeInfo.authors[0] : "Unknown Author";
      const publisher = book.volumeInfo.publisher || "Unknown Publisher";
      const coverUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : ""; // Update this line
      const isFavorite = await checkIfBookIsFavorite(title);
      console.log("Book Object:", book);
      console.log("Book details:", { title, author, publisher, coverUrl, isFavorite });

      const genreBookCard = formatGenreCard(
          coverUrl, 
          title,
          author,
          publisher,
          book.volumeInfo.previewLink,
          isFavorite
      );
      genreBookCards.push(genreBookCard);

      console.log('Contents of genreBookCards:', genreBookCards);

      if (genreCardContainer && genreBookCard instanceof Node) {
        console.log("Appending genre book card to container");
        // Append the HTML content for the current book to the genreCardContainer
        genreCardContainer.appendChild(genreBookCard);
      } else {
        console.error("Invalid genreCardContainer or genreBookCard");
      }
    }
    // Add event listeners for favorites
    addEventListenersForFavorites(user_id, genreBookCards, genreCardContainer.querySelectorAll(".favorite-button")); 
    genreCardContainer.style.visibility = "visible";   
  }  
   
  async function addEventListenersForFavorites(user_id, genreBookCards) {
    for (const card of genreBookCards) {
      const button = card.querySelector(".favorite-button");
      button.addEventListener("click", async () => {
        const title = card.getTitle();
        const isFavorite = card.isFavorite();        
  
        console.log("Star clicked for book:", title);
        console.log("Is favorite (before async operations):", isFavorite);
        console.log("User ID:", user_id);
  
        try {
          const fetchedGenreBookCard = await getGenreBookCardByTitle(title, genreBookCards);
          addBookToFavorites(user_id, fetchedGenreBookCard, title);
          removeBookFromFavorites(user_id, fetchedGenreBookCard, title);
  
          // Assuming that the genre book card needs to be updated after adding/removing from favorites
          const updatedIsFavorite = card.getAttribute("data-favorite") === "true";
          
          // Use the modified formatGenreCard function to update the card
          const updatedGenreBookCard = formatGenreCard(title, updatedIsFavorite);
  
          // Update the HTML content of the card
          card.replaceWith(updatedGenreBookCard);
  
          console.log("Is favorite (after async operations):", updatedIsFavorite);
          console.log("Current favorites after update:");
  
          checkCurrentFavorites();
        } catch (error) {
          console.error("Error fetching genreBookCard:", error);
        }
      });
    }
  }

  class GenreBookCard {
    constructor(coverUrl, title, author, publisher, previewLink, isFavorite) {
      this.coverUrl = coverUrl;
      this.title = title || '';
      this.author = author;
      this.publisher = publisher;
      this.previewLink = previewLink;
      this.isFavorite = isFavorite;
    }
  
    getTitle() {
      return this.title;
    }
  
    getAuthor() {
      return this.author;
    }
  
    getPublisher() {
      return this.publisher;
    }
  
    getCoverUrl() {
      return this.coverUrl;
    }
  
    getPreviewLink() {
      return this.previewLink;
    }
  
    isBookFavorite() {
      return this.isFavorite;
    }    
  }

  function formatGenreCard(coverUrl, title, author, publisher, previewLink, isFavorite) {
    console.log('Received parameters in formatGenreCard:', coverUrl, title, author, publisher, previewLink, isFavorite);
    const genreBookCard = new GenreBookCard(coverUrl, title, author, publisher, previewLink, isFavorite);
    return genreBookCard;
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

  async function fetchBooks(genre, maxResults, startIndex) {
    console.log("Fetching books by genre:", genre);
  
    const bookUrl = `/fetch_books_by_genre/${genre}&max_results=${maxResults}&start_index=${startIndex}`;
    console.log("API Request URL:", bookUrl);
  
    try {
      console.log("Fetching books by genre:", genre);
      const response = await axios.get(bookUrl);
      console.log("API Response:", response);
  
      console.log("Data retrieved from the API:", response.data);
  
      const books = response.data.items;
      console.log("Number of books received:", books.length);
      if (books.length) {
        console.log("Books received:", books);
        return books; // Return the books to be used in the next .then block
      } else {
        console.log("No books received.");
        return []; // Return an empty array if no books are received
      }
    } catch (error) {
      console.error("API Request Error:", error);
      return []; // Return an empty array in case of an error
    }
  }

  // Function to log the current favorites
  function checkCurrentFavorites() {
    // Use AJAX to get the current list of favorites from the server
    $.ajax({
      url: '/fetch_favorite_books',
      type: 'GET',
      success: function (data) {
        console.log("Current Favorites:", data);
      },
      error: function () {
        console.error("Error fetching current favorites");
      }
    });
  }

  // Event listener for the star icons
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target.classList.contains("outline-star") || target.classList.contains("solid-star")) {
      const button = target.parentElement;
      const title = button.getAttribute("data-title");
      const isFavorite = button.getAttribute("data-favorite") === "true";

      // Find the corresponding genreBookCard
      const genreBookCard = getGenreBookCardByTitle(title, genreBookCards);

      if (isFavorite) {
        // Remove the book from favorites.
        console.log("Removing from favorites - Title:", title, "User ID:", user_id, "Is Favorite:", isFavorite);
        removeBookFromFavorites(user_id, genreBookCard, title);
        console.log("Setting styles for outline star");
        button.querySelector(".solid-star").style.display = "none";
        button.querySelector(".outline-star").style.display = "inline-block";
        button.setAttribute("data-favorite", "false");
      } else {
        // Add the book to favorites.
        console.log("Adding to favorites - Title:", title, "User ID:", user_id, "Is Favorite:", isFavorite);
        addBookToFavorites(user_id, genreBookCard, title);
        console.log("Setting styles for solid star");
        button.querySelector(".outline-star").style.display = "none";
        button.querySelector(".solid-star").style.display = "inline-block";
        button.setAttribute("data-favorite", "true");
    }
    console.log("Current favorites after update:");
    checkCurrentFavorites();    
    }
  });

  // Make the AJAX request to add the book to favorites
  function addBookToFavorites(user_id, genreBookCard) {
    if (!genreBookCard) {
      console.error('genreBookCard is not defined');
      return;
    }
    // Debugging: Log the type of genreBookCard
    console.log('Type of genreBookCard:', typeof genreBookCard);

    // Debugging: Log the keys and methods of genreBookCard
    console.log('Keys and methods of genreBookCard:', Object.keys(genreBookCard));
    // Extract information from genreBookCard
    const title = genreBookCard.title;
  
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
  function removeBookFromFavorites(user_id, genreBookCard) {
    // Extract information from genreBookCard
    const title = genreBookCard.isBookFavorite();  

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

  let startIndex = 0;
  const maxResults = 40;
  // Event listener for the "Next" button
  $("#next-button").click(function () {
    console.log("Next button clicked");
    startIndex += maxResults;
    fetchBooks(genreName, maxResults, startIndex)
      .then(books => displayGenreBooks(books));
  });

  // Event listener for the "Previous" button
  $("#prev-button").click(function () {
    console.log("Previous button clicked");
    if (startIndex - maxResults >= 0) {
      startIndex -= maxResults;
      fetchBooks(genreName, maxResults, startIndex)
        .then(books => displayGenreBooks(books));
    }
  });
});

// Book card container book results
if (window.location.pathname === '/') {
  let bookContainer;
  let searchData;

  function formatOutput(imageUrl, title, author, publisher, previewLink, isFavorite) {
    console.log("isFavorite:", isFavorite);
    return `
      <div class="card col-md-4">
        <img src="${imageUrl}" class="card-img-top" alt="Book Image">
        <div class="card-body">
          <h5 class="card-title">${title}</h5>
          <p class="card-text author-text">Author: ${author}</p>
          <p class="card-text">Publisher: ${publisher}</p>
          <p>Is Favorite: ${isFavorite}</p>
          <a href="${previewLink}" class="read-button" target="_blank">Read Book</a>
          <button class="favorite-button" data-title="${title}" data-favorite="${isFavorite}">
            <img class="outline-star" src="/static/star-regular.svg" alt="Outline Star" style="${isFavorite ? 'display: none' : 'display: block'}">
            <img class="solid-star" src="/static/star-solid.svg" alt="Solid Star" style="${isFavorite ? 'display: block' : 'display: none'}">
          </button>
        </div>
      </div>
    `;
  } 
  
function checkIfBookIsFavorite(title, callback) {
  console.log("Checking if book is a favorite:", title);
  // Use AJAX to send a request to the server to check if the book is a favorite
  $.ajax({
      url: `/check_favorite?title=${title}`, // Define a route in app.py to handle this request
      type: 'GET',
      success: function (data) {
          // The server should return 'true' or 'false' as a response
          const isFavorite = data === 'true';
          callback(isFavorite);
      },
      error: function (xhr) {
          if (xhr.status === 401) {
              // Handle the case when the user is not authenticated
              // Assuming the book is not a favorite for non-authenticated users
              const isFavorite = false;
              callback(isFavorite);
          } else {
              // Handle other errors or display an error message
              console.error("Error checking if book is a favorite:", xhr.statusText);
          }
      }
  });
}


  // New function to display books in a grid layout
  let currentPage = 1;
  const booksPerPage = 12;

  async function displayBooks(books) {
    bookContainer.innerHTML = ""; // Clear previous results
  
    const startIdx = (currentPage - 1) * booksPerPage;
    const endIdx = startIdx + booksPerPage;
  
    for (const book of books.slice(startIdx, endIdx)) {
      checkIfBookIsFavorite(book.volumeInfo.title, (isFavorite) => {
  
      const bookCard = formatOutput(
        book.volumeInfo.imageLinks.thumbnail,
        book.volumeInfo.title,
        book.volumeInfo.authors[0],
        book.volumeInfo.publisher,
        book.volumeInfo.previewLink,
        isFavorite
      );
  
      bookContainer.innerHTML += bookCard;
      });
    }
  
    bookContainer.style.visibility = "visible";
  }  

  $(document).ready(function () {
    bookContainer = document.getElementById("book-container");
    console.log("Book container found")

    // Event listener for the search button
    $("#search").click(function () {
      bookContainer.innerHTML = ""; // Clear book container
      searchData = $("#search-box").val().trim();

      if (searchData === "") {
          displayError();
      } else {
          const bookUrl = `${baseBookUrl}&q=${searchData}`;
          axios
              .get(bookUrl)
              .then(function (response) {
                  console.log(response);
                  const books = response.data.items;
                  displayBooks(books);
              })
              .catch(function (error) {
                  console.error(error);
              });
      }
      $("#search-box").val("");
    });

    // Handle error for an empty search box.
    function displayError() {
      alert("Search term cannot be empty!");
    }

    // Function to fetch books
    function fetchBooks(query, maxResults, startIdx) {
      const bookUrl = `${baseBookUrl}&q=${query}&maxResults=${maxResults}&startIndex=${startIdx}`;
      axios
        .get(bookUrl)
        .then(function (response) {
            console.log(response);
            const books = response.data.items;
            displayBooks(books);
        })
        .catch(function (error) {
            console.error(error);
        });
    }
  
      // Initialize with an empty result
      displayBooks([]);

    // Event listener for the star icons
    bookContainer.addEventListener("click", (event) => {
      event.preventDefault();
      const target = event.target;
      console.log("Clicked on:", target);
      console.log("Parent element:", target.parentElement);
      if (target.classList.contains("outline-star") || target.classList.contains("solid-star")) {
        const button = target.parentElement;
        const title = button.getAttribute("data-title");
        const isFavorite = button.getAttribute("data-favorite") === "true";

        console.log("Title:", title);
        console.log("Is favorite:", isFavorite);

        const solidStar = button.querySelector(".solid-star");
        const outlineStar = button.querySelector(".outline-star");

        console.log("Solid Star:", solidStar);
        console.log("Outline Star:", outlineStar);

        if (isFavorite) {
          // Remove the book from favorites.
          console.log("Removing from favorites");
          removeBookFromFavorites(title);
          solidStar.style.display = "none";
          outlineStar.style.display = "block";
          button.setAttribute("data-favorite", "false");
        } else {
          // Add the book to favorites.
          console.log("Adding to favorites");
          addBookToFavorites(title);
          outlineStar.style.display = "none";
          solidStar.style.display = "block";
          button.setAttribute("data-favorite", "true");
        }
      }
    });

    // AJAX function to add a book to favorites
    function addBookToFavorites(title) {
      $.ajax({
        url: `/add_to_favorites`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ title: title }),
        success: function (data) {
          // Handle the success response
        },
        error: function () {
          // Handle the error or display an error message
        }
      });
    }
    
    function removeBookFromFavorites(title) {
      $.ajax({
        url: `/remove_from_favorites`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ title: title }),
        success: function (data) {
          // Handle the success response
        },
        error: function () {
          // Handle the error or display an error message
        }
      });
    }
    
    let startIndex = 0;
    const maxResults = 40; // You can adjust this value as needed

    // Event listener for the "Next" button
    $("#next-button").click(function () {
      startIndex += maxResults;
      fetchBooks(searchData, maxResults, startIndex);
    });

    // Event listener for the "Previous" button
    $("#prev-button").click(function () {
      if (startIndex - maxResults >= 0) {
          startIndex -= maxResults;
          fetchBooks(searchData, maxResults, startIndex);
      }
    });
  });
}