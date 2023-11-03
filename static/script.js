function randomRGB() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r},${g},${b})`;
}

const letters = document.querySelectorAll('.letter');

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
  { name: "romance", image: staticUrl + "romance.png" },
  { name: "scifi", image: staticUrl + "fantasy.png" },
  { name: "history", image: staticUrl + "history.png" },
  { name: "selfhelp", image: staticUrl + "self-care.png" },
  { name: "mystery", image: staticUrl + "mystery.png" },
  { name: "fiction", image: staticUrl + "fiction.png" },
];

const icons = [
  "/static/svg-icons/ufo-outline.svg",
  "/static/svg-icons/fire.svg",
  "/static/svg-icons/bullhorn-variant-outline.svg",
  "/static/svg-icons/handshake-outline.svg",
  "/static/svg-icons/magnify.svg",
  "/static/svg-icons/book-open-blank-variant.svg",
];

document.addEventListener("DOMContentLoaded", function () {
  const genreContainer = document.getElementById("genre-container");

  if (genreContainer) {
    console.log("Genre container found: ", genreContainer);

    genres.forEach((genre, index) => {
      const tile = document.createElement("div");
      tile.classList.add("genre-tile");

      // Creates image element for the MDI icon
      const icon = createSVGIcon(icons[index]);
      icon.classList.add("icon");

      const link = document.createElement("a");
      link.classList.add("genre-link");
      link.href = `/genre/${genre.name.toLowerCase().replace(/\//g, "_")}`;

      // Creates image element for the genre image
      const genreImage = document.createElement("img");
      genreImage.src = genre.image;

      // Creates variable to capture the current genre name
      let genreName = genre.name;

      const name = document.createElement("p");
      name.textContent = genreName;

      tile.appendChild(icon);
      tile.appendChild(genreImage);
      tile.appendChild(name);
      tile.appendChild(link);

      genreContainer.appendChild(tile);

      link.addEventListener("click", function (event) {
        event.preventDefault();
        console.log("Clicked on genre: " + genreName);
        window.location.href = link.href; // Redirect to the URL specified in the link
      });
    });
  } else {
    console.log("Genre container not found");
  }
});

if (window.location.pathname === '/') {
  let bookContainer;

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
          <button class="favorite-button" data-title="${title}" data-favorite="${isFavorite ? 'true' : 'false'}">
            <img class="outline-star" src="/static/star-regular.svg" alt="Outline Star">
            <img class="solid-star" src="/static/star-solid.svg" alt="Solid Star" style="display: none">
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
      error: function () {
        // Handle the error or display an error message
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
      const target = event.target;
      if (target.classList.contains("outline-star") || target.classList.contains("solid-star")) {
        const button = target.parentElement;
        const title = button.getAttribute("data-title");
        const isFavorite = button.getAttribute("data-favorite") === "true";

        if (isFavorite) {
          // Remove the book from favorites.
          removeBookFromFavorites(title);
          button.querySelector(".solid-star").style.display = "none";
          button.querySelector(".outline-star").style.display = "inline-block";
          button.setAttribute("data-favorite", "false");
        } else {
          // Add the book to favorites.
          addBookToFavorites(title);
          button.querySelector(".outline-star").style.display = "none";
          button.querySelector(".solid-star").style.display = "inline-block";
          button.setAttribute("data-favorite", "true");
        }
      }
    });

    // AJAX function to add a book to favorites
    function addBookToFavorites(title) {
      $.ajax({
        url: `/add_to_favorites?title=${title}`, // Define a route in app.py to handle this request
        type: 'POST',
        success: function (data) {
            // Handle the success response (e.g., book added to favorites)
        },
        error: function () {
            // Handle the error or display an error message
        }
      });
    }

    // AJAX function to remove a book from favorites
    function removeBookFromFavorites(title) {
      $.ajax({
        url: `/remove_from_favorites?title=${title}`, // Define a route in app.py to handle this request
        type: 'POST',
        success: function (data) {
            // Handle the success response (e.g., book removed from favorites)
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